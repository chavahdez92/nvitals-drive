/**
 * Utilidades de movimiento del prototipo (prototype-design/js/motion.js), portadas a TS.
 * Todas las duraciones se leen de los tokens CSS para que la velocidad global
 * (--motion-k) y el movimiento reducido apliquen en todas partes.
 * Catálogo de coreografías: prototype-design/SPEC.md §5.
 */
type Rect = { left: number; top: number; width: number; height: number };
type Keyframe = Record<string, string | number>;

function root(): Element {
  return document.querySelector('[data-hdi-root]') || document.documentElement;
}

export function speedK(): number {
  return parseFloat(getComputedStyle(root()).getPropertyValue('--motion-k')) || 1;
}

export function ms(token: string, fallback: number): number {
  const v = getComputedStyle(root()).getPropertyValue(token).trim();
  if (!v) return fallback;
  if (v.indexOf('calc') === 0) {
    const m = v.match(/([\d.]+)ms/);
    return m ? parseFloat(m[1]) * speedK() : fallback;
  }
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : parseFloat(v);
}

export function reduced(): boolean {
  const a = root().getAttribute('data-motion');
  if (a === 'reduced') return true;
  if (a === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Spring → curva CSS linear(). bounce 0 = amortiguamiento crítico; duration = tiempo de asentamiento (s). */
const springCache: Record<string, string> = {};
export function spring(opts?: { bounce?: number; duration?: number }): string {
  const bounce = opts?.bounce || 0;
  const dur = opts?.duration || 0.38;
  const key = bounce + ':' + dur;
  if (springCache[key]) return springCache[key];
  const omega = (2 * Math.PI) / dur;
  const zeta = 1 - bounce;
  const pts: number[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * dur;
    let x: number;
    if (zeta >= 1) x = 1 - (1 + omega * t) * Math.exp(-omega * t);
    else {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      x = 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
    }
    pts.push(+x.toFixed(4));
  }
  pts[n] = 1;
  const supports = typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)');
  springCache[key] = supports
    ? 'linear(' + pts.join(', ') + ')'
    : bounce
      ? 'cubic-bezier(0.3, 1.25, 0.45, 1)'
      : 'cubic-bezier(0.25, 0.9, 0.3, 1)';
  return springCache[key];
}

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const PRESETS: Record<string, { from: Keyframe; dur: string; ease: string }> = {
  pop: { from: { opacity: 0, transform: 'scale(0.96)' }, dur: '--dur-base', ease: EASE_OUT },
  dialog: { from: { opacity: 0, transform: 'scale(0.96)' }, dur: '--dur-base', ease: EASE_OUT },
  sheet: { from: { opacity: 0, transform: 'translateY(-24px)' }, dur: '--dur-moderate', ease: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  toast: { from: { opacity: 0, transform: 'translateX(24px) scale(0.98)' }, dur: '--dur-base', ease: EASE_OUT },
  rise: { from: { opacity: 0, transform: 'translateY(8px)' }, dur: '--dur-moderate', ease: EASE_OUT },
  fade: { from: { opacity: 0 }, dur: '--dur-base', ease: EASE_OUT },
  materialize: { from: { opacity: 0, transform: 'scale(0.96)', filter: 'blur(8px)' }, dur: '--dur-moderate', ease: EASE_OUT },
  paper: { from: { opacity: 0, transform: 'translateY(24px)', boxShadow: '0 0 0 rgba(0,0,0,0)' }, dur: '--dur-moderate', ease: EASE_OUT },
  line: { from: { opacity: 0 }, dur: '--dur-press', ease: EASE_OUT },
  drawer: { from: { transform: 'translateY(100%)' }, dur: '--dur-moderate', ease: 'cubic-bezier(0.32, 0.72, 0, 1)' },
};

export function enter(el: Element | null, preset: string, opts?: { delay?: number }): Animation | null {
  if (!el || !(el as HTMLElement).animate) return null;
  const p = PRESETS[preset] || PRESETS.fade;
  if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 * speedK(), easing: 'linear' });
  const to: Keyframe = {};
  Object.keys(p.from).forEach((k) => {
    to[k] = k === 'opacity' ? 1 : k === 'filter' ? 'blur(0px)' : k === 'boxShadow' ? getComputedStyle(el).boxShadow : 'none';
  });
  return el.animate([p.from, to], { duration: ms(p.dur, 220), easing: p.ease, delay: (opts?.delay || 0) * speedK(), fill: 'backwards' });
}

/* Las salidas son ~30 % más rápidas que las entradas y recorren el camino inverso. */
export function exit(el: Element | null, preset: string): Promise<unknown> {
  if (!el || !(el as HTMLElement).animate) return Promise.resolve();
  const p = PRESETS[preset] || PRESETS.fade;
  const a = reduced()
    ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 * speedK(), fill: 'forwards' })
    : el.animate([{}, p.from], { duration: ms(p.dur, 220) * 0.7, easing: EASE_OUT, fill: 'forwards' });
  return a.finished.catch(() => {});
}

/* FLIP: toma los rectángulos, muta y anima desde la geometría anterior con un spring de layout. */
export function snapshot(selector: string): Record<string, Rect> {
  const map: Record<string, Rect> = {};
  document.querySelectorAll(selector).forEach((el) => {
    map[el.getAttribute('data-flip') || ''] = el.getBoundingClientRect();
  });
  return map;
}

export function play(selector: string, before: Record<string, Rect>): void {
  if (reduced()) return;
  document.querySelectorAll(selector).forEach((el) => {
    const a = before[el.getAttribute('data-flip') || ''];
    if (!a) return;
    const b = el.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], {
      duration: 380 * speedK(),
      easing: spring({ bounce: 0, duration: 0.38 }),
    });
  });
}

/* Elemento compartido: mueve `to` desde `fromRect` (escala + traslación). */
export function shared(fromRect: Rect | null | undefined, to: Element | null): void {
  if (!fromRect || !to || reduced()) return;
  const b = to.getBoundingClientRect();
  const s = fromRect.width / b.width;
  const dx = fromRect.left - b.left;
  const dy = fromRect.top - b.top;
  to.animate(
    [
      { transformOrigin: 'top left', transform: `translate(${dx}px,${dy}px) scale(${s})` },
      { transformOrigin: 'top left', transform: 'none' },
    ],
    { duration: 400 * speedK(), easing: spring({ bounce: 0, duration: 0.4 }) },
  );
}

export function pulse(el: Element | null): void {
  if (!el || reduced()) return;
  el.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.08)', opacity: 0.85 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration: 520 * speedK(), easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
  );
}

export function flash(el: Element | null): void {
  if (!el) return;
  el.animate([{ backgroundColor: 'var(--accent-soft)' }, { backgroundColor: 'transparent' }], {
    duration: 600 * speedK(),
    easing: EASE_OUT,
  });
}

export const Motion = { ms, reduced, spring, enter, exit, snapshot, play, shared, pulse, flash, speedK };
export type MotionApi = typeof Motion;
