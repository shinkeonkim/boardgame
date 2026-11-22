/**
 * 아주 작은 Prometheus 내보내기 (의존성 없음).
 *   - 카운터·히스토그램: 일이 생길 때 inc/observe
 *   - 게이지: 수집할 때마다 collect 콜백이 지금 상태를 계산 (방 수·접속자 등)
 * 내부 전용 포트(METRICS_PORT, 기본 9464)의 /metrics 로만 내보낸다 — Ingress·터널에 연결하지 않는다.
 */
import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { monitorEventLoopDelay } from 'node:perf_hooks';

type Labels = Record<string, string | number>;
interface Family {
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  /** 라벨 문자열 → 값 */
  values: Map<string, number>;
  buckets?: number[];
}

const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
const key = (labels: Labels = {}) =>
  Object.keys(labels)
    .sort()
    .map((k) => `${k}="${esc(String(labels[k]))}"`)
    .join(',');

export class Metrics {
  private families = new Map<string, Family>();
  private collectors: (() => void)[] = [];
  private loop = monitorEventLoopDelay({ resolution: 20 });
  private started = Date.now();

  constructor(private base: Labels = {}) {
    this.loop.enable();
  }

  private family(name: string, type: Family['type'], help: string, buckets?: number[]) {
    let f = this.families.get(name);
    if (!f) this.families.set(name, (f = { type, help, values: new Map(), buckets }));
    return f;
  }

  /** 카운터 정의 (help를 처음 한 번만 넘기면 된다) */
  counter(name: string, help: string) {
    this.family(name, 'counter', help);
    return (labels: Labels = {}, by = 1) => this.inc(name, labels, by);
  }

  inc(name: string, labels: Labels = {}, by = 1) {
    const f = this.family(name, 'counter', '');
    const k = key({ ...this.base, ...labels });
    f.values.set(k, (f.values.get(k) ?? 0) + by);
  }

  /** 게이지 값 설정 (collect 콜백 안에서 부른다) */
  set(name: string, help: string, value: number, labels: Labels = {}) {
    this.family(name, 'gauge', help).values.set(key({ ...this.base, ...labels }), value);
  }

  histogram(name: string, help: string, buckets: number[]) {
    this.family(name, 'histogram', help, buckets);
    return (value: number, labels: Labels = {}) => {
      const f = this.families.get(name)!;
      const lb = { ...this.base, ...labels };
      for (const b of f.buckets!) this.bump(f, key({ ...lb, le: b }), value <= b ? 1 : 0); // 0인 버킷도 항상 내보낸다
      this.bump(f, key({ ...lb, le: '+Inf' }), 1);
      this.bump(f, `__sum|${key(lb)}`, value);
      this.bump(f, `__count|${key(lb)}`, 1);
    };
  }

  private bump(f: Family, k: string, by: number) {
    f.values.set(k, (f.values.get(k) ?? 0) + by);
  }

  /** 수집할 때마다 불리는 콜백 (게이지를 새로 계산) */
  onCollect(fn: () => void) {
    this.collectors.push(fn);
  }

  render(): string {
    // 게이지는 매번 새로 계산하므로 비운다
    for (const f of this.families.values()) if (f.type === 'gauge') f.values.clear();
    this.collectProcess();
    for (const c of this.collectors) c();
    const out: string[] = [];
    for (const [name, f] of this.families) {
      if (f.help) out.push(`# HELP ${name} ${f.help}`);
      out.push(`# TYPE ${name} ${f.type}`);
      for (const [k, v] of f.values) {
        if (k.startsWith('__sum|')) out.push(`${name}_sum${wrap(k.slice(6))} ${v}`);
        else if (k.startsWith('__count|')) out.push(`${name}_count${wrap(k.slice(8))} ${v}`);
        else out.push(`${name}${f.type === 'histogram' ? '_bucket' : ''}${wrap(k)} ${v}`);
      }
    }
    return out.join('\n') + '\n';
  }

  private collectProcess() {
    const mem = process.memoryUsage();
    this.set('process_resident_memory_bytes', '프로세스 메모리(RSS)', mem.rss);
    this.set('nodejs_heap_used_bytes', 'V8 힙 사용량', mem.heapUsed);
    const cpu = process.cpuUsage();
    this.set('process_cpu_seconds_total', 'CPU 사용 시간(누적, 초)', (cpu.user + cpu.system) / 1e6);
    this.set('process_uptime_seconds', '프로세스가 뜬 지 몇 초', (Date.now() - this.started) / 1000);
    this.set('nodejs_eventloop_lag_p99_seconds', '이벤트 루프 지연 p99(초)', this.loop.percentile(99) / 1e9);
    this.loop.reset();
  }

  /** 내부 포트에 /metrics 띄우기 (extra: 같은 내부 포트에 붙일 다른 경로 — 관리자 API) */
  serve(port: number, extra?: (req: IncomingMessage, res: ServerResponse) => boolean): Server {
    const s = createServer((req, res) => {
      if (extra?.(req, res)) return;
      if (req.url !== '/metrics') return void res.writeHead(404).end();
      res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' }).end(this.render());
    });
    s.listen(port, () => console.log(`metrics listening on :${port}/metrics`));
    return s;
  }
}

const wrap = (k: string) => (k ? `{${k}}` : '');

/** 아무것도 하지 않는 기본값 (테스트 등) */
export const noMetrics = new Metrics();
