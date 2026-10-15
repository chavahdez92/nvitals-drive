import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/tokens.css';
import './design-system/global.css';
import sprite from './design-system/icons.svg?raw';
import { AppController } from './ui/AppController';
import { RealAppController } from './ui/RealAppController';
import { isNative, useMock } from './services/backend';
import { invoke } from '@tauri-apps/api/core';

if (isNative) {
  const send = (level: string, message: string) => invoke('ui_log', { level, message }).catch(() => {});
  window.addEventListener('error', (e) => send('error', `${e.message} @ ${e.filename}:${e.lineno}\n${e.error?.stack || ''}`));
  window.addEventListener('unhandledrejection', (e) => send('error', 'promesa rechazada: ' + (e.reason?.stack || String(e.reason))));
  const orig = console.error;
  console.error = (...a: unknown[]) => { send('error', a.map((x) => (x instanceof Error ? x.stack : String(x))).join(' ')); orig(...a); };
}

// Sprite de íconos del prototipo: <use href="#i-…"> lo referencia en toda la UI.
const holder = document.createElement('div');
holder.id = 'hdi-sprite';
holder.innerHTML = sprite;
document.body.insertBefore(holder, document.body.firstChild);

// En el navegador (pnpm dev:web) corre el prototipo con datos simulados; en la app nativa, datos reales.
const App = useMock ? AppController : RealAppController;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
