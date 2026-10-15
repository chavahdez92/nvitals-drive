/**
 * Cliente del núcleo Rust (comandos IPC de src-tauri/src/commands.rs).
 * La UI nunca ejecuta procesos: todo pasa por estas funciones.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { CmdResult, RawReading } from '../domain/normalize';
import type { Dossier, InventoryLatest, InventoryRecord, InventoryRow } from '../domain/inventory';

/** ¿Corre dentro de la app nativa? En el navegador (pnpm dev:web) se usa el modo mock. */
export const isNative = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
export const useMock = !isNative || import.meta.env.MODE === 'mock';

export interface SmartctlInfo {
  path: string;
  version: string;
  major: number;
  minor: number;
  build: string;
  platform: string;
  json: boolean;
}

export interface EnvReport {
  smartctl: SmartctlInfo | null;
  error: string | null;
  appVersion: string;
}

export interface DiskEntry {
  id: string;
  diskutil: any;
}

export interface TempReading {
  id: string;
  temp: number | null;
  sensors: number[];
  exit: number;
}

export interface DeviceRow {
  key: string;
  model: string;
  serial: string | null;
  firstSeen: number;
  lastSeen: number;
  info: any;
}

export interface SnapshotRow {
  id: number;
  deviceKey: string;
  takenAt: number;
  source: string;
  data: any;
}

export interface ReportRow {
  id: string;
  deviceKey: string;
  createdAt: number;
  format: string;
  path: string | null;
  meta: any;
}

export interface DiskEvent {
  kind: 'appeared' | 'disappeared';
  id: string;
}

export const api = {
  envCheck: (configured?: string) => invoke<EnvReport>('env_check', { configured: configured ?? null }),
  listDisks: () => invoke<DiskEntry[]>('list_disks'),
  readDisk: (id: string) => invoke<RawReading>('read_disk', { id }),
  readProfiler: () => invoke<any>('read_profiler'),
  readTemps: (ids: string[]) => invoke<TempReading[]>('read_temps', { ids }),
  smartctlRun: (id: string, flags: string[], json: boolean) => invoke<CmdResult>('smartctl_run', { id, flags, json }),
  smartctlScan: () => invoke<CmdResult>('smartctl_scan'),
  eject: (id: string, internal: boolean) => invoke<void>('eject_disk', { id, internal }),
  historyAdd: (device: Omit<DeviceRow, 'firstSeen' | 'lastSeen'> & { firstSeen?: number; lastSeen?: number }, source: string, data: any) =>
    invoke<number>('history_add', { device: { firstSeen: 0, lastSeen: 0, ...device }, source, data }),
  historyAll: () => invoke<{ devices: DeviceRow[]; snapshots: Record<string, SnapshotRow[]> }>('history_all'),
  historyClear: () => invoke<void>('history_clear'),
  reportsList: () => invoke<ReportRow[]>('reports_list'),
  reportsAdd: (report: ReportRow) => invoke<void>('reports_add', { report }),
  reportsDelete: (id: string) => invoke<void>('reports_delete', { id }),
  saveTextFile: (fileName: string, extension: string, content: string) =>
    invoke<string | null>('save_text_file', { fileName, extension, content }),
  /** PDF de report.html#<hash> con el diálogo Guardar; `null` si se cancela. */
  exportPdf: (fileName: string, hash: string, paper: string) => invoke<string | null>('export_pdf', { fileName, hash, paper }),
  revealInFinder: (path: string) => invoke<void>('reveal_in_finder', { path }),
  scanStart: (id: string, mode: 'full' | 'quick' | 'stress', internal: boolean, keepAwake: boolean, duration?: number) =>
    invoke<void>('scan_start', { id, mode, internal, keepAwake, duration: duration ?? null }),
  authInfo: () => invoke<{ touchId: boolean; enableCommand: string }>('auth_info'),
  openPrivacySettings: (which: 'removable' | 'full') => invoke<void>('open_privacy_settings', { which }),
  selftestStart: (id: string, kind: 'short' | 'long' | 'abort') => invoke<CmdResult>('selftest_start', { id, kind }),
  scanCancel: () => invoke<void>('scan_cancel'),
  onScanEvent: (cb: (e: { id: string; event: any }) => void): Promise<UnlistenFn> =>
    listen<{ id: string; event: any }>('scan-event', (e) => cb(e.payload)),
  benchInfo: (id: string) => invoke<BenchInfo>('bench_info', { id }),
  benchRun: (id: string, volume: string, sizeMib: number) => invoke<void>('bench_run', { id, volume, sizeMib }),
  benchCancel: () => invoke<void>('bench_cancel'),
  onBenchEvent: (cb: (e: { id: string; event: any }) => void): Promise<UnlistenFn> =>
    listen<{ id: string; event: any }>('bench-event', (e) => cb(e.payload)),
  inventoryList: () => invoke<InventoryRow[]>('inventory_list'),
  inventoryGet: (serial: string) => invoke<Dossier | null>('inventory_get', { serial }),
  inventoryLatest: (serials: string[]) => invoke<InventoryLatest[]>('inventory_latest', { serials }),
  inventoryAdd: (record: Partial<InventoryRecord>, check: { verdict: string | null; life: number | null; disk: unknown; raw: unknown; extras: unknown }) =>
    invoke<number>('inventory_add', { record, check }),
  inventoryUpdate: (serial: string, patch: Pick<InventoryRecord, 'status' | 'lot' | 'supplier' | 'destination' | 'cost' | 'price' | 'notes'>) =>
    invoke<void>('inventory_update', { serial, patch }),
  inventoryDelete: (serial: string) => invoke<void>('inventory_delete', { serial }),
  inventoryExportPdf: (serial: string, fileName: string, hash: string, paper: string, checkId: number | null) =>
    invoke<string>('inventory_export_pdf', { serial, fileName, hash, paper, checkId }),
  inventorySaveFile: (serial: string, fileName: string, content: string) => invoke<string>('inventory_save_file', { serial, fileName, content }),
  inventoryReveal: (serial: string) => invoke<void>('inventory_reveal', { serial }),
  inventoryRoot: () => invoke<string>('inventory_root'),
  inventoryPickRoot: () => invoke<string | null>('inventory_pick_root'),
  onDiskEvent: (cb: (e: DiskEvent) => void): Promise<UnlistenFn> => listen<DiskEvent>('disk-event', (e) => cb(e.payload)),
};

export interface BenchVolume {
  id: string;
  name: string;
  mount: string;
  dir: string;
  free: number;
  fs: string;
}

export interface BenchInfo {
  fio: string | null;
  version: string | null;
  volumes: BenchVolume[];
  sizes: number[];
  runtime: number;
}
