import { PIECES } from '@bg/corner-claim-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { COLORS, Logo, PieceIcon } from './theme';

const Mini = ({ cells, mark }: { cells: [number, number, number][]; mark?: [number, number, 'ok' | 'no'][] }) => (
  <div className="cc-board demo" style={{ ['--n' as string]: 6, width: 132 }}>
    {Array.from({ length: 36 }, (_, i) => {
      const x = i % 6;
      const y = (i - x) / 6;
      const c = cells.find(([cx, cy]) => cx === x && cy === y);
      const mk = mark?.find(([mx, my]) => mx === x && my === y);
      return (
        <div key={i} className={`cc-cell ${c ? 'filled' : ''} ${mk ? (mk[2] === 'ok' ? 'pv-ok' : 'pv-bad') : ''}`} style={c ? { background: COLORS[c[2]].fill } : mk ? { ['--pv' as string]: COLORS[0].fill } : undefined} />
      );
    })}
  </div>
);

export const guide: GuideDef = {
  subtitle: '모서리 땅따먹기 · 모서리로만 이어 가기',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            색마다 조각 21개(모두 89칸)를 가지고 시작해요. 조각을 최대한 많이 판에 놓아, 끝났을 때 <b>손에 남은 칸이 가장 적은 사람</b>이 이겨요.
          </p>
          <div className="g-row center cc-g-pieces">
            {PIECES.map((p, i) => (
              <PieceIcon key={p.id} cells={p.orients[0]} color={i % 4} size={7} />
            ))}
          </div>
          <Clip src="guide/play.mp4" caption="조각을 고르고 돌려 보며 자리를 찾아요" />
        </>
      ),
    },
    {
      id: 'start',
      title: '첫 조각',
      content: <p>각 색의 첫 조각은 자기 귀퉁이 ★ 칸을 덮어야 해요. 둘이서 모드는 가운데 가까운 두 점이 시작이에요.</p>,
    },
    {
      id: 'corner',
      title: '모서리로만 잇기',
      content: (
        <>
          <div className="g-row">
            <Mini cells={[[0, 0, 0], [1, 0, 0], [1, 1, 0]]} mark={[[2, 2, 'ok'], [2, 1, 'no']]} />
            <div className="g-note">
              <span>
                새 조각은 <b>내 색 조각과 모서리(꼭짓점)로 닿아야</b> 하고, <b>변으로 닿으면 안 돼요</b>. 초록 칸은 가능, 빨간 칸은 안 돼요. 다른 색과는 변으로 닿아도 괜찮아요.
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'end',
      title: '끝과 점수',
      content: (
        <ul className="g-list">
          <li>놓을 곳이 없는 색은 그대로 끝나고 순서를 건너뛰어요. 모든 색이 끝나면 게임 끝.</li>
          <li>손에 남은 칸마다 −1점. 조각을 모두 놓으면 +15, 마지막 조각이 1칸짜리였으면 +5 더.</li>
        </ul>
      ),
    },
    {
      id: 'players',
      title: '인원',
      content: (
        <ul className="g-list">
          <li>4명: 한 사람 한 색.</li>
          <li>2명: 한 사람이 두 색(파랑·빨강 / 노랑·초록)을 번갈아. 또는 「둘이서」 14×14 모드.</li>
          <li>3명: 각자 한 색, 넷째 색(초록)은 차례마다 돌아가며 둬요 (점수에는 안 들어가요).</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>아래에서 조각을 고르고, 판 위에 올리면 놓일 자리가 보여요 (초록 = 가능, 빨강 = 불가와 이유).</li>
          <li>회전 R · 뒤집기 F (또는 버튼). 휴대폰에서는 칸을 누른 뒤 「놓기」.</li>
          <li>큰 조각부터 쓰고, 상대가 뻗어 올 모서리를 먼저 막는 게 요령이에요.</li>
        </ul>
      ),
    },
  ],
};
