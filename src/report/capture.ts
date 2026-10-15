/**
 * Modo captura (exportación PDF): aplica en pantalla las mismas reglas del bloque
 * `@media print` de <doc-page> — hojas a tamaño exacto, contiguas desde (0,0), sin
 * fondo, sombras ni separación— para que WebKit genere el PDF con la paginación del
 * prototipo. Se activa con `capture=1` en el hash de report.html.
 */
const PRINT_RULES = `
:host { background: none !important; padding: 0 !important; min-width: 0 !important; min-height: 0 !important; }
.sheet { width: auto !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
.sheet.paginated { padding: 0 !important; }
.sheet.paginated .hdr-space, .sheet.paginated .ftr-space { height: 0 !important; }
.paginated ::slotted(.page) {
  border-radius: 0 !important; box-shadow: none !important; margin: 0 !important;
  aspect-ratio: auto !important; width: var(--doc-page-w) !important; height: var(--doc-page-h) !important; overflow: hidden !important;
}
.paginated ::slotted(.page:not(:first-child)) { margin-top: 0 !important; }
`;

export function isCapture(): boolean {
  return new URLSearchParams(location.hash.replace(/^#/, '')).get('capture') === '1';
}

export function enableCapture(): void {
  document.documentElement.setAttribute('data-capture', '');
  const apply = () => {
    document.querySelectorAll('doc-page').forEach((el) => {
      const root = el.shadowRoot;
      if (!root || root.querySelector('style[data-capture]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-capture', '');
      style.textContent = PRINT_RULES;
      root.appendChild(style);
    });
  };
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
  customElements.whenDefined('doc-page').then(apply);
  // Avisa al núcleo cuando la plantilla está maquetada (señal para generar el PDF).
  const ready = async () => {
    await customElements.whenDefined('doc-page');
    await document.fonts.ready;
    // En una ventana oculta WebKit no ejecuta requestAnimationFrame: se usa un temporizador.
    await new Promise((r) => setTimeout(r, 250));
    apply();
    const pages = [...document.querySelectorAll('section.page')].map((s) => {
      const r = s.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    });
    try {
      const { emit } = await import('@tauri-apps/api/event');
      const nonce = new URLSearchParams(location.hash.replace(/^#/, '')).get('nonce') || '';
      await emit('report-ready', { nonce, pages, width: document.documentElement.clientWidth, height: document.documentElement.scrollHeight, viewport: window.innerHeight });
    } catch {
      /* fuera de la app nativa */
    }
  };
  setTimeout(ready, 300);
}
