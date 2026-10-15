/** Formatos numéricos (es-MX), iguales a los del prototipo. */

export const nf = (n: number, d = 0): string =>
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

/** 1 "data unit" de NVMe = 1000 × 512 bytes. */
export const DATA_UNIT_BYTES = 512_000;

/** TB decimales: 2 decimales por debajo de 100, 1 hasta 999, ninguno desde 1000 (plan §6.1). */
export function tbText(tb: number): string {
  return nf(tb, tb >= 1000 ? 0 : tb >= 100 ? 1 : 2) + ' TB';
}

export function hex(n: number, width = 2): string {
  return '0x' + Math.max(0, n).toString(16).toUpperCase().padStart(width, '0');
}

export function plural(n: number, one: string, many: string): string {
  return nf(n) + ' ' + (n === 1 ? one : many);
}

/** "hace 12 días" / "hace 3 h" / "hace un momento". */
export function agoText(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 2) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 36) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "24 sep 2026" (formato de las instantáneas del prototipo). */
export function dateText(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "24 sep 2026, 11:02". */
export function dateTimeText(ms: number): string {
  const d = new Date(ms);
  return `${dateText(ms)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
