/** 표지: 단어 카드 3×3 — 일부는 팀 색으로 공개, 하나는 암살자 */
const WORDS: [string, string][] = [
  ['바다', 'red open'],
  ['열쇠', ''],
  ['달', 'blue open'],
  ['피아노', ''],
  ['비밀', 'assassin open'],
  ['우주', 'red open'],
  ['나무', 'blue open'],
  ['편지', ''],
  ['시계', 'neutral open'],
];
export function Cover() {
  return (
    <div className="cover-cipher">
      {WORDS.map(([w, cls]) => (
        <div key={w} className={`co-card pc light ${cls}`}>
          <span className="co-word">{w}</span>
        </div>
      ))}
    </div>
  );
}
