import { useRef, useState } from 'react';
import { botsText } from '@bg/core';
import { SiteNotice, playShuffleDeal } from '@bg/web';
import { AlertBanner, ConfirmButton, EmoteButton, Modal, Notice, SegmentedControl, Stepper, ThemeToggle, Toggle, TurnBanner, TurnSplash, TurnSteps, TurnTimer, Icon, ICON_NAMES, iconize, NoticeSlot, PlayingCard, CardBack, ChipSvg, CountBadge } from '@bg/ui';

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
  const [toast, setToast] = useState<string | null>(null);
  const dealRoot = useRef<HTMLDivElement>(null);
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
        <p className="small muted">
          잠깐 뜨는 알림(「내 차례!」·경고)은 <code>NoticeSlot</code>으로 <b>차례 띠 위에만</b> 겹쳐요. 게임 판·손패를 가리지 않아요. 띠가 없는 화면(대기실·결과)에서는 화면 아래 토스트로.
        </p>
        <TurnBanner mine title="카드를 1장 내려놓으세요" hint="내 탐험대에 놓거나 같은 색 버림 더미에 버리세요" shake={shake} side={<><TurnSteps steps={['① 내려놓기', '② 가져오기']} current={0} /><TurnTimer secs={42} /></>} />
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
            차례 알림 (띠 위에)
          </button>
          <button
            className="btn"
            onClick={() => {
              setToast('지금은 내 차례가 아니에요');
              setTimeout(() => setToast(null), 2600);
            }}
          >
            경고 알림 (띠 위에)
          </button>
          <EmoteButton onSend={() => {}} />
          <button className="btn" onClick={() => setModal(true)}>
            모달 열기
          </button>
        </div>
      </section>

      <section className="panel ds-block">
        <h2>화면 영역</h2>
        <p className="small muted">
          게임 화면은 세 영역으로 나눠요(<code>TableLayout</code>). 영역끼리 겹치지 않고, 문구가 바뀌어도 각 영역의 크기는 그대로예요(E2E가 1px까지 확인).
        </p>
        <div className="zones">
          <div className="zones-wide">
            <div className="z z-note">
              <b>① 알림</b> 차례 띠 — 지금 할 일·타이머·단계. 잠깐 뜨는 알림도 여기에만
            </div>
            <div className="z z-board">
              <b>② 게임 판</b> 판·테이블·내 손패. 남는 높이를 다 쓰고 화면 맞춤 배율로 키움
            </div>
            <div className="z z-side">
              <b>③ 패널</b> 좌석·점수·규칙 요약·기록
            </div>
          </div>
          <div className="zones-phone">
            <div className="z z-note">
              <b>①</b> 알림
            </div>
            <div className="z z-board">
              <b>②</b> 판 + 손패 (화면의 66%, 넘치면 그 안에서만 스크롤)
            </div>
            <div className="z z-side">
              <b>③</b> 패널 (아래로)
            </div>
          </div>
        </div>
        <ul className="small ds-rules">
          <li>내 손패와 할 일 버튼은 ② 안에 — 폰에서도 스크롤 없이 보여야 해요 (<code>scripts/qa/mobile-fit.mjs</code>)</li>
          <li>판을 덮는 큰 알림은 쓰지 않아요. 남의 차례는 띠와 좌석 강조로, 내 차례는 띠 위 알림과 소리로</li>
          <li>버튼·안내 줄이 생겼다 사라질 땐 자리를 미리 잡아 둬요(visibility) — 영역 크기가 출렁이지 않게</li>
        </ul>
      </section>

      <section className="panel ds-block">
        <h2>아이콘</h2>
        <p className="small muted">
          직접 그린 선 아이콘 {ICON_NAMES.length}개 (<code>{'<Icon name="…" />'}</code>) — 24 격자·선 1.9·currentColor라 글자색과 라이트/다크를 따라요. 이모지 대신 써요. 게임이 넘기는 문자열은 <code>iconize()</code>가 이모지를 아이콘으로 바꿔요: {iconize('👥 2~6명 · ⏱ 20분 · 🤖 봇과 함께')}
        </p>
        <div className="icon-grid">
          {ICON_NAMES.map((n) => (
            <figure key={n} title={n}>
              <Icon name={n} size={26} />
              <figcaption>{n}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel ds-block">
        <h2>카드 · 칩</h2>
        <p className="small muted">
          카드는 <code>.pc</code> 키트(크림 테두리·광택·세리프 숫자), 뒷면은 「카드 꾸미기」의 <code>--card-back</code>을 따라요. 숫자가 든 칩·배지는 <code>CountBadge</code>(가독성 검사 대상).
        </p>
        <div className="row wrap ds-pieces" ref={dealRoot}>
          {[
            { id: 's1', suit: 0, rank: 1 },
            { id: 'h13', suit: 1, rank: 13 },
            { id: 'd12', suit: 2, rank: 12 },
            { id: 'c7', suit: 3, rank: 7 },
            { id: 'j', suit: -1, rank: 1 },
          ].map((c) => (
            <PlayingCard key={c.id} card={c} size="md" />
          ))}
          <CardBack size="md" />
          <span className="row tight">
            {['#d0453a', '#2f6fb0', '#2f9e6a', '#2b2b33', '#d4a017'].map((col) => (
              <ChipSvg key={col} fill={col} size={40} />
            ))}
          </span>
          <CountBadge n={12} />
          <CountBadge n={0} />
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => playShuffleDeal({ origin: '.ds-pieces', seats: '.ds-seat', hand: null })}>
            섞기 · 나눠 주기 (deal-fx)
          </button>
          <span className="row tight">
            {['민지', '도윤', '서연'].map((n) => (
              <span key={n} className="tag ds-seat">
                {n}
              </span>
            ))}
          </span>
        </div>
      </section>

      <section className="panel ds-block">
        <h2>봇 표시</h2>
        <p className="small muted">게임마다 같은 자리·같은 말로 (<code>botsText()</code>, docs/ux-writing.md). 「사람끼리만」이면 이유와 할 일을 함께 써요.</p>
        <ul className="game-stats">
          <li>
            <Icon name="bot" /> {botsText({}).short}
          </li>
          <li className="no-bots">
            <Icon name="users" /> {botsText({ bots: false }).short}
          </li>
        </ul>
        <p className="small">
          <b>{botsText({}).short}</b> — {botsText({}).long}
          <br />
          <b>{botsText({ bots: false }).short}</b> — {botsText({ bots: false, players: { min: 2 } }).long}
        </p>
      </section>

      <section className="panel ds-block">
        <h2>점검 공지</h2>
        <p className="small muted">관리자(/admin)가 보낸 공지·점검 모드는 모든 방과 게임 첫 화면 맨 위에 띠로 떠요 (<code>SiteNotice</code>).</p>
        <div className="ds-notice">
          <SiteNotice text="10분 뒤 점검해요. 하던 게임은 마무리해 주세요" />
        </div>
        <div className="ds-notice">
          <SiteNotice text={null} maintenance />
        </div>
      </section>

      <TurnSplash splash={splash} />
      {toast && (
        <NoticeSlot deps={toast}>
          <div className="toast" role="status">
            {toast}
          </div>
        </NoticeSlot>
      )}
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
