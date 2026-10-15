/**
 * Reporte rápido de varios discos (desviación #21): una fila por expediente con lo más
 * relevante de su salud, más el resumen del grupo. Lo usan la plantilla
 * (src/report/BatchReport.tsx) y el panel de Expedientes. Puro y sin E/S.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEFAULT_THRESHOLDS, type Thresholds } from './disk';
import { dateText, hex, nf, plural, tbText } from './format';
import { SEVERITY, statusOf } from './inventory';
import { capText, mediaTone, spareTone, VERDICT, type Tone } from './quickView';
import { CRITICAL_BITS } from './verdict';

/** Un disco del reporte: la última revisión guardada de su expediente. */
export interface BatchItem {
  serial: string;
  model: string;
  takenAt: number;
  disk: any;
  /** Datos del expediente: solo están si se pidió incluirlos en el reporte. */
  status?: string;
  lot?: string | null;
  destination?: string | null;
}

/** Orden de la tabla y de «Requieren atención»: lo más grave primero. */
export { SEVERITY };
/** Orden de las fichas del resumen. */
export const VERDICT_KEYS = ['optimal', 'good', 'warning', 'critical', 'nodata'];

const hasData = (d: any): boolean => !!d && !d.nodata && typeof d.life === 'number';
const verdictOf = (d: any): string => (hasData(d) && d.verdict in SEVERITY ? d.verdict : 'nodata');

/** Bits de `critical_warning` (plan, apéndice C). */
const CRIT_FLAGS = ['repuesto bajo el umbral', 'temperatura fuera de rango', 'fiabilidad degradada', 'modo solo lectura', 'falla del respaldo de memoria volátil', 'memoria persistente no confiable'];

/** Motivos breves del veredicto (plan §6.2), del más grave al más leve. */
export function shortReasons(d: any, th: Thresholds = DEFAULT_THRESHOLDS): string[] {
  if (!hasData(d)) return [d?.conn === 'usb' ? 'sin datos SMART por USB' : 'sin datos SMART'];
  const out: string[] = [];
  const cw = Number(d.critWarn || 0);
  const spareLow = d.spareTh > 0 && d.spare < d.spareTh;
  if (spareLow) out.push(`repuesto ${d.spare} % bajo el umbral (${d.spareTh} %)`);
  CRIT_FLAGS.forEach((label, bit) => {
    if (bit !== 1 && cw & (1 << bit) && !(bit === 0 && spareLow)) out.push(label);
  });
  if (d.smartPassed === false && !(cw & CRITICAL_BITS)) out.push('autoevaluación SMART fallida');
  if (d.mediaErr > 0) out.push(plural(d.mediaErr, 'error de medios', 'errores de medios'));
  if (!spareLow && d.spare < 100 && d.spare <= d.spareTh + th.thSpare) out.push(`repuesto ${d.spare} % cerca del umbral (${d.spareTh} %)`);
  if (d.life <= 20) out.push(`vida útil ${d.life} %`);
  if (cw & 0x02) out.push(CRIT_FLAGS[1]);
  return out;
}

export interface BatchRow {
  n: number;
  serial: string;
  model: string;
  cap: string;
  nd: boolean;
  verdict: string;
  vLabel: string;
  vIcon: string;
  life: number | null;
  lifeTxt: string;
  spareTxt: string;
  spareSub: string;
  spareK: Tone;
  mediaTxt: string;
  mediaK: Tone;
  smartTxt: string;
  smartK: Tone;
  hoursTxt: string;
  writtenTxt: string;
  when: string;
  /** «Estado · lote · → destino», solo si se incluyen los datos del expediente. */
  extra: string | null;
  reasons: string[];
}

export interface BatchOpts {
  extra?: boolean;
  th?: Thresholds;
  /** `severity` (por defecto): lo más grave primero. `given`: el orden en que llegan (el de la tabla de Expedientes, desviación #22). */
  order?: 'severity' | 'given';
}

const lifeKey = (x: BatchItem) => (hasData(x.disk) ? Number(x.disk.life) : 101);

/** Lo más grave primero; a igual veredicto, menos vida útil primero y luego por serie. */
export function sortItems(items: BatchItem[]): BatchItem[] {
  return items.slice().sort((a, b) => SEVERITY[verdictOf(a.disk)] - SEVERITY[verdictOf(b.disk)] || lifeKey(a) - lifeKey(b) || a.serial.localeCompare(b.serial, 'es'));
}

export function batchRow(x: BatchItem, n: number, o: BatchOpts = {}): BatchRow {
  const d = x.disk || {};
  const nd = !hasData(d);
  const v = verdictOf(d);
  const V = VERDICT[v] || VERDICT.nodata;
  const cw = Number(d.critWarn || 0);
  const failed = !nd && (cw !== 0 || d.smartPassed === false);
  const extra = o.extra ? [x.status ? statusOf(x.status).label : null, x.lot || null, x.destination ? '→ ' + x.destination : null].filter(Boolean).join(' · ') || '—' : null;
  return {
    n,
    serial: x.serial,
    model: x.model || d.model || '—',
    cap: d.capacityTB ? capText(d.capacityTB) : '—',
    nd,
    verdict: v,
    vLabel: V.label,
    vIcon: V.icon,
    life: nd ? null : d.life,
    lifeTxt: nd ? '—' : `${d.life} %`,
    spareTxt: nd ? '—' : `${d.spare} %`,
    spareSub: nd ? '' : `umbral ${d.spareTh} %`,
    spareK: nd ? 'ok' : spareTone(d),
    mediaTxt: nd ? '—' : nf(d.mediaErr || 0),
    mediaK: nd ? 'ok' : mediaTone(d),
    smartTxt: nd ? 'Sin datos SMART' : failed ? 'SMART fallido' + (cw ? ' · ' + hex(cw) : '') : 'SMART aprobado',
    smartK: failed ? 'crit' : 'ok',
    hoursTxt: nd ? '—' : `${nf(d.hours || 0)} h`,
    writtenTxt: nd ? '' : `${d.writtenText || tbText(d.writtenTB || 0)} escritos`,
    when: x.takenAt ? dateText(x.takenAt) : '—',
    extra,
    reasons: v === 'optimal' || v === 'good' ? [] : shortReasons(d, o.th),
  };
}

/** Filas de la tabla, ya ordenadas y numeradas. */
export function batchRows(items: BatchItem[], o: BatchOpts = {}): BatchRow[] {
  return (o.order === 'given' ? items : sortItems(items)).map((x, i) => batchRow(x, i + 1, o));
}

export interface BatchTile {
  key: string;
  label: string;
  icon: string;
  count: number;
  pct: number;
}

export interface BatchAttention {
  serial: string;
  model: string;
  verdict: string;
  vLabel: string;
  vIcon: string;
  reasons: string[];
}

export interface BatchSummary {
  total: number;
  counts: Record<string, number>;
  tiles: BatchTile[];
  avgLife: number | null;
  minLife: { life: number; serial: string; model: string } | null;
  totalTB: number;
  capTxt: string;
  from: number | null;
  to: number | null;
  rangeTxt: string;
  /** El veredicto más grave del grupo (píldora de la lista de Reportes). */
  worst: string;
  withMedia: number;
  smartFailed: number;
  attention: BatchAttention[];
}

export function batchSummary(items: BatchItem[], o: BatchOpts = {}): BatchSummary {
  // El resumen y «Requieren atención» van siempre de lo más grave a lo más leve, sea cual sea el orden de la tabla.
  const rows = batchRows(items, { ...o, order: 'severity' });
  const total = rows.length;
  const counts: Record<string, number> = Object.fromEntries(VERDICT_KEYS.map((k) => [k, 0]));
  for (const r of rows) counts[r.verdict]++;
  const lives = rows.filter((r) => r.life != null) as (BatchRow & { life: number })[];
  const minLife = lives.reduce<BatchSummary['minLife']>((m, r) => (!m || r.life < m.life ? { life: r.life, serial: r.serial, model: r.model } : m), null);
  const totalTB = items.reduce((a, x) => a + Number(x.disk?.capacityTB || 0), 0);
  const times = items.map((x) => x.takenAt).filter((t) => t > 0);
  const from = times.length ? Math.min(...times) : null;
  const to = times.length ? Math.max(...times) : null;
  return {
    total,
    counts,
    tiles: VERDICT_KEYS.map((k) => ({ key: k, label: VERDICT[k].label, icon: VERDICT[k].icon, count: counts[k], pct: total ? (counts[k] / total) * 100 : 0 })),
    avgLife: lives.length ? Math.round(lives.reduce((a, r) => a + r.life, 0) / lives.length) : null,
    minLife,
    totalTB,
    capTxt: capText(totalTB),
    from,
    to,
    rangeTxt: from == null || to == null ? '' : dateText(from) === dateText(to) ? `revisión del ${dateText(to)}` : `revisiones del ${dateText(from)} al ${dateText(to)}`,
    worst: rows[0]?.verdict ?? 'nodata',
    withMedia: rows.filter((r) => !r.nd && r.mediaK !== 'ok').length,
    smartFailed: rows.filter((r) => r.smartK === 'crit').length,
    attention: rows.filter((r) => r.reasons.length).map((r) => ({ serial: r.serial, model: r.model, verdict: r.verdict, vLabel: r.vLabel, vIcon: r.vIcon, reasons: r.reasons })),
  };
}

/* ── Paginación: filas de alto fijo, así cada hoja sabe cuántas caben ── */

/** Alto de fila (px CSS): dos líneas, o tres con los datos del expediente (report-batch.css). */
export const ROW_H = { compact: 34, extra: 46 };
/**
 * Alto disponible para las filas en la primera hoja (sin «Requieren atención») y en las
 * siguientes. Medido en modo captura (Carta 633/865 px, A4 700/932 px) menos 10 px de margen.
 */
export const ROOM: Record<'letter' | 'a4', { first: number; rest: number }> = {
  letter: { first: 623, rest: 855 },
  a4: { first: 689, rest: 921 },
};
/** «Requieren atención»: entradas visibles; el recuadro mide 40 px + 16 por línea, más 12 de separación. */
export const ATT_MAX = 5;
export const ATT_BASE = 52;
export const ATT_LINE = 16;

/** Líneas del recuadro «Requieren atención»: hasta ATT_MAX entradas más «+N más». */
export const attentionLines = (n: number): number => (n <= 0 ? 0 : Math.min(n, ATT_MAX) + (n > ATT_MAX ? 1 : 0));

export function pageCapacity(paper: string, extra: boolean, attLines: number): { first: number; rest: number } {
  const h = extra ? ROW_H.extra : ROW_H.compact;
  const room = ROOM[paper === 'a4' ? 'a4' : 'letter'];
  const att = attLines > 0 ? ATT_BASE + attLines * ATT_LINE : 0;
  return { first: Math.max(1, Math.floor((room.first - att) / h)), rest: Math.max(1, Math.floor(room.rest / h)) };
}

/** Reparte las filas: `first` en la primera hoja y `rest` en cada una de las siguientes. */
export function paginate<T>(rows: T[], first: number, rest: number): T[][] {
  const f = Math.max(1, first);
  const r = Math.max(1, rest);
  const pages: T[][] = [rows.slice(0, f)];
  for (let i = f; i < rows.length; i += r) pages.push(rows.slice(i, i + r));
  return pages;
}

/** Resumen y hojas del reporte (lo usan la plantilla y el registro en Reportes). */
export function batchLayout(items: BatchItem[], o: BatchOpts & { paper?: string } = {}): { rows: BatchRow[]; sum: BatchSummary; pages: BatchRow[][] } {
  const rows = batchRows(items, o);
  const sum = batchSummary(items, o);
  const cap = pageCapacity(o.paper || 'letter', !!o.extra, attentionLines(sum.attention.length));
  return { rows, sum, pages: paginate(rows, cap.first, cap.rest) };
}
