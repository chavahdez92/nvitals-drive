import { describe, expect, it } from 'vitest';
import profilerUsb4 from '../../fixtures/system_profiler/usb4-asm2464-kingston.json';
import { benchVerdict, type BenchSample } from './bench';
import { buildPath, linkHop, pcieHop, portHop } from './speedpath';

const seq = (r: number, w: number): BenchSample[] => [
  { key: 'SEQ1M Q8T1', write: false, mbps: r, iops: r, latUs: 2700 },
  { key: 'SEQ1M Q8T1', write: true, mbps: w, iops: w, latUs: 5100 },
];
const usb4 = buildPath(portHop(profilerUsb4), linkHop('usb4', 40, 'ASMedia ASM2464PD'), pcieHop(4, 4));

describe('benchVerdict', () => {
  it('Kingston real por USB4: el enlace es el límite y el SSD rendiría más', () => {
    const v = benchVerdict(seq(3080, 1628), usb4, { read: 3500 });
    expect(v.tone).toBe('optimal');
    expect(v.ofCeiling).toBeCloseTo(0.81, 2);
    expect(v.body).toContain('USB4 · 40 Gb/s');
    expect(v.body).toContain('Thunderbolt 5');
    expect(v.body).toContain('88 % de los 3,500 MB/s nominales');
  });

  it('muy por debajo del techo es advertencia', () => {
    expect(benchVerdict(seq(900, 800), usb4).tone).toBe('warning');
  });

  it('sin cadena conocida solo informa la medición', () => {
    const v = benchVerdict(seq(1000, 900), null);
    expect(v.tone).toBe('good');
    expect(v.title).toBe('1,000 MB/s de lectura');
  });

  it('sin mediciones', () => {
    expect(benchVerdict([], usb4).tone).toBe('nodata');
  });
});
