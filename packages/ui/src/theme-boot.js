// 첫 그림 전에 저장된 테마를 적용하는 인라인 스크립트 (깜빡임 방지). Vite 설정(Node)에서도 읽으므로 순수 JS.
export const THEME_KEY = 'bg:theme';
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('bg:cb')==='1')document.documentElement.setAttribute('data-cb','on')}catch(e){}`;
