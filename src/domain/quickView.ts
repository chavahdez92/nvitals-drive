/**
 * Vista rápida de un disco: lo que muestran el reporte rápido (src/report/QuickReport.tsx)
 * y la ficha del expediente (src/ui/screens/InventoryScreen.tsx). Un solo cálculo para
 * que ambos digan exactamente lo mismo. Puro y sin E/S.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { nf } from './format';

export type Tone = 'ok' | 'note' | 'warn' | 'crit';
export const TONE: Record<Tone, { label: string; icon: string }> = {
  ok: { label: 'Normal', icon: '#i-check-circle' },
  note: { label: 'Nota', icon: '#i-info' },
  warn: { label: 'Atención', icon: '#i-alert' },
  crit: { label: 'Crítico', icon: '#i-octagon' },
};
export const VERDICT: Record<string, { label: string; icon: string }> = {
  optimal: { label: 'Óptimo', icon: '#i-shield-check' },
  good: { label: 'Bueno', icon: '#i-check-circle' },
  warning: { label: 'Atención', icon: '#i-alert' },
  critical: { label: 'Crítico', icon: '#i-octagon' },
  nodata: { label: 'Sin datos', icon: '#i-circle-dashed' },
};

export const maskSerial = (serial: string): string => (serial ? serial.slice(0, 6) + '•'.repeat(Math.max(4, serial.length - 6)) : '');
export const capText = (tb: number): string => nf(tb, tb % 1 ? 1 : 0) + ' TB';

/** Mismas reglas que el reporte completo (repuesto y errores de medios). */
export const spareTone = (d: any): Tone => (d.spare < d.spareTh ? 'crit' : d.spare < 100 && d.spare - d.spareTh <= 10 ? 'warn' : 'ok');
export const mediaTone = (d: any): Tone => (d.mediaErr >= 10 ? 'crit' : d.mediaErr ? 'warn' : 'ok');

export function recsFor(d: any): string[] {
  const nd = !!d.nodata;
  const recs = ({
    optimal: ['El disco está en excelente estado. No se requiere ninguna acción.', 'Vuelve a revisarlo en 6 meses o antes de cualquier transferencia importante.'],
    good: ['Desgaste moderado: el disco es apto para uso general.', 'Revisa la salud cada 3 meses y mantén respaldos al día.'],
    warning: ['Planifica el reemplazo del disco en las próximas semanas.', 'Respalda tus datos y no lo uses como único almacenamiento.'],
    critical: ['Respalda tus datos lo antes posible.', 'Reemplaza el disco: el repuesto está por debajo del umbral y la fiabilidad está degradada.', 'No lo uses para datos importantes ni lo revendas como disco en buen estado.'],
    nodata: ['No fue posible evaluar la salud: el puente USB no transmite SMART en macOS.', 'Repite la revisión con un gabinete Thunderbolt o USB4.'],
  } as Record<string, string[]>)[d.verdict || 'nodata'].slice();
  if (!nd && d.unsafe > 50) recs.push(nf(d.unsafe) + ' apagados inseguros: expulsa el disco antes de desconectarlo.');
  if (!nd && d.warnTime > 0) recs.push(nf(d.warnTime) + ' min históricos sobre la temperatura de advertencia: considera un gabinete con disipador.');
  return recs;
}

export interface QuickChip { label: string; value: string; k: Tone; st: string; icon: string; note: string }
export interface QuickKpi { icon: string; label: string; value: string; sub: string }

export interface QuickView {
  nd: boolean;
  verdict: string;
  vLabel: string;
  vIcon: string;
  cap: string;
  brand: string;
  identity: [string, string, boolean?][];
  kpis: QuickKpi[];
  readPct: number;
  hasSplit: boolean;
  chips: QuickChip[];
  spareK: Tone;
  bench: { read: string; write: string; pct: number | null; ceiling: string | null } | null;
  scan: { ok: boolean; label: string; dur: string; zones: number; avg: string } | null;
  recs: string[];
}

/**
 * @param bench resumen del benchmark `{ seqRead, seqWrite, ceiling }` (opcional)
 * @param scan  escaneo de lectura guardado (forma de `data.scans[id]`, opcional)
 */
export function quickView(d: any, opts: { mask?: boolean; bench?: any; scan?: any } = {}): QuickView {
  const nd = !!d.nodata;
  const vk = d.verdict || 'nodata';
  const cap = capText(d.capacityTB || 0);
  const brand = d.vendor && d.vendor !== 'Desconocido' ? d.vendor : d.pciVendor || '—';
  const serial = d.serial ? (opts.mask ? maskSerial(d.serial) : d.serial) : '—';
  const identity: [string, string, boolean?][] = [
    ['Marca', brand],
    ['Modelo', d.model || '—'],
    ['Número de serie', serial, true],
    ['Firmware', d.fw || '—', true],
    ['Capacidad', cap],
    ['Conexión', d.connLabel || '—'],
    ['Enlace', d.link || '—'],
    ['Gabinete / puente', d.bridge || (d.internal ? 'Integrado' : '—')],
    ['Versión NVMe', d.nvme || (d.protocol ? d.protocol : '—')],
    ['Identificador', d.id || '—', true],
  ];
  const readTB = Number(d.readTB || 0);
  const writtenTB = Number(d.writtenTB || 0);
  const rwTotal = readTB + writtenTB;
  const days = Math.round((d.hours || 0) / 24);
  const kpis: QuickKpi[] = [
    { icon: '#i-arrow-down', label: 'Datos leídos', value: nd ? '—' : d.readText, sub: nd ? '' : `${nf(d.hostReads)} comandos` },
    { icon: '#i-arrow-up', label: 'Datos escritos', value: nd ? '—' : d.writtenText, sub: nd ? '' : `${nf(d.hostWrites)} comandos` },
    { icon: '#i-clock', label: 'Horas de uso', value: nd ? '—' : `${nf(d.hours)} h`, sub: nd ? '' : days >= 365 ? `≈ ${nf(days / 365, 1)} años` : `≈ ${nf(days)} días` },
    { icon: '#i-power', label: 'Ciclos de encendido', value: nd ? '—' : nf(d.cycles), sub: nd ? '' : `${nf(d.unsafe)} apagados inseguros` },
  ];
  const chip = (label: string, value: string, k: Tone, note: string): QuickChip => ({ label, value, k, st: TONE[k].label, icon: TONE[k].icon, note });
  const chips: QuickChip[] = nd
    ? []
    : [
        chip('Errores de medios', nf(d.mediaErr), mediaTone(d), d.mediaErr ? 'Datos comprometidos' : 'Sin errores de integridad'),
        chip('Log de errores', d.errLogUnavailable ? 'N/D' : nf(d.errLog || 0), d.errLog > 0 ? 'note' : 'ok', d.errLogUnavailable ? 'El disco no permite leerlo' : d.errLog ? 'Entradas registradas' : 'Sin entradas'),
        chip('Apagados inseguros', nf(d.unsafe), d.unsafe > 50 ? 'warn' : d.unsafe ? 'note' : 'ok', d.unsafe ? 'Desconexiones sin expulsar' : 'Ninguno'),
        chip('Advertencia crítica', d.critWarn ? '0x' + d.critWarn.toString(16).padStart(2, '0').toUpperCase() : 'Ninguna', d.critWarn ? 'crit' : 'ok', d.critWarn ? 'SMART reporta una falla' : 'SMART aprobado'),
      ];
  const b = opts.bench;
  const sc = opts.scan;
  return {
    nd,
    verdict: vk,
    vLabel: (VERDICT[vk] || VERDICT.nodata).label,
    vIcon: (VERDICT[vk] || VERDICT.nodata).icon,
    cap,
    brand,
    identity,
    kpis,
    readPct: rwTotal ? (readTB / rwTotal) * 100 : 50,
    hasSplit: !nd && rwTotal > 0,
    chips,
    spareK: nd ? 'ok' : spareTone(d),
    bench: b && b.seqRead ? { read: nf(b.seqRead), write: b.seqWrite ? nf(b.seqWrite) : '—', pct: b.ceiling ? Math.round((b.seqRead / b.ceiling) * 100) : null, ceiling: b.ceiling ? nf(b.ceiling) : null } : null,
    scan: sc ? { ok: sc.result === 'passed', label: sc.result === 'passed' ? 'Aprobado' : 'Con errores', dur: sc.durationText, zones: (sc.zones || []).length, avg: nf(sc.avg) } : null,
    recs: recsFor(d),
  };
}
