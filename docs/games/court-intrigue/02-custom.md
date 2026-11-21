# Court Intrigue — 커스텀

| 설정 | 범위 | 기본값 |
|---|---|---|
| copies | 2~4 | 3 |
| startCoins | 0~5 | 2 |
| coupCost | 5~9 | 7 |
| mustCoup | 8~14 | 10 |
| assassinCost | 2~5 | 3 |
| stealAmount | 1~3 | 2 |
| reactionSec | 5~40 | 12 |
| twoPlayerHandicap | on / off | on |
| rounds · turnTimerSec | 공통 설정 | |

## 봇

- 공개된 카드와 내 카드로 각 역할이 남은 장수를 세고, 이를 바탕으로 `roleProb`(그 역할을 쥐고 있을 확률)를 계산한다.
- 도전: 상대가 그 역할을 가졌을 확률이 낮을 때 도전한다. 내가 위험할 때는 기준을 높여 더 과감하게 도전한다.
- 허풍: 쉬움·보통·어려움 순으로 허풍 비율이 다르다.
- 2명 대결에서 어려움이 쉬움을 77% 이긴다.
