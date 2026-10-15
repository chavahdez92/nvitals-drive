/**
 * Expedientes de discos: tipos, estados, búsqueda y diferencias entre revisiones.
 * Puro y sin E/S (la persistencia vive en src-tauri/src/inventory.rs).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { nf } from './format';

export type InvStatus = 'stock' | 'installed' | 'sold' | 'discarded';

export const STATUSES: { key: InvStatus; label: string; icon: string; tone: string }[] = [
  { key: 'stock', label: 'En inventario', icon: '#i-ssd', tone: 'accent' },
  { key: 'installed', label: 'Instalado', icon: '#i-monitor', tone: 'good' },
  { key: 'sold', label: 'Vendido', icon: '#i-check-circle', tone: 'optimal' },
  { key: 'discarded', label: 'Descartado', icon: '#i-trash', tone: 'nodata' },
];
export const statusOf = (k: string) => STATUSES.find((s) => s.key === k) || STATUSES[0];

export interface InventoryRecord {
  serial: string;
  deviceKey: string;
  model: string;
  vendor?: string | null;
  capacityBytes?: number | null;
  status: InvStatus;
  lot?: string | null;
  supplier?: string | null;
  destination?: string | null;
  cost?: number | null;
  price?: number | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface InventoryRow extends InventoryRecord {
  checks: number;
  last: {
    id: number;
    takenAt: number;
    verdict: string | null;
    life: number | null;
    /** Uso del disco en esa revisión (null si no hay datos SMART). */
    hours: number | null;
    writtenTB: number | null;
    capacityTB: number | null;
  } | null;
}

export interface InventoryCheck {
  id: number;
  serial: string;
  takenAt: number;
  verdict: string | null;
  life: number | null;
  disk: any;
  raw: any;
  extras: any;
  pdfPath: string | null;
}

export interface Dossier {
  record: InventoryRecord;
  checks: InventoryCheck[];
  folder: string;
}

/** Última revisión de un expediente, sin el JSON crudo (reporte de varios discos). */
export interface LatestCheck {
  id: number;
  takenAt: number;
  verdict: string | null;
  life: number | null;
  disk: any;
  extras: any;
}

export interface InventoryLatest extends InventoryRecord {
  check: LatestCheck | null;
}

/** Mismo criterio que el núcleo (clave y nombre de carpeta). */
export function validSerial(s: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(s) && !s.includes('..');
}

/** Serial escrito a mano desde la etiqueta: sin espacios y en mayúsculas. */
export const normalizeSerial = (s: string): string => s.replace(/\s+/g, '').toUpperCase();

export function filterInventory(rows: InventoryRow[], f: { q?: string; status?: string; lot?: string }): InventoryRow[] {
  const q = (f.q || '').trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status && f.status !== 'all' && r.status !== f.status) return false;
    if (f.lot && r.lot !== f.lot) return false;
    if (!q) return true;
    return [r.serial, r.model, r.vendor, r.lot, r.supplier, r.destination, r.notes].some((v) => (v || '').toLowerCase().includes(q));
  });
}

export function lotsOf(rows: InventoryRow[]): string[] {
  return [...new Set(rows.map((r) => r.lot).filter((l): l is string => !!l))].sort((a, b) => a.localeCompare(b, 'es'));
}

/* ── Orden de la tabla de seleccionados y del reporte de varios discos (desviación #22) ── */

/** Gravedad del veredicto: lo más grave primero (también ordena el reporte de varios discos). */
export const SEVERITY: Record<string, number> = { critical: 0, warning: 1, nodata: 2, good: 3, optimal: 4 };

export type InvSortKey = 'health' | 'model' | 'serial' | 'life' | 'hours' | 'written' | 'status' | 'lot' | 'taken';
export type SortDir = 'asc' | 'desc';
export interface InvSort {
  key: InvSortKey;
  dir: SortDir;
}

/** Columnas ordenables. `dir` es la dirección con la que empieza al elegirla; `asc`/`desc`, cómo se lee cada sentido. */
export const INV_SORTS: { key: InvSortKey; label: string; dir: SortDir; asc: string; desc: string }[] = [
  { key: 'health', label: 'Salud', dir: 'asc', asc: 'lo más grave primero', desc: 'lo más sano primero' },
  { key: 'model', label: 'Modelo', dir: 'asc', asc: 'A → Z', desc: 'Z → A' },
  { key: 'serial', label: 'Número de serie', dir: 'asc', asc: 'A → Z', desc: 'Z → A' },
  { key: 'life', label: 'Vida útil', dir: 'asc', asc: 'menor primero', desc: 'mayor primero' },
  { key: 'hours', label: 'Horas de uso', dir: 'desc', asc: 'menos primero', desc: 'más primero' },
  { key: 'written', label: 'Datos escritos', dir: 'desc', asc: 'menos primero', desc: 'más primero' },
  { key: 'status', label: 'Estado', dir: 'asc', asc: 'A → Z', desc: 'Z → A' },
  { key: 'lot', label: 'Lote', dir: 'asc', asc: 'A → Z', desc: 'Z → A' },
  { key: 'taken', label: 'Última revisión', dir: 'desc', asc: 'más antigua primero', desc: 'más reciente primero' },
];
export const DEFAULT_INV_SORT: InvSort = { key: 'health', dir: 'asc' };

/** Veredicto de la última revisión; sin revisión o sin vida útil cuenta como «Sin datos». */
export function invVerdict(r: InventoryRow): string {
  const v = r.last?.verdict;
  return v && v in SEVERITY && v !== 'nodata' && r.last?.life != null ? v : 'nodata';
}
const hasUsage = (r: InventoryRow) => invVerdict(r) !== 'nodata';
const numOf = (r: InventoryRow, k: InvSortKey): number | null => {
  const l = r.last;
  if (!l) return null;
  if (k === 'taken') return l.takenAt || null;
  if (!hasUsage(r)) return null;
  const v = k === 'life' ? l.life : k === 'hours' ? l.hours : l.writtenTB;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};
const txtOf = (r: InventoryRow, k: InvSortKey): string =>
  (k === 'model' ? r.model : k === 'serial' ? r.serial : k === 'status' ? statusOf(r.status).label : r.lot) || '';
// Modelo, estado y lote comparan los números por su valor («Lote 2» antes de «Lote 10»); la serie es un código y va carácter por carácter.
const cmpTxt = (a: string, b: string, numeric: boolean) => a.localeCompare(b, 'es', { numeric, sensitivity: 'base' });

/**
 * Ordena expedientes por la columna elegida. Los vacíos (sin datos, sin lote) siempre al final;
 * a igualdad, por número de serie. «Salud» ascendente es el orden de siempre del reporte de
 * varios discos: veredicto más grave, menos vida útil y luego serie.
 */
export function sortInventory(rows: InventoryRow[], sort: InvSort = DEFAULT_INV_SORT): InventoryRow[] {
  const sign = sort.dir === 'desc' ? -1 : 1;
  const k = sort.key;
  const cmp = (a: InventoryRow, b: InventoryRow): number => {
    if (k === 'health') {
      const life = (r: InventoryRow) => (hasUsage(r) ? Number(r.last!.life) : 101);
      return sign * (SEVERITY[invVerdict(a)] - SEVERITY[invVerdict(b)] || life(a) - life(b));
    }
    if (k === 'model' || k === 'serial' || k === 'status' || k === 'lot') {
      const x = txtOf(a, k), y = txtOf(b, k);
      if (!x !== !y) return x ? -1 : 1;
      return sign * cmpTxt(x, y, k !== 'serial');
    }
    const x = numOf(a, k), y = numOf(b, k);
    if ((x == null) !== (y == null)) return x == null ? 1 : -1;
    return x == null || y == null ? 0 : sign * (x - y);
  };
  return rows.slice().sort((a, b) => cmp(a, b) || (k === 'serial' ? 0 : a.serial.localeCompare(b.serial, 'es')));
}

export interface CheckDelta {
  life: number;
  writtenTB: number;
  hours: number;
  mediaErr: number;
  text: string;
}

/** Cambios de una revisión respecto a la anterior. */
export function checkDelta(prev: any | null, cur: any): CheckDelta | null {
  if (!prev || prev.nodata || cur.nodata) return null;
  const life = (cur.life ?? 0) - (prev.life ?? 0);
  const writtenTB = (cur.writtenTB ?? 0) - (prev.writtenTB ?? 0);
  const hours = (cur.hours ?? 0) - (prev.hours ?? 0);
  const mediaErr = (cur.mediaErr ?? 0) - (prev.mediaErr ?? 0);
  const parts = [
    life ? `${life > 0 ? '+' : '−'}${Math.abs(life)} % vida` : 'misma vida útil',
    writtenTB > 0.005 ? `+${nf(writtenTB, 2)} TB escritos` : null,
    hours > 0 ? `+${nf(hours)} h` : null,
    mediaErr > 0 ? `+${nf(mediaErr)} errores de medios` : 'sin errores nuevos',
  ].filter(Boolean);
  return { life, writtenTB, hours, mediaErr, text: parts.join(' · ') };
}

export const money = (n: number | null | undefined): string =>
  n == null ? '—' : n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

/** Número desde un campo de texto ("$1,250.50" → 1250.5); vacío → null. */
export function parseMoney(s: string): number | null {
  const clean = String(s || '').replace(/[^0-9.]/g, '');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
