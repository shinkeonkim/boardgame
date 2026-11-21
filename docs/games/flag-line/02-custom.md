# Flag Line — 커스텀

## 설정

| 설정 | 범위 | 기본값 |
|---|---|---|
| flags | 5~11 | 9 |
| size | 2~4 | 3 |
| colors | 4~6 | 6 |
| maxValue | 8~12 | 10 |
| handSize | 5~9 | 7 |
| flagsToWin | 0 = 과반 | 과반 |
| adjacentToWin | 0 = 끔 | 3 |
| autoClaim | on / off | on |
| rounds · turnTimerSec | 공통 | |

`validateConfig`는 카드 수가 깃발 × 대형 × 2 이상인지 확인한다.

## 봇

- `potential()`로 부분 대형의 잠재력을 빠르게 어림한다. 필요한 특정 카드가 아직 남아 있는지를 본다.
- 놓을 자리를 정할 때는 그 깃발에서 내 쪽과 상대 쪽의 잠재력 차이가 얼마나 좋아지는지 계산한다.
- 어려움: 연속 깃발의 가치까지 더한다.
- 어려움 vs 쉬움 30판에서 어려움이 모두 이겼다.
