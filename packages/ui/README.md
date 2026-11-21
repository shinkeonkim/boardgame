# @bg/ui — 디자인 시스템

포털과 모든 게임이 같은 토큰·컴포넌트를 쓴다. 실제 모습은 포털 **`/design`** 페이지(라이트/다크 전환하며 확인).

```ts
import '@bg/ui/styles.css';          // tokens → base → overlay → modal → game
import { ThemeToggle, Stepper, TurnBanner } from '@bg/ui';
```

## 테마

- `<html data-theme="light|dark">`, 속성이 없으면 시스템 설정. 선택은 `localStorage['bg:theme']`에 저장되어 **포털·모든 게임이 공유**한다.
- 깜빡임 방지: index.html `<head>`에 `THEME_BOOT_SCRIPT`(`@bg/ui/theme-boot`)를 인라인 — 게임은 `gameViteConfig`, 포털은 vite 플러그인이 자동으로 넣는다.
- 새 색을 정의할 때는 항상 세 곳: `:root`(라이트) · `:root[data-theme='dark']` · `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`.

## 토큰 (styles/tokens.css)

| 토큰 | 쓰임 |
|---|---|
| `--bg` `--panel` `--panel-2` `--paper` | 바탕 · 카드/패널 · 꼬리말 등 한 단계 다른 면 · 종이 질감 |
| `--ink` `--muted` `--line` | 글자 · 보조 글자 · 선 |
| `--accent` / `--accent-ink` | 주 동작(시작·만들기·내 차례) |
| `--gold` / `--gold-ink` | 하이라이트(선택·경로·경고 띠) |
| `--info` / `--info-ink` | 보조 동작(초대받은 방 들어가기) |
| `--ok` `--danger` | 성공 · 위험(방 닫기·막힌 칸·critical 경고) |
| `--overlay` `--shadow` `--shadow-lg` | 모달 바깥 · 그림자 |
| `--sp-1…6` `--r-sm/md/lg/xl/full` | 간격 · 둥근 정도 |
| `--ease-out` `--ease-bounce` `--dur-fast` `--dur` | 움직임 |

게임 전용 토큰(카드 무늬 `--sun…`, 가문 색 `--s0…`, 보드 나무색 `--board…`)은 각 게임 `game.css` 맨 위에 같은 규칙으로 둔다.

## 컴포넌트

| 이름 | 용도 | 클래스 |
|---|---|---|
| `ThemeToggle` | `variant="segmented"`(포털·첫 화면) / `"icon"`(게임 상단 바) | `.segmented` `.theme-toggle` |
| `SegmentedControl` | 여러 개 중 하나 | `.segmented` |
| `ConfirmButton` | 두 번 눌러 확인 (방 닫기·게임 중지) | `.confirm-close` |
| `Stepper` · `Toggle` | 설정 한 줄 | `.cfg-row` `.stepper` |
| `configFields()` · `PresetChips` | 로비 규칙 설정 패널 도우미 | `.presets` `.chip` |
| `Notice` · `AlertBanner` | 안내 상자 · 눈에 띄는 경고 띠(critical) | `.notice` `.side-alert` |
| `Modal` | 바깥 클릭·Esc 닫기, 뒤 스크롤 잠금 | `.g-overlay` `.g-sheet` |
| `TurnBanner` · `TurnSteps` · `TurnTimer` · `TurnSplash` | 차례 안내 | `.turn-banner` `.tb-*` `.turn-splash` |
| `EmoteButton` · `EmoteBubble` · `EmoteFeed` (+`EmotesContext`) | 감정 표현 | `.emote-*` |
| `useCountdown` | 남은 초 (렌더 시점 기준) | — |

클래스만 직접 써도 같은 모양이다: `.btn`(`.primary` `.ghost` `.danger` `.tiny`), `.panel`, `.chip`(`.on`), `.tag`(`.mine` `.results` `.ready`), `.field`, `.alert`, `.toast`, `.topbar`, `.row`.

## 확장 규칙

1. 한 게임에만 필요한 UI → 그 게임 `web/src`에.
2. 두 번째 게임도 쓸 만하면 → 여기로 올리고(컴포넌트 + CSS), `/design`에 예시, 위 표에 한 줄.
3. 기존 컴포넌트의 모양을 게임에서 바꾸고 싶으면 CSS 변수나 `className`으로 — 컴포넌트를 복사하지 않는다.
