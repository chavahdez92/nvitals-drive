import { describe, expect, it } from 'vitest';
import appleSsd from '../../fixtures/smartctl/apple-ssd-ap1024z.x.json';
import disk0Info from '../../fixtures/diskutil/disk0.json';
import profilerInternal from '../../fixtures/system_profiler/internal-only.json';
import profilerUsb4 from '../../fixtures/system_profiler/usb4-asm2464-kingston.json';
import { HDI_MOCK } from '../ui/mock/mockData';
import { DEFAULT_THRESHOLDS, type Disk } from './disk';
import { connectionOf, normalizeDisk, sinceFor, type RawReading } from './normalize';
import { buildPath, linkHop, pcieHop, portHop } from './speedpath';
import { verdictFor } from './verdict';

const th = DEFAULT_THRESHOLDS;
const mock = (id: string) => HDI_MOCK.disks.find((d: Disk) => d.id === id);

/** smartctl -x -j sintético a partir de los datos canónicos del prototipo. */
function smartJsonFromMock(d: Disk, extra: object = {}) {
  return {
    smartctl: { version: [7, 5], exit_status: d.exit, messages: [] },
    device: { name: d.id, info_name: d.id, type: 'nvme', protocol: 'NVMe' },
    model_name: d.model,
    serial_number: d.serial,
    firmware_version: d.fw,
    nvme_version: { string: d.nvme },
    user_capacity: { blocks: d.blocks, bytes: d.bytes },
    logical_block_size: d.lbaSize,
    smart_status: { passed: !d.critWarn, nvme: { value: d.critWarn } },
    nvme_composite_temperature_threshold: { warning: d.warnT, critical: d.critT },
    nvme_smart_health_information_log: {
      critical_warning: d.critWarn, temperature: d.temp, available_spare: d.spare, available_spare_threshold: d.spareTh,
      percentage_used: d.used, data_units_read: d.duRead, data_units_written: d.duWritten, host_reads: d.hostReads,
      host_writes: d.hostWrites, controller_busy_time: d.busy, power_cycles: d.cycles, power_on_hours: d.hours,
      unsafe_shutdowns: d.unsafe, media_errors: d.mediaErr, num_err_log_entries: d.errLog, warning_temp_time: d.warnTime,
      critical_comp_time: d.critTime, temperature_sensors: d.sensors,
    },
    nvme_error_information_log: { size: 64, read: 16, unread: 0, table: [] },
    ...extra,
  };
}

const externalPci = { Internal: false, BusProtocol: 'PCI-Express', TotalSize: 2000398934016, MediaName: 'x' };

function reading(id: string, json: object | null, diskutil: object = externalPci, exit = 0): RawReading {
  return { id, diskutil, smart: json ? { cmd: '', disk: id, exit, json, text: [], stderr: '', durationMs: 1, startedAt: 0 } : null };
}

describe('normalizeDisk · SSD interno real (APPLE SSD AP1024Z)', () => {
  const d = normalizeDisk(reading('disk0', appleSsd, disk0Info, 4), profilerInternal, th);

  it('reconoce el disco interno y su lectura parcial', () => {
    expect(d.model).toBe('APPLE SSD AP1024Z');
    expect(d.conn).toBe('internal');
    expect(d.connLabel).toBe('Interno');
    expect(d.link).toBe('Apple Fabric');
    expect(d.internal).toBe(true);
    expect(d.bootDisk).toBe(true);
    expect(d.exit).toBe(4);
    expect(d.errLogUnavailable).toBe(true);
    expect(d.errLog).toBeNull();
    expect(d.selftestUnsupported).toBe(true);
  });

  it('calcula vida útil, repuesto y umbrales estimados', () => {
    expect(d.used).toBe(appleSsd.endurance_used.current_percent);
    expect(d.life).toBe(100 - appleSsd.endurance_used.current_percent);
    expect(d.spare).toBe(100);
    expect(d.spareTh).toBe(99);
    expect(d.estThresholds).toBe(true);
    expect([d.warnT, d.critT]).toEqual([70, 80]);
    expect(d.lbaSize).toBe(4096);
    expect(d.capacityTB).toBe(1);
    expect(d.verdict).toBe('optimal');
    expect(d.pciVendor).toBe('Apple · 0x106B');
  });
});

describe('normalizeDisk · casos canónicos del prototipo', () => {
  it.each([
    ['disk4', 'optimal'],
    ['disk6', 'good'],
    ['disk8', 'warning'],
    ['disk5', 'critical'],
  ])('%s → mismo veredicto, cifras y frase que el diseño', (id, verdict) => {
    const m = mock(id);
    const d = normalizeDisk(reading(id, smartJsonFromMock(m), externalPci, m.exit), null, th);
    expect(d.verdict).toBe(verdict);
    expect(d.life).toBe(m.life);
    expect(d.writtenText).toBe(m.writtenText);
    expect(d.readText).toBe(m.readText);
    expect(d.spare).toBe(m.spare);
    expect(d.mediaErr).toBe(m.mediaErr);
    expect(d.warnT).toBe(m.warnT);
    if (id !== 'disk5') expect(d.sentence).toBe(m.sentence);
  });

  it('frase crítica explica cada causa', () => {
    const m = mock('disk5');
    const d = normalizeDisk(reading('disk5', smartJsonFromMock(m), externalPci, m.exit), null, th);
    expect(d.sentence).toBe('Estado crítico: el repuesto (4 %) está por debajo del umbral (10 %), la fiabilidad está degradada y hay 37 errores de medios. Respalda tus datos lo antes posible.');
  });

  it('USB 3.x sin SMART → Sin datos con el puente identificado', () => {
    const usbInfo = { Internal: false, BusProtocol: 'USB', TotalSize: 4000787030016, MediaName: 'RTL9210B NVME Media' };
    const profiler = { SPUSBHostDataType: [{ _items: [{ _name: 'RTL9210B-CG', vendor_id: '0x0bda', product_id: '0x9210', device_speed: 'up_to_10_Gb/s', _items: [{ bsd_name: 'disk7' }] }] }] };
    const d = normalizeDisk(reading('disk7', { smartctl: { exit_status: 2, messages: [{ string: 'Unknown USB bridge' }] } }, usbInfo, 2), profiler, th);
    expect(d.verdict).toBe('nodata');
    expect(d.nodata).toBe(true);
    expect(d.conn).toBe('usb');
    expect(d.connLabel).toBe('USB 3.2 Gen 2');
    expect(d.bridge).toBe('Puente USB Realtek RTL9210');
    expect(d.reason).toBe('Puente USB Realtek RTL9210: macOS no permite leer SMART por USB.');
    expect(d.capacityTB).toBe(4);
    expect(d.sentence).toMatch(/No se pueden leer datos SMART por USB/);
  });
});

describe('verdictFor · límites de las reglas', () => {
  const base = { life: 90, spare: 100, spareTh: 10, mediaErr: 0, critWarn: 0, smartPassed: true };
  it.each([
    [{}, 'optimal'],
    [{ life: 80 }, 'optimal'],
    [{ life: 79 }, 'good'],
    [{ life: 21 }, 'good'],
    [{ life: 20 }, 'warning'],
    [{ mediaErr: 1 }, 'warning'],
    [{ mediaErr: 9 }, 'warning'],
    [{ mediaErr: 10 }, 'critical'],
    [{ spare: 20 }, 'warning'],
    [{ spare: 21 }, 'optimal'],
    [{ spare: 9 }, 'critical'],
    [{ critWarn: 0x02 }, 'optimal'],
    [{ critWarn: 0x04 }, 'critical'],
    [{ smartPassed: false }, 'critical'],
    [{ spare: 100, spareTh: 99 }, 'optimal'],
    [{ spare: 99, spareTh: 99 }, 'warning'],
  ])('%j → %s', (patch, expected) => {
    expect(verdictFor({ ...base, ...patch }, th)).toBe(expected);
  });
});

describe('conexión y "desde la última revisión"', () => {
  it('lee el enlace PCIe de system_profiler', () => {
    const profiler = { SPNVMeDataType: [{ _name: 'Generic SSD Controller', _items: [{ bsd_name: 'disk4', spnvme_linkspeed: '16.0 GT/s', spnvme_linkwidth: 'x4' }] }] };
    const c = connectionOf('disk4', externalPci, profiler);
    expect(c.conn).toBe('thunderbolt');
    expect(c.linkShort).toBe('PCIe Gen4 ×4');
    expect(c.link).toBe('PCIe Gen4 ×4 · 16 GT/s');
  });

  it('detecta USB4 (mode_key usb_four), el chip ASM2464PD y la cadena de velocidad reales', () => {
    const c = connectionOf('disk6', externalPci, profilerUsb4);
    expect(c.conn).toBe('usb4');
    expect(c.connLabel).toBe('USB4 40 Gb/s');
    expect(c.bridge).toBe('ASMedia ASM2464PD');
    expect(c.linkShort).toBe('PCIe Gen4 ×4');
    expect(c.path?.port.label).toBe('Thunderbolt 5');
    expect(c.path?.port.detail).toBe('Hasta 120 Gb/s por puerto');
    expect(c.path?.link.label).toBe('USB4 · 40 Gb/s');
    expect(c.path?.ssd.mbps).toBe(7876);
    expect(c.path?.bottleneck).toBe('link');
    expect(c.path?.ceiling).toBe(3800);
  });

  it('un gabinete USB 3.2 Gen 2 limita a ~1,050 MB/s', () => {
    const p = buildPath(portHop(profilerUsb4), linkHop('usb', 10, 'Puente USB Realtek RTL9210'), pcieHop(null, null));
    expect(p.bottleneck).toBe('link');
    expect(p.ceiling).toBe(1050);
    expect(p.link.detail).toBe('Realtek RTL9210');
  });

  it('el SSD Gen3 ×4 es el límite en Thunderbolt 5', () => {
    const p = buildPath(portHop(profilerUsb4), linkHop('thunderbolt', 80, null), pcieHop(3, 4));
    expect(p.bottleneck).toBe('ssd');
    expect(p.ceiling).toBe(3940);
  });

  it('resume los cambios desde la instantánea anterior', () => {
    const m = mock('disk4');
    const now = Date.UTC(2026, 8, 24);
    const since = sinceFor(m, { takenAt: now - 12 * 86400000, data: { writtenTB: 30.84, hours: 2138, mediaErr: 0 } }, now);
    expect(since).toEqual({ ago: 'hace 12 días', text: '+0.8 TB escritos · +26 h · sin errores nuevos' });
    expect(sinceFor(m, { takenAt: now - 60000, data: {} }, now)).toBeNull();
  });
});
