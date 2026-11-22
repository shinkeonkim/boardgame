import { ClueNote, WordCard } from './theme';

/** 표지: 가려진 단어 카드와 힌트 쪽지 (겹친 건 지워짐) */
export function Cover() {
  return (
    <div className="cover-stack">
      <WordCard word={null} />
      <div className="cover-row">
        <ClueNote text="별" seatColor="#e0483c" state="shown" />
        <ClueNote text="우주" seatColor="#3b7be0" state="erased" />
        <ClueNote text="우주" seatColor="#2fa865" state="erased" />
        <ClueNote text="소원" seatColor="#e6b422" state="shown" />
        <ClueNote text="꼬리" seatColor="#9b5ad6" state="shown" />
      </div>
    </div>
  );
}
