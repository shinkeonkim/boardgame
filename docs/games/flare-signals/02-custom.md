# Flare Signals — 커스텀·인원 설계

| 설정 | 범위 | 원작 | 메모 |
|---|---|---|---|
| colors | 5/6 | 5 | 6색이면 만점이 30점이다 |
| sixth | plain/rainbow | — | rainbow: 모든 색 힌트에 반응하고, 무지개 자체로는 힌트를 줄 수 없다 |
| sixthCount | full/single | — | single: 숫자마다 1장(모두 마지막 한 장) |
| handSize | 0(자동)/1~6 | 자동 | 자동: 2~3명 5장, 4~5명 4장, 6명 3장 |
| hints | 3~12 | 8 | |
| fuses | 1~6 | 3 | |
| bombScore | zero/keep | zero | |
| emptyHints | on/off | off | |
| showClues / showPossibilities | | on / off | 초보 도움, 기억력 도전 |
| lastRound | on/off | on | |
| rounds, turnTimerSec | | | 공통 |

## 봇 약속

힌트를 받을 때 새로 가리켜진 가장 최근 카드가 **초점**이다.

- 초점이 버릴 차례 카드가 아니고 숫자 5 힌트도 아니면 → 플레이 힌트(지금 낼 수 있음)다.
- 초점이 버릴 차례 카드였거나 숫자 5 힌트면 → 보존 힌트다.

엔진은 이 해석에 필요한 정보(`focus`, `focusOnChop`)를 공개 정보로 기록한다. 사람에게는 카드 위의 작은 깃발(플레이/보존)로 보인다.

난이도별 측정값(봇끼리 3명 × 30판, 25점 만점):

| 난이도 | 평균 점수 |
|---|---|
| 어려움 | 20.8 |
| 보통 | 20.6 |
| 쉬움 | 11.3 |
