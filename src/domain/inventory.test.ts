import { describe, expect, it } from 'vitest';
import appleSsd from '../../fixtures/smartctl/apple-ssd-ap1024z.x.json';
import disk0Info from '../../fixtures/diskutil/disk0.json';
import profilerInternal from '../../fixtures/system_profiler/internal-only.json';
import { DEFAULT_THRESHOLDS } from './disk';
import { HDI_MOCK } from '../ui/mock/mockData';
import { sortItems } from './batchReport';
import { checkDelta, filterInventory, lotsOf, normalizeSerial, parseMoney, sortInventory, validSerial, type InventoryRow } from './inventory';
import { normalizeDisk } from './normalize';
import { quickView } from './quickView';

const row = (serial: string, extra: Partial<InventoryRow> = {}): InventoryRow => ({
  serial, deviceKey: 'k|' + serial, model: 'KINGSTON SNV2S1000G', status: 'stock', createdAt: 0, updatedAt: 0, checks: 1, last: null, ...extra,
});

describe('expedientes', () => {
  it('valida y normaliza números de serie', () => {
    expect(validSerial('95815F87012E7D03')).toBe(true);
    expect(validSerial('S7DN-NJ0W_1.2')).toBe(true);
    for (const bad of ['', '../x', 'a/b', '.x', 'a..b', 'con espacio']) expect(validSerial(bad)).toBe(false);
    expect(normalizeSerial(' s7dn nj0w ')).toBe('S7DNNJ0W');
  });

  it('busca por serie, modelo, lote, destino y notas, y filtra por estado y lote', () => {
    const rows = [
      row('SN1', { lot: 'Lote 20 × 2 TB', destination: 'Equipo contabilidad' }),
      row('SN2', { lot: 'Lote 20 × 2 TB', status: 'sold', notes: 'gabinete rayado' }),
      row('AB3', { model: 'Samsung 990 PRO', lot: 'Lote B' }),
    ];
    expect(filterInventory(rows, { q: 'sn' }).map((r) => r.serial)).toEqual(['SN1', 'SN2']);
    expect(filterInventory(rows, { q: 'contab' }).map((r) => r.serial)).toEqual(['SN1']);
    expect(filterInventory(rows, { q: 'rayado' }).map((r) => r.serial)).toEqual(['SN2']);
    expect(filterInventory(rows, { q: '990' }).map((r) => r.serial)).toEqual(['AB3']);
    expect(filterInventory(rows, { status: 'sold' }).map((r) => r.serial)).toEqual(['SN2']);
    expect(filterInventory(rows, { lot: 'Lote B' }).map((r) => r.serial)).toEqual(['AB3']);
    expect(lotsOf(rows)).toEqual(['Lote 20 × 2 TB', 'Lote B']);
  });

  it('resume los cambios entre revisiones', () => {
    expect(checkDelta(null, { life: 95 })).toBeNull();
    expect(checkDelta({ life: 95, writtenTB: 44.68, hours: 4787, mediaErr: 0 }, { life: 94, writtenTB: 44.9, hours: 4813, mediaErr: 0 })?.text)
      .toBe('−1 % vida · +0.22 TB escritos · +26 h · sin errores nuevos');
    expect(checkDelta({ life: 90, writtenTB: 1, hours: 1, mediaErr: 0 }, { life: 90, writtenTB: 1, hours: 1, mediaErr: 3 })?.text)
      .toBe('misma vida útil · +3 errores de medios');
  });

  it('ordena por cualquier columna, con los vacíos al final', () => {
    const last = (life: number | null, hours: number | null, verdict = 'optimal', takenAt = 1) => ({ id: 1, takenAt, verdict, life, hours, writtenTB: hours == null ? null : hours / 100, capacityTB: 1 });
    const rows = [
      row('SN-10', { model: 'WD_BLACK SN770', lot: 'Lote 2', last: last(98, 3296) }),
      row('SN-2', { model: 'ADATA LEGEND 800', status: 'sold', last: last(70, 12000, 'good', 5) }),
      row('SN-3', { model: 'KINGSTON SNV2S500G', lot: 'Lote 10', last: last(null, null, 'nodata', 3) }),
      row('SN-4', { model: 'SAMSUNG 990 PRO', lot: 'Lote 2', last: last(9, 800, 'critical', 2) }),
      row('SN-5', { model: 'ADATA LEGEND 800', last: null }),
    ];
    const by = (key: any, dir: any) => sortInventory(rows, { key, dir }).map((r) => r.serial);
    expect(by('health', 'asc')).toEqual(['SN-4', 'SN-3', 'SN-5', 'SN-2', 'SN-10']);
    expect(by('health', 'desc')).toEqual(['SN-10', 'SN-2', 'SN-3', 'SN-5', 'SN-4']);
    expect(by('hours', 'desc')).toEqual(['SN-2', 'SN-10', 'SN-4', 'SN-3', 'SN-5']);
    expect(by('hours', 'asc')).toEqual(['SN-4', 'SN-10', 'SN-2', 'SN-3', 'SN-5']);
    expect(by('written', 'desc')).toEqual(['SN-2', 'SN-10', 'SN-4', 'SN-3', 'SN-5']);
    expect(by('life', 'asc')).toEqual(['SN-4', 'SN-2', 'SN-10', 'SN-3', 'SN-5']);
    expect(by('serial', 'asc')).toEqual(['SN-10', 'SN-2', 'SN-3', 'SN-4', 'SN-5']);
    expect(by('serial', 'desc')).toEqual(['SN-5', 'SN-4', 'SN-3', 'SN-2', 'SN-10']);
    expect(by('model', 'asc')).toEqual(['SN-2', 'SN-5', 'SN-3', 'SN-4', 'SN-10']);
    expect(by('lot', 'asc')).toEqual(['SN-10', 'SN-4', 'SN-3', 'SN-2', 'SN-5']);
    expect(by('lot', 'desc')).toEqual(['SN-3', 'SN-10', 'SN-4', 'SN-2', 'SN-5']);
    expect(by('status', 'asc')).toEqual(['SN-10', 'SN-3', 'SN-4', 'SN-5', 'SN-2']);
    expect(by('taken', 'desc')).toEqual(['SN-2', 'SN-3', 'SN-4', 'SN-10', 'SN-5']);
  });

  it('«Salud» por defecto da el mismo orden que el reporte de varios discos', () => {
    const disks = HDI_MOCK.disks as any[];
    const rows = disks.map((d, i) => row(d.serial || 'X' + i, { model: d.model, last: { id: i, takenAt: 1, verdict: d.nodata ? 'nodata' : d.verdict, life: d.nodata ? null : d.life, hours: d.hours ?? null, writtenTB: d.writtenTB ?? null, capacityTB: d.capacityTB ?? null } }));
    const items = disks.map((d, i) => ({ serial: d.serial || 'X' + i, model: d.model, takenAt: 1, disk: d }));
    expect(sortInventory(rows).map((r) => r.serial)).toEqual(sortItems(items).map((x) => x.serial));
  });

  it('interpreta precios escritos a mano', () => {
    expect(parseMoney('$1,250.50')).toBe(1250.5);
    expect(parseMoney('')).toBeNull();
  });
});

describe('quickView (reporte rápido y ficha del expediente)', () => {
  const d = normalizeDisk({ id: 'disk0', diskutil: disk0Info, smart: { cmd: '', disk: 'disk0', exit: 4, json: appleSsd, text: [], stderr: '', durationMs: 1, startedAt: 0 } }, profilerInternal, DEFAULT_THRESHOLDS);

  it('arma identidad, uso e integridad del disco real', () => {
    const qv = quickView(d, { mask: true });
    expect(qv.verdict).toBe(d.verdict);
    expect(qv.brand).toBe('Apple');
    expect(qv.identity.find(([k]) => k === 'Número de serie')?.[1]).toMatch(/^.{6}•+$/);
    expect(qv.kpis.map((k) => k.label)).toEqual(['Datos leídos', 'Datos escritos', 'Horas de uso', 'Ciclos de encendido']);
    expect(qv.chips.find((c) => c.label === 'Log de errores')?.value).toBe('N/D');
    expect(qv.bench).toBeNull();
    expect(quickView(d, { bench: { seqRead: 3080, seqWrite: 1628, ceiling: 3800 } }).bench).toEqual({ read: '3,080', write: '1,628', pct: 81, ceiling: '3,800' });
  });
});
