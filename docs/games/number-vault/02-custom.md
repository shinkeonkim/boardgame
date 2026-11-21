# Number Vault — 커스텀

| 설정 | 범위 | 기본 |
|---|---|---|
| maxNumber | 5~15 | 11 |
| jokers | 0~2 | 0 |
| startTiles | 0(자동)~6 | 자동 |
| chain | on/off | on |
| chooseColor | on/off | on |
| showMisses | on/off | on |
| rounds · turnTimerSec | | 1 · 0 |

봇은 `candidates()`로 가려진 타일의 후보 숫자를 좁힌다. 좁히는 근거는 네 가지다.
- 색이 같아야 한다.
- 본 타일은 제외한다.
- 틀린 기록은 제외한다.
- 앞뒤 순서로 위아래 경계를 좁힌다.

어려움 봇은 쉬움 봇을 40판 모두 이겼다.
