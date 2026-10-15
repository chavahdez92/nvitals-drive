import { describe, expect, it } from 'vitest';
import { HDI_MOCK } from '../ui/mock/mockData';
import { attentionLines, batchRows, batchSummary, pageCapacity, paginate, shortReasons, type BatchItem } from './batchReport';

// Discos del prototipo: Samsung Óptimo 98 · WD Bueno 58 · Kingston Atención 12 · SK hynix Crítico 9 · Crucial USB Sin datos · Apple Óptimo 99.
const DAY = 86_400_000;
const T0 = new Date(2026, 8, 12, 10, 0).getTime();
const items: BatchItem[] = HDI_MOCK.disks.map((d: any, i: number) => ({ serial: d.serial || 'CRUCIAL-' + d.id, model: d.model, takenAt: T0 + i * 3 * DAY, disk: d }));
const byId = (id: string) => items.find((x) => x.disk.id === id)!;

describe('reporte rápido de varios discos', () => {
  it('ordena lo más grave primero y, a igual veredicto, por vida útil', () => {
    expect(batchRows(items).map((r) => [r.n, r.verdict, r.lifeTxt])).toEqual([
      [1, 'critical', '9 %'],
      [2, 'warning', '12 %'],
      [3, 'nodata', '—'],
      [4, 'good', '58 %'],
      [5, 'optimal', '98 %'],
      [6, 'optimal', '99 %'],
    ]);
  });

  it('respeta el orden recibido si se pide, sin cambiar el resumen', () => {
    const given = items.slice().reverse();
    expect(batchRows(given, { order: 'given' }).map((r) => [r.n, r.serial])).toEqual(given.map((x, i) => [i + 1, x.serial]));
    const a = batchSummary(given, { order: 'given' }), b = batchSummary(items);
    expect(a.worst).toBe('critical');
    expect(a.attention.map((x) => x.serial)).toEqual(b.attention.map((x) => x.serial));
  });

  it('resume la salud de cada disco en una fila', () => {
    const [crit, warn, nd, , opt] = batchRows(items);
    expect(crit).toMatchObject({ model: 'SK hynix Platinum P41 2TB', serial: 'SSB8N18231030854K', cap: '2 TB', vLabel: 'Crítico', spareTxt: '4 %', spareSub: 'umbral 10 %', spareK: 'crit', mediaTxt: '37', mediaK: 'crit', smartTxt: 'SMART fallido · 0x05', smartK: 'crit', hoursTxt: '21,870 h', writtenTxt: '1,352 TB escritos', extra: null });
    expect(warn).toMatchObject({ vLabel: 'Atención', mediaK: 'warn', smartTxt: 'SMART aprobado', spareK: 'ok' });
    expect(nd).toMatchObject({ nd: true, vLabel: 'Sin datos', life: null, spareTxt: '—', mediaTxt: '—', smartTxt: 'Sin datos SMART', hoursTxt: '—', writtenTxt: '', cap: '4 TB' });
    expect(opt).toMatchObject({ vLabel: 'Óptimo', reasons: [], when: '12 sep 2026' });
  });

  it('solo incluye los datos del expediente si se piden', () => {
    const x = { ...byId('disk4'), status: 'sold', lot: 'Lote 20 × 2 TB', destination: 'Equipo contabilidad' };
    expect(batchRows([x])[0].extra).toBeNull();
    expect(batchRows([x], { extra: true })[0].extra).toBe('Vendido · Lote 20 × 2 TB · → Equipo contabilidad');
    expect(batchRows([byId('disk0')], { extra: true })[0].extra).toBe('—');
  });

  it('explica por qué un disco requiere atención', () => {
    expect(shortReasons(byId('disk5').disk)).toEqual(['repuesto 4 % bajo el umbral (10 %)', 'fiabilidad degradada', '37 errores de medios', 'vida útil 9 %']);
    expect(shortReasons(byId('disk8').disk)).toEqual(['3 errores de medios', 'vida útil 12 %']);
    expect(shortReasons(byId('disk7').disk)).toEqual(['sin datos SMART por USB']);
    expect(shortReasons({ life: 90, spare: 15, spareTh: 10, mediaErr: 1, critWarn: 0x02, smartPassed: true })).toEqual(['1 error de medios', 'repuesto 15 % cerca del umbral (10 %)', 'temperatura fuera de rango']);
    expect(shortReasons({ life: 90, spare: 100, spareTh: 10, mediaErr: 0, critWarn: 0, smartPassed: false })).toEqual(['autoevaluación SMART fallida']);
  });

  it('resume el grupo', () => {
    const s = batchSummary(items);
    expect(s.total).toBe(6);
    expect(s.counts).toEqual({ optimal: 2, good: 1, warning: 1, critical: 1, nodata: 1 });
    expect(s.tiles.map((t) => [t.label, t.count])).toEqual([['Óptimo', 2], ['Bueno', 1], ['Atención', 1], ['Crítico', 1], ['Sin datos', 1]]);
    expect(s.avgLife).toBe(55); // (98 + 58 + 12 + 9 + 99) / 5, sin el disco sin datos
    expect(s.minLife).toEqual({ life: 9, serial: 'SSB8N18231030854K', model: 'SK hynix Platinum P41 2TB' });
    expect(s.capTxt).toBe('11 TB');
    expect(s.rangeTxt).toBe('revisiones del 12 sep 2026 al 27 sep 2026');
    expect(s.worst).toBe('critical');
    expect(s.withMedia).toBe(2);
    expect(s.smartFailed).toBe(1);
    expect(s.attention.map((a) => a.vLabel)).toEqual(['Crítico', 'Atención', 'Sin datos']);
    const one = batchSummary([byId('disk4')]);
    expect(one.rangeTxt).toBe('revisión del 12 sep 2026');
    expect(one.worst).toBe('optimal');
    expect(one.attention).toEqual([]);
    expect(batchSummary([]).worst).toBe('nodata');
  });

  it('reparte las filas en hojas', () => {
    const n = (k: number) => Array.from({ length: k }, (_, i) => i);
    expect(paginate([], 14, 24).map((p) => p.length)).toEqual([0]);
    expect(paginate(n(1), 14, 24).map((p) => p.length)).toEqual([1]);
    expect(paginate(n(14), 14, 24).map((p) => p.length)).toEqual([14]);
    expect(paginate(n(15), 14, 24).map((p) => p.length)).toEqual([14, 1]);
    expect(paginate(n(40), 14, 22).map((p) => p.length)).toEqual([14, 22, 4]);
    expect(attentionLines(0)).toBe(0);
    expect(attentionLines(3)).toBe(3);
    expect(attentionLines(9)).toBe(6);
    const plain = pageCapacity('letter', false, 0), busy = pageCapacity('letter', false, 6), tall = pageCapacity('letter', true, 0);
    expect(busy.first).toBeLessThan(plain.first);
    expect(tall.first).toBeLessThan(plain.first);
    expect(tall.rest).toBeLessThan(plain.rest);
    expect(pageCapacity('a4', false, 0).rest).toBeGreaterThanOrEqual(plain.rest);
  });
});
