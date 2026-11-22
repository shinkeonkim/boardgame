import { useState } from 'react';
import { AlertBanner, ConfirmButton, EmoteButton, Modal, Notice, SegmentedControl, Stepper, ThemeToggle, Toggle, TurnBanner, TurnSplash, TurnSteps, TurnTimer, Icon } from '@bg/ui';

const COLORS = [
  ['--bg', '바탕'],
  ['--panel', '패널'],
  ['--panel-2', '패널 2'],
  ['--ink', '글자'],
  ['--muted', '보조 글자'],
  ['--line', '선'],
  ['--accent', '강조'],
  ['--gold', '하이라이트'],
  ['--info', '정보'],
  ['--ok', '성공'],
  ['--danger', '위험'],
];

/** 디자인 시스템 진열장: 토큰과 공용 컴포넌트를 실제로 그려 본다 (테마를 바꿔 가며 확인) */
export function DesignPage() {
  const [num, setNum] = useState(9);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState('a');
  const [modal, setModal] = useState(false);
  const [splash, setSplash] = useState<{ text: string; sub?: string; mine: boolean; k: number } | null>(null);
  const [shake, setShake] = useState(0);
  return (
    <div className="design-page">
      <header className="section-head">
        <div>
          <h1>디자인 시스템</h1>
          <p className="muted">
            <code>packages/ui</code> — 모든 게임과 포털이 같은 토큰·컴포넌트를 쓴다. 게임 전용 UI가 여러 게임에 쓸 만해지면 여기로 올린다.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="panel ds-block">
        <h2>색 토큰</h2>
        <div className="swatches">
          {COLORS.map(([v, label]) => (
            <div key={v} className="swatch">
              <span style={{ background: `var(${v})` }} />
              <b>{label}</b>
              <code>{v}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="panel ds-block">
        <h2>버튼 · 칩 · 태그</h2>
        <div className="row wrap">
          <button className="btn primary">기본 동작</button>
          <button className="btn">보조</button>
          <button className="btn ghost">고스트</button>
          <button className="btn danger">위험</button>
          <button className="btn primary" disabled>
            비활성
          </button>
          <button className="btn ghost tiny">작은 버튼</button>
          <ConfirmButton label="방 닫기" warning="모두 나가게 돼요" onConfirm={() => {}} />
        </div>
        <div className="row wrap">
          <span className="chip">칩</span>
          <span className="chip on">켜진 칩</span>
          <span className="tag">태그</span>
          <span className="tag mine">나</span>
          <span className="tag results">결과 보는 중</span>
          <span className="tag ready">대기 중</span>
        </div>
      </section>

      <section className="panel ds-block">
        <h2>설정 입력</h2>
        <Stepper label="보드 크기" hint="원작 9×9" value={num} min={5} max={13} format={(v) => `${v}×${v}`} onChange={setNum} />
        <Toggle label="대각선 방향 카드" hint="끄면 상하좌우만" checked={on} onChange={setOn} />
        <SegmentedControl
          value={seg}
          onChange={setSeg}
          label="예시"
          options={[
            { value: 'a', label: '2명' },
            { value: 'b', label: '3명' },
            { value: 'c', label: '4명' },
          ]}
        />
        <label className="field">
          <span>입력</span>
          <input placeholder="예: 민지" />
        </label>
      </section>

      <section className="panel ds-block">
        <h2>안내 · 경고</h2>
        <Notice>
          <Icon name="flag" /> 지난 게임이 끝났어요. 로비로 돌아오면 함께 시작할 수 있어요.</Notice>
        <div className="alert">암호가 틀렸어요</div>
        <AlertBanner title="남은 돌 6개">{' '}· 다 쓰면 판이 끝나요</AlertBanner>
        <AlertBanner title="덱 2장 남음" critical sub="이번 바퀴 안에 끝날 수 있어요">
          {' '}
          · 마지막 장을 가져가면 판이 끝나요
        </AlertBanner>
      </section>

      <section className="panel ds-block">
        <h2>게임 화면 컴포넌트</h2>
        <TurnBanner mine title="내 차례예요 · 카드를 1장 내려놓으세요" hint="내 탐험대에 놓거나 같은 색 버림 더미에 버리세요" shake={shake} side={<><TurnSteps steps={['① 내려놓기', '② 가져오기']} current={0} /><TurnTimer secs={42} /></>} />
        <TurnBanner mine={false} title="민지 님의 차례예요" hint="왕관을 움직이는 중… · 다음은 내 차례예요" side={<TurnTimer secs={8} />} />
        <div className="row wrap">
          <button className="btn" onClick={() => setShake((n) => n + 1)}>
            배너 흔들기 (안 되는 행동)
          </button>
          <button
            className="btn"
            onClick={() => {
              setSplash({ text: '내 차례!', sub: '카드를 1장 내려놓고, 1장 가져오세요', mine: true, k: Date.now() });
              setTimeout(() => setSplash(null), 1400);
            }}
          >
            차례 스플래시
          </button>
          <EmoteButton onSend={() => {}} />
          <button className="btn" onClick={() => setModal(true)}>
            모달 열기
          </button>
        </div>
      </section>

      <TurnSplash splash={splash} />
      {modal && (
        <Modal onClose={() => setModal(false)} label="예시 모달">
          <header className="g-head">
            <div className="g-title">
              <h2>예시 모달</h2>
            </div>
            <button className="icon-btn g-close" onClick={() => setModal(false)} aria-label="닫기">
              <Icon name="x" />
            </button>
          </header>
          <div className="g-body">
            <p>바깥을 누르거나 Esc로 닫혀요. 열려 있는 동안 뒤 페이지는 스크롤되지 않아요. 게임 방법 모달이 이 틀을 써요.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
