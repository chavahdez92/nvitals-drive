/**
 * Modelo de disco que consume la UI. Es exactamente la forma de los datos del
 * prototipo (prototype-design/js/mock-data.js), para que las pantallas traducidas
 * funcionen igual con datos reales.
 */
import type { SpeedPath } from './speedpath';

export type Verdict = 'optimal' | 'good' | 'warning' | 'critical' | 'nodata';
export type ConnKind = 'thunderbolt' | 'usb4' | 'usb' | 'internal';

export interface SelfTestEntry {
  type: string;
  result: string;
  hours: number;
  lba: string;
  ok: boolean;
}

export interface Disk {
  id: string;
  key: string;
  model: string;
  short: string;
  vendor: string;
  capacityTB: number;
  bytes: number;
  blocks: number;
  lbaSize: number;
  conn: ConnKind;
  connLabel: string;
  link: string;
  linkShort: string;
  bridge: string | null;
  /** Cadena puerto → gabinete → SSD que fija el techo de velocidad (solo discos reales). */
  path?: SpeedPath | null;
  internal: boolean;
  bootDisk?: boolean;
  verdict: Verdict;
  nodata?: boolean;
  reason?: string;
  sentence: string;
  since?: { ago: string; text: string } | null;
  exit: number;
  ioservice?: string;
  protocol?: string;
  // Datos SMART (ausentes cuando nodata)
  life: number;
  used: number;
  writtenTB: number;
  writtenText: string;
  readTB: number;
  readText: string;
  duWritten: number;
  duRead: number;
  hostWrites: number;
  hostReads: number;
  busy: number;
  hours: number;
  cycles: number;
  unsafe: number;
  spare: number;
  spareTh: number;
  mediaErr: number;
  errLog: number | null;
  critWarn: number;
  smartPassed: boolean;
  temp: number;
  sensors: number[];
  warnT: number;
  critT: number;
  estThresholds: boolean;
  warnTime: number;
  critTime: number;
  fw: string;
  nvme: string;
  serial: string;
  pciVendor: string;
  oui: string;
  namespaces: number | null;
  ctrlId: number | null;
  errLogUnavailable?: boolean;
  selftestUnsupported?: boolean;
  selftests: SelfTestEntry[];
  errors: string[][];
  powerStates: string[][];
  lbaFormats: string[][];
  optAdmin: Record<string, boolean>;
  optNvm: Record<string, boolean>;
}

/** Umbrales configurables (Ajustes → Umbrales avanzados). */
export interface Thresholds {
  thMedia: number;
  thSpare: number;
  thWarn: number;
  thCrit: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { thMedia: 10, thSpare: 10, thWarn: 70, thCrit: 80 };
