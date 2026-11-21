import { describe, expect, it } from 'vitest';
import { autoMove, crownMarch } from '@bg/crown-march-engine';
import { Metrics } from './metrics';
import { Rooms } from './rooms';

describe('Metrics', () => {
  it('Prometheus 텍스트 형식 (카운터·게이지·히스토그램)', () => {
    const m = new Metrics({ game: 'g' });
    const hits = m.counter('t_hits_total', '맞은 수');
    hits({ kind: 'a' });
    hits({ kind: 'a' }, 2);
    const h = m.histogram('t_dur_seconds', '걸린 시간', [1, 10]);
    h(5);
    m.onCollect(() => m.set('t_rooms', '방', 3));
    const out = m.render();
    expect(out).toContain('# TYPE t_hits_total counter');
    expect(out).toContain('t_hits_total{game="g",kind="a"} 3');
    expect(out).toContain('t_rooms{game="g"} 3');
    expect(out).toContain('t_dur_seconds_bucket{game="g",le="1"}');
    expect(out).not.toContain('t_dur_seconds_bucket{game="g",le="1"} 1');
    expect(out).toContain('t_dur_seconds_bucket{game="g",le="10"} 1');
    expect(out).toContain('t_dur_seconds_count{game="g"} 1');
    expect(out).toContain('process_resident_memory_bytes');
  });

  it('방 흐름이 카운터에 남는다', () => {
    const m = new Metrics({ game: 'crown-march' });
    const rooms = new Rooms(crownMarch, () => {}, { metrics: m });
    const { room, member: host } = rooms.create('호스트');
    rooms.connect(room, host);
    const { member: p } = rooms.join(room.code, { name: 'p' });
    rooms.connect(room, p);
    expect(() => rooms.join('ZZZZ', { name: 'x' })).toThrow();
    rooms.start(room, host);
    const bySeat = [host, p].sort((a, b) => a.seat! - b.seat!);
    for (let i = 0; i < 400 && crownMarch.status(room.match as never) === 'playing'; i++) {
      rooms.move(room, bySeat[crownMarch.turn(room.match as never)], autoMove(room.match as never));
    }
    rooms.close(room, host);
    const out = m.render();
    expect(out).toContain('bg_rooms_created_total{game="crown-march"} 1');
    expect(out).toContain('bg_joins_total{game="crown-march",kind="player"} 2');
    expect(out).toContain('bg_join_failures_total{game="crown-march",reason="not_found"} 1');
    expect(out).toContain('bg_matches_started_total{game="crown-march",players="2"} 1');
    expect(out).toContain('bg_matches_finished_total{game="crown-march",players="2"} 1');
    expect(out).toContain('bg_rooms_removed_total{game="crown-march",reason="closed"} 1');
    expect(out).toMatch(/bg_moves_total\{game="crown-march"\} \d+/);
    expect(out).toContain('bg_match_duration_seconds_count{game="crown-march"} 1');
  });
});
