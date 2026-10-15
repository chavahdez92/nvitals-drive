/**
 * Estilos en línea del prototipo.
 *
 * El prototipo define cada componente con estilos en línea que leen solo tokens
 * (ver prototype-design/SPEC.md). Estas utilidades reproducen exactamente cómo los
 * interpreta su runtime (prototype-design/support.js): `css()` convierte la cadena
 * en un objeto de estilo y `pc()` genera una clase para :hover/:active/:focus con
 * `!important`, para que gane sobre el estilo en línea.
 */
import type { CSSProperties } from 'react';

const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

const styleCache = new Map<string, CSSProperties>();
const MAX_CACHE = 4000;

export function css(text: string): CSSProperties {
  const hit = styleCache.get(text);
  if (hit) return hit;
  const o: Record<string, string> = {};
  for (const decl of text.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    // `-webkit-backdrop-filter` → WebkitBackdropFilter, igual que el runtime del prototipo.
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  if (styleCache.size > MAX_CACHE) styleCache.clear();
  styleCache.set(text, o as CSSProperties);
  return o as CSSProperties;
}

let sheet: CSSStyleSheet | null = null;
const pseudoCache = new Map<string, string>();
let n = 0;

const importantify = (text: string) =>
  text
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => (/!important\s*$/.test(d) ? d : d + ' !important'))
    .join(';');

/** Clase para una pseudo-clase (`hover`, `active`, `focus`…) con las declaraciones dadas. */
export function pc(pseudo: string, text: string): string {
  const key = pseudo + '|' + text;
  const hit = pseudoCache.get(key);
  if (hit) return hit;
  if (!sheet) {
    const el = document.createElement('style');
    el.setAttribute('data-hdi-pseudo', '');
    document.head.appendChild(el);
    sheet = el.sheet!;
  }
  const cls = 'hp' + (n++).toString(36);
  const isElement = pseudo === 'before' || pseudo === 'after';
  sheet.insertRule(
    `.${cls}${isElement ? '::' : ':'}${pseudo}{${isElement ? text : importantify(text)}}`,
    sheet.cssRules.length,
  );
  pseudoCache.set(key, cls);
  return cls;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
