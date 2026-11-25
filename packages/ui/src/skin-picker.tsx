import { getHaptics, haptic, setHaptics, useColorAssist } from './a11y';
import { Icon } from './icons';
import { CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './components';
import { CARD_BACKS, CARD_TEXTURES, CHIP_TEXTURES, CUSTOM_BACK, TABLE_MATS, Skin, SkinChoice, onSkinChange, readCustomBack, readSkin, saveCustomBack, saveSkin } from './skins';

export function useSkin(): SkinChoice {
  const [c, setC] = useState(readSkin);
  useEffect(() => onSkinChange(setC), []);
  return c;
}

function Choices({ list, value, onPick, kind }: { list: Skin[]; value: string; onPick: (id: string) => void; kind: 'back' | 'tex' | 'chip' | 'table' }) {
  return (
    <div className={`skin-grid ${kind}`} role="radiogroup">
      {list.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={value === s.id} className={`skin-opt ${value === s.id ? 'on' : ''}`} onClick={() => onPick(s.id)}>
          <span className={`skin-swatch ${kind}`} style={{ background: kind === 'back' ? s.bg : kind === 'tex' ? `${s.bg}, #fffdf6` : kind === 'table' ? `${s.bg}, radial-gradient(ellipse at 50% 40%, #2f7a51, #1d5a3a 80%)` : `${s.bg}, #3b82c4` } as CSSProperties} />
          <span className="skin-name">{s.name}</span>
        </button>
      ))}
    </div>
  );
}

/** 카드 뒷면·앞면 질감·칩 질감 고르기 (모든 게임 공통, 이 기기에 저장) */
export function SkinPicker({ onClose }: { onClose: () => void }) {
  const [c, setC] = useState(readSkin);
  const [custom, setCustom] = useState(readCustomBack);
  const [err, setErr] = useState('');
  const pick = (patch: Partial<SkinChoice>) => {
    const next = { ...c, ...patch };
    setC(next);
    saveSkin(next);
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    setErr('');
    if (!f.type.startsWith('image/')) return setErr('그림 파일만 올릴 수 있어요');
    if (!(await saveCustomBack(f))) return setErr('이 그림은 쓸 수 없어요. 다른 그림으로 해 보세요');
    setCustom(readCustomBack());
    pick({ back: CUSTOM_BACK });
  };
  return (
    <Modal onClose={onClose} label="카드 꾸미기" className="skin-sheet">
      <div className="skin-head">
        <h3>
          <Icon name="palette" /> 카드 꾸미기
        </h3>
        <button className="btn ghost tiny" onClick={onClose} aria-label="닫기">
          <Icon name="x" />
        </button>
      </div>
      <p className="small muted">모든 게임에 함께 적용되고, 이 기기에만 저장돼요. 다른 사람 화면은 바뀌지 않아요.</p>
      <h4>카드 뒷면</h4>
      <Choices list={CARD_BACKS} value={c.back} onPick={(back) => pick({ back })} kind="back" />
      <div className="skin-custom">
        {custom && (
          <button type="button" className={`skin-opt ${c.back === CUSTOM_BACK ? 'on' : ''}`} onClick={() => pick({ back: CUSTOM_BACK })} aria-checked={c.back === CUSTOM_BACK} role="radio">
            <span className="skin-swatch back" style={{ background: `url("${custom}") center/cover` }} />
            <span className="skin-name">내 이미지</span>
          </button>
        )}
        <label className="btn small">
          {custom ? '다른 그림 올리기' : '내 그림으로 뒷면 만들기'}
          <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {err && <span className="small danger-text">{err}</span>}
      </div>
      <h4>카드 앞면 질감</h4>
      <Choices list={CARD_TEXTURES} value={c.tex} onPick={(tex) => pick({ tex })} kind="tex" />
      <h4>칩·토큰 질감</h4>
      <Choices list={CHIP_TEXTURES} value={c.chip} onPick={(chip) => pick({ chip })} kind="chip" />
      <h4>테이블 재질</h4>
      <Choices list={TABLE_MATS} value={c.table} onPick={(table) => pick({ table })} kind="table" />
      <h4>보기 도움</h4>
      <ColorAssistToggle />
      <HapticsToggle />
    </Modal>
  );
}

/** 위 막대에 넣는 버튼 */
export function SkinButton({ className = 'btn ghost tiny' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)} aria-label="카드 꾸미기" title="카드 꾸미기">
        <Icon name="palette" />
      </button>
      {/* 게임 화면(배율·움직임 레이어) 밖, 문서 맨 위에 띄운다 */}
      {open && createPortal(<SkinPicker onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/** 색 구분 도움 켜고 끄기 (보석·카드·타일에 색 이름 첫 글자) */
function ColorAssistToggle() {
  const [on, set] = useColorAssist();
  return (
    <label className="skin-assist">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span>
        <b>색 구분 도움</b>
        <small className="muted">색으로만 나뉘는 보석·카드·타일에 색 이름 첫 글자(빨·파·초…)를 함께 보여요</small>
      </span>
    </label>
  );
}

/** 진동 켜고 끄기 (지원하는 폰만) */
function HapticsToggle() {
  const [on, setOn] = useState(getHaptics);
  if (typeof navigator === 'undefined' || !navigator.vibrate) return null;
  return (
    <label className="skin-assist">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setHaptics(e.target.checked);
          setOn(e.target.checked);
          if (e.target.checked) haptic(20);
        }}
      />
      <span>
        <b>진동</b>
        <small className="muted">내 차례·경고·승리 때 짧게 떨려요</small>
      </span>
    </label>
  );
}

