import '@bg/ui/styles.css';
import '@bg/web/guide.css';
import './portal.css';
import { createRoot } from 'react-dom/client';
import { applyTheme, getTheme } from '@bg/ui';
import { App } from './App';

applyTheme(getTheme());
createRoot(document.getElementById('root')!).render(<App />);
