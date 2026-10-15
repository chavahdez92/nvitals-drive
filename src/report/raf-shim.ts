/**
 * Modo captura (exportación PDF en una ventana oculta): WebKit no ejecuta
 * requestAnimationFrame cuando la ventana no es visible, y <doc-page> pagina dentro de
 * rAF. Se sustituye por un temporizador ANTES de cargar doc-page.
 */
if (new URLSearchParams(location.hash.replace(/^#/, '')).get('capture') === '1') {
  let id = 0;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const n = ++id;
    timers.set(n, setTimeout(() => { timers.delete(n); cb(performance.now()); }, 16));
    return n;
  };
  window.cancelAnimationFrame = (n: number) => {
    clearTimeout(timers.get(n));
    timers.delete(n);
  };
}
export {};
