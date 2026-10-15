/**
 * Normalización: salida real de smartctl (JSON 7.x), diskutil y system_profiler →
 * modelo `Disk` (la forma de los datos del prototipo). Rutas JSON: plan, apéndice A.
 * Puro y sin E/S: se prueba con fixtures reales (src/domain/normalize.test.ts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConnKind, Disk, SelfTestEntry, Thresholds } from './disk';
import { DATA_UNIT_BYTES, hex, nf, tbText } from './format';
import { buildPath, linkHop, pcieHop, portHop } from './speedpath';
import { sentenceFor, verdictFor } from './verdict';

export interface CmdResult {
  cmd: string;
  disk: string | null;
  exit: number;
  json: any | null;
  text: string[];
  stderr: string;
  durationMs: number;
  startedAt: number;
}

export interface RawReading {
  id: string;
  diskutil: any;
  smart: CmdResult | null;
  error?: string | null;
}

const PCI_VENDORS: Record<number, string> = {
  0x144d: 'Samsung', 0x15b7: 'Sandisk', 0x1c5c: 'SK hynix', 0x1e0f: 'KIOXIA', 0x1344: 'Micron', 0x2646: 'Kingston',
  0x1987: 'Phison', 0x126f: 'Silicon Motion', 0x1cc1: 'ADATA', 0x1d97: 'Longsys', 0x1e4b: 'MAXIO', 0x1bb1: 'Seagate',
  0x025e: 'Solidigm', 0x8086: 'Intel', 0x106b: 'Apple', 0x1179: 'Toshiba', 0x1b4b: 'Marvell', 0x10ec: 'Realtek',
};

/** Puentes USB conocidos (vendor:product) → nombre. */
const USB_BRIDGES: Record<string, string> = {
  '0bda:9210': 'Realtek RTL9210', '0bda:9220': 'Realtek RTL9220', '0bda:9211': 'Realtek RTL9210B',
  '152d:0583': 'JMicron JMS583', '152d:0580': 'JMicron JMS580', '152d:0562': 'JMicron JMS562', '152d:0578': 'JMicron JMS578',
  '174c:2362': 'ASMedia ASM2362', '174c:2364': 'ASMedia ASM2364', '174c:246d': 'ASMedia ASM2464PD', '174c:2463': 'ASMedia ASM2464PD', '174c:2464': 'ASMedia ASM2464PD', '174c:1352': 'ASMedia ASM1352R',
};

const BRAND_PREFIX = /^(samsung ssd|samsung|wd_black|wd blue|wd red|wdc|wd|western digital|kingston|crucial|sk hynix|hynix|sabrent|corsair|lexar|adata|xpg|seagate|team|teamgroup|micron|intel|kioxia|toshiba|solidigm|apple ssd|patriot|pny|hp|msi|gigabyte|lenovo)\s+/i;

const get = (o: any, path: string): any => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
const num = (v: any): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function vendorFromModel(model: string): string {
  const m = model.toLowerCase();
  const table: [string, string][] = [['samsung', 'Samsung'], ['wd', 'Western Digital'], ['western', 'Western Digital'], ['kingston', 'Kingston'], ['crucial', 'Crucial'], ['hynix', 'SK hynix'], ['apple', 'Apple'], ['sabrent', 'Sabrent'], ['corsair', 'Corsair'], ['lexar', 'Lexar'], ['seagate', 'Seagate'], ['kioxia', 'KIOXIA'], ['intel', 'Intel'], ['solidigm', 'Solidigm'], ['adata', 'ADATA'], ['micron', 'Micron']];
  return table.find(([k]) => m.includes(k))?.[1] || 'Desconocido';
}

function shortName(model: string, internal: boolean): string {
  if (internal) return 'Disco interno';
  const s = model.replace(BRAND_PREFIX, '').trim();
  return s || model;
}

/** Busca en el árbol de system_profiler el nodo cuyo bsd_name coincide con el disco. */
function findByBsd(node: any, id: string, parents: any[] = []): { item: any; parents: any[] } | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const x of node) {
      const r = findByBsd(x, id, parents);
      if (r) return r;
    }
    return null;
  }
  if (node.bsd_name === id) return { item: node, parents };
  for (const v of Object.values(node)) {
    const r = findByBsd(v, id, [...parents, node]);
    if (r) return r;
  }
  return null;
}

const GEN: Record<string, number> = { '2.5': 1, '5': 2, '5.0': 2, '8': 3, '8.0': 3, '16': 4, '16.0': 4, '32': 5, '32.0': 5, '64': 6 };

/** Conexión, enlace y puente a partir de diskutil + system_profiler. */
export function connectionOf(id: string, diskutil: any, profiler: any): Pick<Disk, 'conn' | 'connLabel' | 'link' | 'linkShort' | 'bridge' | 'internal' | 'path'> {
  const internal = diskutil?.Internal === true;
  const bus = String(diskutil?.BusProtocol || '');
  if (internal) return { conn: 'internal', connLabel: 'Interno', link: bus || 'Apple Fabric', linkShort: bus || 'Apple Fabric', bridge: null, internal: true, path: null };

  if (/usb/i.test(bus)) {
    const hit = findByBsd(profiler?.SPUSBHostDataType, id);
    const chain = hit ? [...hit.parents, hit.item] : [];
    let bridge: string | null = null;
    let speed = '';
    for (const n of chain.reverse()) {
      const vid = String(n.vendor_id || n.USBDeviceKeyVendorID || '').replace(/^0x/, '').toLowerCase().padStart(4, '0');
      const pid = String(n.product_id || n.USBDeviceKeyProductID || '').replace(/^0x/, '').toLowerCase().padStart(4, '0');
      if (!bridge && USB_BRIDGES[`${vid}:${pid}`]) bridge = USB_BRIDGES[`${vid}:${pid}`];
      if (!bridge && (n._name || n.USBDeviceKeyProductName) && vid !== '0000') bridge = String(n._name || n.USBDeviceKeyProductName);
      speed = speed || String(n.device_speed || n.USBDeviceKeyLinkSpeed || n.speed || '');
    }
    const gbps = speed.match(/(\d+(?:\.\d+)?)[\s_]*Gb/i)?.[1];
    const linkShort = gbps ? `${gbps} Gb/s` : speed.match(/(\d+)\s*Mb/i) ? speed : 'USB';
    const connLabel = gbps === '20' ? 'USB 3.2 Gen 2×2' : gbps === '10' ? 'USB 3.2 Gen 2' : gbps === '5' ? 'USB 3.2 Gen 1' : 'USB';
    const bridgeLabel = bridge ? `Puente USB ${bridge}` : 'Puente USB';
    const gNum = gbps ? parseFloat(gbps) : /480\s*Mb/i.test(speed) ? 0.48 : null;
    // Por USB no hay datos del enlace PCIe del SSD (el puente no los pasa).
    const path = buildPath(portHop(profiler), linkHop('usb', gNum, bridgeLabel), pcieHop(null, null));
    return { conn: 'usb', connLabel, link: linkShort, linkShort, bridge: bridgeLabel, internal: false, path };
  }

  // PCIe externo: Thunderbolt o USB4 (túnel PCIe).
  const nvme = findByBsd(profiler?.SPNVMeDataType, id);
  const flat = nvme ? { ...(nvme.parents[nvme.parents.length - 1] || {}), ...nvme.item } : {};
  const speedKey = Object.keys(flat).find((k) => /link_?speed/i.test(k));
  const widthKey = Object.keys(flat).find((k) => /link_?width/i.test(k));
  const gts = speedKey ? String(flat[speedKey]).match(/([\d.]+)\s*GT/i)?.[1] : undefined;
  const width = widthKey ? String(flat[widthKey]).match(/x?(\d+)/i)?.[1] : undefined;
  const gen = gts ? GEN[gts] ?? GEN[String(parseFloat(gts))] : undefined;
  const linkShort = gen ? `PCIe Gen${gen}${width ? ' ×' + width : ''}` : 'PCIe';
  const link = gen ? `${linkShort} · ${nf(parseFloat(gts!))} GT/s` : 'PCIe';

  // Thunderbolt/USB4: dispositivo conectado en algún bus (receptáculo con dispositivos).
  const buses: any[] = Array.isArray(profiler?.SPThunderboltDataType) ? profiler.SPThunderboltDataType : [];
  const connected = buses.flatMap((b) => (Array.isArray(b._items) ? b._items.map((it: any) => ({ bus: b, it })) : []));
  const first = connected[0];
  const mode = first ? String(first.it.mode_key || first.it.device_mode_key || '') : '';
  // Velocidad negociada: la del receptáculo del dispositivo o, si falta, la del bus.
  const speed = first
    ? String(first.it.receptacle_upstream_ambiguous_tag?.current_speed_key || first.bus.receptacle_1_tag?.current_speed_key || first.it.current_speed_key || '')
    : '';
  const usb4 = /usb[_\s-]?(4|four)/i.test(mode);
  const gb = speed.match(/(\d+)\s*Gb/i)?.[1];
  const connLabel = usb4 ? `USB4${gb ? ' ' + gb + ' Gb/s' : ''}` : gb && +gb >= 80 ? 'Thunderbolt 5' : 'Thunderbolt' + (gb ? ` · ${gb} Gb/s` : '');
  const enclosure = first ? enclosureName(first.it) : '';
  const path = buildPath(portHop(profiler), linkHop(usb4 ? 'usb4' : 'thunderbolt', gb ? parseFloat(gb) : null, enclosure || null), pcieHop(gen ?? null, width ? parseInt(width, 10) : null));
  return { conn: usb4 ? 'usb4' : 'thunderbolt', connLabel, link, linkShort, bridge: enclosure || null, internal: false, path };
}

/** Nombre del gabinete: chip conocido por vendor/device id o, si no, los nombres que da el sistema. */
function enclosureName(it: any): string {
  const vid = String(it.vendor_id_key || '').replace(/^0x/i, '').toLowerCase().padStart(4, '0');
  const did = String(it.device_id_key || '').replace(/^0x/i, '').toLowerCase().padStart(4, '0');
  const chip = USB_BRIDGES[`${vid}:${did}`];
  if (chip) return chip;
  const vendor = String(it.vendor_name_key || '');
  const name = String(it.device_name_key || '');
  return name.toLowerCase().startsWith(vendor.toLowerCase()) ? name : [vendor, name].filter(Boolean).join(' ');
}

const SELFTEST_TYPE: Record<string, string> = { Short: 'Corta', Extended: 'Extendida', 'Vendor specific': 'Del fabricante' };
function selfTestResult(s: string, value: number): string {
  if (value === 0) return 'Completada sin errores';
  const map: [RegExp, string][] = [
    [/aborted.*self-test command/i, 'Cancelada por comando'], [/aborted.*reset/i, 'Cancelada por reinicio'],
    [/namespace removed/i, 'Cancelada: namespace eliminado'], [/format/i, 'Cancelada por formateo'],
    [/fatal/i, 'Falló: error fatal'], [/unknown segment/i, 'Falló: segmento desconocido'],
    [/failed segments|segment/i, 'Falló: error de lectura'], [/aborted/i, 'Cancelada'],
  ];
  return map.find(([re]) => re.test(s))?.[1] || s || 'Resultado ' + value;
}

const PERF = ['Mejor', 'Muy buena', 'Buena', 'Degradada'];

export interface PrevSnapshot {
  takenAt: number;
  data: { writtenTB?: number; hours?: number; mediaErr?: number };
}

export function normalizeDisk(r: RawReading, profiler: any, th: Thresholds, prev?: PrevSnapshot | null, now = Date.now()): Disk {
  const du = r.diskutil || {};
  const j = r.smart?.json || null;
  const conn = connectionOf(r.id, du, profiler);
  const model = String(j?.model_name || du.MediaName || du.IORegistryEntryName || 'Disco sin nombre').replace(/ Media$/, '');
  const bytes = num(get(j, 'user_capacity.bytes')) ?? num(j?.nvme_total_capacity) ?? num(du.TotalSize) ?? num(du.Size) ?? 0;
  const lbaSize = num(j?.logical_block_size) ?? num(get(j, 'nvme_namespaces.0.formatted_lba_size')) ?? num(du.DeviceBlockSize) ?? 512;
  const blocks = num(get(j, 'user_capacity.blocks')) ?? (lbaSize ? Math.round(bytes / lbaSize) : 0);
  const capacityTB = Math.round(bytes / 1e11) / 10;
  const serial = String(j?.serial_number || '');
  const exit = r.smart?.exit ?? 2;
  const HL = j?.nvme_smart_health_information_log;
  const protocol = String(get(j, 'device.protocol') || '');
  const hasSmart = !!(HL || j?.ata_smart_attributes || j?.smart_status);

  const base = {
    id: r.id, key: '', model, short: shortName(model, conn.internal), vendor: vendorFromModel(model),
    capacityTB, bytes, blocks, lbaSize, ...conn, bootDisk: conn.internal,
    exit, protocol, ioservice: String(get(j, 'device.info_name') || du.DeviceTreePath || ''), since: null,
  };

  const empty = {
    life: 0, used: 0, writtenTB: 0, writtenText: '—', readTB: 0, readText: '—', duWritten: 0, duRead: 0, hostWrites: 0, hostReads: 0,
    busy: 0, hours: 0, cycles: 0, unsafe: 0, spare: 0, spareTh: 0, mediaErr: 0, errLog: null, critWarn: 0, smartPassed: true, temp: 0,
    sensors: [], warnT: th.thWarn, critT: th.thCrit, estThresholds: true, warnTime: 0, critTime: 0, fw: '', nvme: '', serial: '', pciVendor: '',
    oui: '', namespaces: null, ctrlId: null, selftests: [], errors: [], powerStates: [], lbaFormats: [], optAdmin: {}, optNvm: {},
  };

  if (!hasSmart) {
    const reason = conn.conn === 'usb'
      ? `${conn.bridge || 'Puente USB'}: macOS no permite leer SMART por USB.`
      : `smartctl no pudo leer datos SMART de este disco${r.error ? ` (${r.error})` : ''}.`;
    const d: Disk = { ...base, ...empty, verdict: 'nodata', nodata: true, reason, sentence: '', key: keyOf(model, serial, bytes, r.id) };
    d.sentence = sentenceFor(d, th);
    return d;
  }

  const used = num(get(j, 'endurance_used.current_percent')) ?? num(HL?.percentage_used) ?? 0;
  const life = Math.max(0, 100 - used);
  const duWritten = num(HL?.data_units_written) ?? 0;
  const duRead = num(HL?.data_units_read) ?? 0;
  const writtenTB = (duWritten * DATA_UNIT_BYTES) / 1e12;
  const readTB = (duRead * DATA_UNIT_BYTES) / 1e12;
  const spare = num(get(j, 'spare_available.current_percent')) ?? num(HL?.available_spare) ?? 100;
  const spareTh = num(get(j, 'spare_available.threshold_percent')) ?? num(HL?.available_spare_threshold) ?? 0;
  const temp = num(get(j, 'temperature.current')) ?? num(HL?.temperature) ?? 0;
  const warnRaw = num(get(j, 'nvme_composite_temperature_threshold.warning'));
  const critRaw = num(get(j, 'nvme_composite_temperature_threshold.critical'));
  const est = !(warnRaw && critRaw);
  const messages: any[] = get(j, 'smartctl.messages') || [];
  const errLogUnavailable = !j?.nvme_error_information_log && messages.some((m) => /error information log/i.test(String(m.string)));
  const oa = j?.nvme_optional_admin_commands || {};
  const on = j?.nvme_optional_nvm_commands || {};
  const pciId = num(get(j, 'nvme_pci_vendor.id'));
  const ouiNum = num(j?.nvme_ieee_oui_identifier);

  const selftests: SelfTestEntry[] = (get(j, 'nvme_self_test_log.table') || []).map((t: any) => {
    const value = num(get(t, 'self_test_result.value')) ?? 0;
    const lba = num(get(t, 'lba')) ?? num(get(t, 'failing_lba'));
    return {
      type: SELFTEST_TYPE[String(get(t, 'self_test_code.string'))] || String(get(t, 'self_test_code.string') || 'Autoprueba'),
      result: selfTestResult(String(get(t, 'self_test_result.string') || ''), value),
      hours: num(t.power_on_hours) ?? 0,
      lba: lba != null ? nf(lba) : '—',
      ok: value === 0,
    };
  });

  const errors: string[][] = (get(j, 'nvme_error_information_log.table') || []).map((e: any, i: number) => {
    const status = num(get(e, 'status_field.value')) ?? 0;
    const statusText = String(get(e, 'status_field.string') || '');
    const lba = num(get(e, 'lba.value'));
    return [String(i), String(num(e.error_count) ?? 0), String(num(e.submission_queue_id) ?? '—'), hex(num(e.command_id) ?? 0, 4),
      hex(status, 4) + (statusText ? ' · ' + statusText : ''), lba != null ? nf(lba) : '—', String(num(e.nsid) ?? '—')];
  });

  const powerStates: string[][] = (j?.nvme_power_states || []).map((p: any, i: number) => {
    const mp = p.max_power || {};
    const w = mp.units_per_watt ? mp.value / mp.units_per_watt : null;
    return [`PS${i}`, w != null && w > 0 ? `${nf(w, w < 1 ? 4 : 2)} W` : '— W', p.non_operational_state ? 'Inactivo' : 'Operativo',
      `${nf(num(p.entry_latency_us) ?? 0)} µs`, `${nf(num(p.exit_latency_us) ?? 0)} µs`];
  });

  const lbaFormats: string[][] = (j?.nvme_lba_formats || []).map((f: any, i: number) => [
    String(i), `${nf(num(f.data_bytes) ?? 0)} B`, String(num(f.metadata_bytes) ?? 0),
    (PERF[num(f.relative_performance) ?? 0] || '—') + (f.formatted ? ' · en uso' : ''),
  ]);
  if (!lbaFormats.length && lbaSize) lbaFormats.push(['0', `${nf(lbaSize)} B`, '0', 'Mejor · en uso']);

  const d: Disk = {
    ...base,
    ...empty,
    key: keyOf(model, serial, bytes, r.id),
    verdict: 'optimal',
    sentence: '',
    life, used, writtenTB, writtenText: tbText(writtenTB), readTB, readText: tbText(readTB), duWritten, duRead,
    hostWrites: num(HL?.host_writes) ?? 0, hostReads: num(HL?.host_reads) ?? 0, busy: num(HL?.controller_busy_time) ?? 0,
    hours: num(get(j, 'power_on_time.hours')) ?? num(HL?.power_on_hours) ?? 0,
    cycles: num(j?.power_cycle_count) ?? num(HL?.power_cycles) ?? 0,
    unsafe: num(HL?.unsafe_shutdowns) ?? 0, spare, spareTh, mediaErr: num(HL?.media_errors) ?? 0,
    errLog: errLogUnavailable ? null : num(HL?.num_err_log_entries) ?? 0,
    critWarn: num(HL?.critical_warning) ?? num(get(j, 'smart_status.nvme.value')) ?? 0,
    smartPassed: get(j, 'smart_status.passed') !== false,
    temp, sensors: (HL?.temperature_sensors || []).filter((x: any) => typeof x === 'number'),
    warnT: est ? th.thWarn : warnRaw!, critT: est ? th.thCrit : critRaw!, estThresholds: est,
    warnTime: num(HL?.warning_temp_time) ?? 0, critTime: num(HL?.critical_comp_time) ?? 0,
    fw: String(j?.firmware_version || ''), nvme: String(get(j, 'nvme_version.string') || ''), serial,
    pciVendor: pciId != null ? `${PCI_VENDORS[pciId] || 'Proveedor'} · ${hex(pciId, 4)}` : '',
    oui: ouiNum != null ? hex(ouiNum, 6) : '',
    namespaces: num(j?.nvme_number_of_namespaces), ctrlId: num(j?.nvme_controller_id),
    errLogUnavailable, selftestUnsupported: oa.self_test === false,
    selftests, errors, powerStates, lbaFormats,
    optAdmin: { selftest: !!oa.self_test, format: !!oa.format_nvm, fwdl: !!oa.firmware_download, security: !!oa.security_send_receive, nsmgmt: !!oa.namespace_management, virt: !!oa.virtualization_management },
    optNvm: { dsm: !!on.dataset_management, wz: !!on.write_zeroes, compare: !!on.compare, verify: !!on.verify, timestamp: !!on.timestamp, reservations: !!on.reservations },
  };
  if (!d.sensors.length && temp) d.sensors = [temp];
  // Discos ATA/SATA: sin log de salud NVMe; se toman los atributos equivalentes.
  if (!HL && j?.ata_smart_attributes) {
    const attr = (id: number) => (j.ata_smart_attributes.table || []).find((a: any) => a.id === id);
    const raw = (id: number) => num(attr(id)?.raw?.value) ?? 0;
    d.mediaErr = raw(187) || raw(198);
    d.unsafe = raw(192) || raw(174);
    d.spare = 100;
    d.spareTh = 0;
    d.errLog = num(get(j, 'ata_smart_error_log.summary.count')) ?? 0;
    d.optAdmin = { ...d.optAdmin, selftest: !!get(j, 'ata_smart_data.capabilities.self_tests_supported') };
    d.selftestUnsupported = !d.optAdmin.selftest;
    d.selftests = (get(j, 'ata_smart_self_test_log.standard.table') || []).map((t: any) => ({
      type: /short/i.test(t.type?.string) ? 'Corta' : /extended|long/i.test(t.type?.string) ? 'Extendida' : String(t.type?.string || 'Autoprueba'),
      result: t.status?.passed ? 'Completada sin errores' : String(t.status?.string || 'Falló'),
      hours: num(t.lifetime_hours) ?? 0,
      lba: t.lba != null ? nf(t.lba) : '—',
      ok: !!t.status?.passed,
    }));
    d.verdict = verdictFor(d, th);
    d.sentence = sentenceFor(d, th);
  }
  d.verdict = verdictFor(d, th);
  d.sentence = sentenceFor(d, th);
  d.since = sinceFor(d, prev, now);
  return d;
}

/** Identidad persistente (plan §5.5): modelo + serie; sin serie, modelo + tamaño. */
export function keyOf(model: string, serial: string, bytes: number, id: string): string {
  return serial ? `${model}|${serial}` : `${model}|${bytes || id}`;
}

/** "Desde la última revisión (hace 12 días): +0.8 TB escritos · +26 h · sin errores nuevos". */
export function sinceFor(d: Disk, prev: PrevSnapshot | null | undefined, now: number): Disk['since'] {
  if (!prev || now - prev.takenAt < 60 * 60 * 1000) return null;
  const days = Math.round((now - prev.takenAt) / 86400000);
  const ago = days >= 2 ? `hace ${days} días` : days === 1 ? 'hace 1 día' : `hace ${Math.round((now - prev.takenAt) / 3600000)} h`;
  const dW = d.writtenTB - (prev.data.writtenTB ?? d.writtenTB);
  const dH = d.hours - (prev.data.hours ?? d.hours);
  const dM = d.mediaErr - (prev.data.mediaErr ?? d.mediaErr);
  const media = dM > 0 ? `+${dM} ${dM === 1 ? 'error' : 'errores'} de medios` : 'sin errores nuevos';
  return { ago, text: `+${nf(Math.max(0, dW), 1)} TB escritos · +${nf(Math.max(0, dH))} h · ${media}` };
}
