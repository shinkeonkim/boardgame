import { Icon } from '@bg/ui';

/** 관리자 공지·점검 안내 띠 (화면 맨 위에 고정). 방 안에서는 방 화면이, 첫 화면에서는 방 목록이 알려 준다 */
export function SiteNotice({ text, maintenance }: { text: string | null | undefined; maintenance?: boolean }) {
  if (!text && !maintenance) return null;
  return (
    <div className={`site-notice ${maintenance ? 'maint' : ''}`} role="status">
      <Icon name={maintenance ? 'wrench' : 'bell'} />
      <span>
        {text}
        {text && maintenance ? ' · ' : ''}
        {maintenance && <b>점검 중이라 새 방을 만들 수 없어요</b>}
      </span>
    </div>
  );
}
