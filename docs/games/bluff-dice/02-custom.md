# Bluff Dice — 커스텀

| 설정 | 범위 | 기본 | 메모 |
|---|---|---|---|
| dice | 1~8 | 5 | |
| faces | 4~8 | 6 | |
| wildOnes | on/off | on | |
| aceBids | on/off | on | wildOnes가 켜져 있을 때만 |
| exactCall · maxDice | | on · 5 | |
| palifico | on/off | off | |
| penalty | die · diff | die | |
| rounds · turnTimerSec | | 1 · 0 | |

봇은 모르는 주사위를 이항분포로 계산한다. 어려움 봇은 다른 사람이 부른 숫자를 그 사람이 가졌다고 추정한다.

| 대결 | 어려움 봇 승률 |
|---|---|
| 2명, 어려움 vs 쉬움 | 95% |
| 4명, 어려움 1 vs 쉬움 3 | 92% |
