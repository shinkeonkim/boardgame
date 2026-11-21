import { CLASSIC } from '@bg/tile-atelier-engine';
import { Clip, type GuideDef } from '@bg/web/guide-kit';
import { Logo, TILE, TileView } from './theme';

export const guide: GuideDef = {
  subtitle: '타일 공방 · 가져오고, 채우고, 붙이고',
  icon: <Logo size={28} />,
  sections: [
    {
      id: 'goal',
      title: '목표',
      content: (
        <>
          <p>
            타일을 모아 내 벽을 꾸며요. 타일을 벽에 놓을 때마다 점수가 나고, 이어 붙일수록 커져요. 누군가 벽의 <b>가로줄 하나를 완성</b>하면 그 판이 끝나고 보너스를 더해 가장 높은 점수가 이겨요.
          </p>
          <Clip src="guide/play.mp4" caption="한 색을 골라 줄에 놓고, 판이 끝나면 벽으로 옮겨요" />
        </>
      ),
    },
    {
      id: 'take',
      title: '가져오기',
      content: (
        <ol className="g-steps">
          <li>
            공장 하나(또는 가운데)에서 <b>한 색을 모두</b> 가져와요.
          </li>
          <li>공장에서 가져왔다면 남은 타일은 가운데로 밀려나요.</li>
          <li>
            그 판에 가운데에서 처음 가져가는 사람은 <TileView color={0} first size={18} /> 첫 플레이어 표시도 가져가요 — 다음 판을 먼저 시작하지만 바닥 감점 1칸.
          </li>
        </ol>
      ),
    },
    {
      id: 'lines',
      title: '패턴 줄',
      content: (
        <ul className="g-list">
          <li>왼쪽 패턴 줄은 1·2·3·4·5칸이에요. 가져온 타일을 한 줄에 놓아요.</li>
          <li>한 줄에는 한 색만. 벽의 그 가로줄에 이미 있는 색은 놓을 수 없어요.</li>
          <li>
            넘치는 타일은 <b>바닥</b>으로 떨어져 감점 ({CLASSIC.floor.join(' ')}).
          </li>
        </ul>
      ),
    },
    {
      id: 'wall',
      title: '벽에 붙이기',
      content: (
        <>
          <div className="g-row center">
            {[0, 1, 2, 3, 4].map((i) => (
              <TileView key={i} color={i} size={22} />
            ))}
          </div>
          <ul className="g-list">
            <li>공장과 가운데가 모두 비면, 꽉 찬 줄마다 타일 1장이 벽의 같은 가로줄로 가요 (나머지는 버려요).</li>
            <li>
              벽의 칸은 색마다 정해져 있어요 (옅게 보이는 무늬). <b>자유 벽</b> 설정이면 같은 가로·세로줄에 같은 색만 없으면 어디든.
            </li>
            <li>
              점수: 혼자 있으면 1점. 가로로 이어진 수 + 세로로 이어진 수만큼.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'end',
      title: '끝과 보너스',
      content: (
        <ul className="g-list">
          <li>벽에 놓은 뒤 누군가 가로줄을 완성했으면 게임 끝.</li>
          <li>
            보너스: 가로줄마다 +{CLASSIC.rowBonus}, 세로줄마다 +{CLASSIC.colBonus}, 한 색 {TILE.length - 1}장을 모두 놓으면 +{CLASSIC.colorBonus}.
          </li>
          <li>동점이면 가로줄을 더 많이 채운 사람.</li>
        </ul>
      ),
    },
    {
      id: 'custom',
      title: '변형',
      content: (
        <ul className="g-list">
          <li>색 4~6(벽 크기도 같이), 색마다 타일 수, 공장 수·공장마다 타일.</li>
          <li>자유 벽, 바닥 감점(약하게/원작/세게), 보너스 크기, 정해진 판 수로 끝내기.</li>
        </ul>
      ),
    },
    {
      id: 'screen',
      title: '화면 사용법',
      content: (
        <ul className="g-list">
          <li>공장의 타일을 누르면 그 색이 골라지고, 놓을 수 있는 줄이 빛나요. 줄을 누르면 끝.</li>
          <li>바닥이나 「바닥에 버리기」로 일부러 버릴 수도 있어요.</li>
          <li>자유 벽이면 판 끝에 모두 동시에 벽 칸을 골라요.</li>
        </ul>
      ),
    },
  ],
};
