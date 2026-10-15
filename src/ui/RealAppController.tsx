// App real: misma UI y mismas coreografías que el prototipo (AppController), pero los
// datos salen del núcleo Rust (smartctl, diskutil, system_profiler, SQLite) en lugar de
// simularse. Solo sobreescribe los puntos donde el prototipo simulaba.
// @ts-nocheck — hereda el view-model dinámico del prototipo.
import { AppController } from './AppController';
import { HDI_MOCK } from './mock/mockData';
import { api, type BenchInfo, type SnapshotRow } from '../services/backend';
import { BENCH_PROFILES, benchVerdict, find as benchFind, type BenchSample } from '../domain/bench';
import { normalizeDisk, type CmdResult } from '../domain/normalize';
import { DEFAULT_THRESHOLDS } from '../domain/disk';
import { dateText, dateTimeText, nf, tbText } from '../domain/format';
import { exportReport, reportHash, reportPayload, sha256Hex } from '../report/exporter';
import { checkDelta, DEFAULT_INV_SORT, filterInventory, INV_SORTS, invVerdict, lotsOf, money, normalizeSerial, parseMoney, sortInventory, STATUSES, statusOf, validSerial } from '../domain/inventory';
import { quickView } from '../domain/quickView';
import { batchLayout, VERDICT_KEYS } from '../domain/batchReport';

const PREFS_KEY = 'hdi-prefs';
const STRESS_SECONDS = 600;
const p2 = (n: number) => String(n).padStart(2, '0');
const fmtClock = (sec: number) => { const x = Math.max(0, Math.round(sec)); const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), q = x % 60; return (h ? h + ':' + p2(m) : p2(m)) + ':' + p2(q); };
const SNAPSHOT_EVERY_MS = 10 * 60 * 1000;
const VERDICTS: Record<string, [string, string]> = { optimal: ['Óptimo', '#i-shield-check'], good: ['Bueno', '#i-check-circle'], warning: ['Atención', '#i-alert'], critical: ['Crítico', '#i-octagon'], nodata: ['Sin datos', '#i-circle-dashed'] };
const basename = (p: string) => (p || '').split('/').pop() || p;
const errText = (e: unknown) => (typeof e === 'string' ? e : e instanceof Error ? e.message : JSON.stringify(e));

export class RealAppController extends AppController {
  real = true;
  data = { disks: [], exitBits: HDI_MOCK.exitBits, scans: {}, smartctl: null, reports: [], hist: {}, pastDisks: [], appVersion: '1.0' };
  outputs: Record<string, CmdResult | null> = {};
  profiler: unknown = null;
  history: { devices: any[]; snapshots: Record<string, SnapshotRow[]> } = { devices: [], snapshots: {} };
  env = null;
  oldAccepted = false;
  lastExportPath: string | null = null;
  reading = new Set<string>();
  auth: { touchId: boolean; enableCommand: string } | null = null;
  stress: Record<string, any> = {};
  workload: Record<string, any> = {};
  workloadResult: Record<string, any> = {};
  benchInfo: Record<string, BenchInfo | null> = {};
  benchRun: Record<string, any> = {};

  constructor(props) {
    super(props);
    const saved = this.loadPrefs();
    this.state = {
      ...this.state,
      repTech: saved.repTech ?? '',
      repClient: '',
      unit: saved.unit ?? 'C',
      hideInternal: saved.hideInternal ?? false,
      tempInt: saved.tempInt ?? 2,
      repPaper: saved.repPaper ?? 'letter',
      repKind: saved.repKind ?? 'full',
      reports: [],
      // Expedientes (src/domain/inventory.ts, src-tauri/src/inventory.rs)
      inv: [], invQ: '', invStatus: 'all', invLot: '', invDossier: null, invCheck: null, invEdit: null, invRoot: '', batch: null,
      // Selección para el reporte rápido de varios discos (ref null = el lote común de la selección).
      invPick: false, invSel: [], invAnchor: null, invRep: { ref: null, extra: false, busy: false },
      // Tabla de seleccionados (desviación #22): su orden es también el del PDF.
      invSort: DEFAULT_INV_SORT, invPane: 'table',
      set: { ...this.state.set, company: '', invPdf: true, invJson: true, ...(saved.set || {}), detecting: false },
    };
  }

  loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; }
  }
  savePrefs() {
    const s = this.state;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ repTech: s.repTech, unit: s.unit, hideInternal: s.hideInternal, tempInt: s.tempInt, repPaper: s.repPaper, repKind: s.repKind, set: { ...s.set, detecting: false } })); } catch { /* ignorado */ }
  }
  componentDidUpdate(pp, ps) {
    super.componentDidUpdate(pp, ps);
    const s = this.state;
    const sig = [s.repTech, s.unit, s.hideInternal, s.tempInt, s.repPaper, s.repKind, JSON.stringify(s.set)].join('|');
    if (sig !== this._prefSig) { this._prefSig = sig; this.savePrefs(); }
    // Expediente abierto por ruta (#/inventory/<serie>).
    const r = s.route;
    if (r?.screen === 'inventory' && r.sub && r.sub !== this._dossierFor) { this._dossierFor = r.sub; this.loadDossier(r.sub); }
    if (r?.screen !== 'inventory') this._dossierFor = null;
    // Modo lote: si se conectaron varios discos seguidos, se ofrecen uno tras otro.
    if (!s.dialog && s.batch && this._batchQueue?.length) {
      const next = this._batchQueue.shift();
      if (this.rt(next)?.phase === 'ready') setTimeout(() => this.askInventory(next), 120);
    }
    // El material nativo (vibrancy) sigue el tema elegido en la app.
    if (s.theme !== this._winTheme) {
      this._winTheme = s.theme;
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => getCurrentWindow().setTheme(s.theme === 'system' ? null : s.theme)).catch(() => {});
    }
  }

  thresholds() {
    const st = this.state.set;
    return { thMedia: st.thMedia ?? DEFAULT_THRESHOLDS.thMedia, thSpare: st.thSpare ?? DEFAULT_THRESHOLDS.thSpare, thWarn: st.thWarn ?? DEFAULT_THRESHOLDS.thWarn, thCrit: st.thCrit ?? DEFAULT_THRESHOLDS.thCrit };
  }

  /* ── Arranque ── */
  boot() {
    document.documentElement.setAttribute('data-native', '');
    this.markDragRegions();
    location.hash = '#/onboarding';
    super.boot();
    this.unlisten = api.onDiskEvent((e) => (e.kind === 'appeared' ? this.connectReal(e.id) : this.disconnect(e.id)));
    this.unlistenScan = api.onScanEvent((e) => this.onScanEvent(e.id, e.event));
    this.unlistenBench = api.onBenchEvent((e) => this.onBenchEvent(e.id, e.event));
    this.loadHistory();
    this.loadReports();
    api.authInfo().then((a) => { this.auth = a; this.setState((st) => ({ dataRev: (st.dataRev || 0) + 1 })); }).catch(() => {});
    this.loadInventory();
    api.inventoryRoot().then((r) => this.setState({ invRoot: r })).catch(() => {});
    // Gancho de pruebas (solo desarrollo): permite simular conexiones en el modo lote.
    if (import.meta.env.DEV) (window as any).__hdiApp = this;
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    this.unlisten?.then((f) => f());
    this.unlistenScan?.then((f) => f());
    this.unlistenBench?.then((f) => f());
    clearInterval(this._benchT);
  }
  bootLog() { return []; }

  /** La franja superior arrastra la ventana nativa (Tauri: data-tauri-drag-region). */
  markDragRegions() {
    // Tauri solo arrastra si el elemento pulsado tiene el atributo: se marcan también los
    // contenedores sin interacción de la barra superior (los botones no, siguen funcionando).
    const sel = [
      '.hdi-sidebar > div:first-child',
      '[data-component="Toolbar"]',
      '[data-component="Toolbar"] > div',
      '[data-component="Toolbar"] > div > span',
      '[data-component="DetailHeader"]',
      '[data-component="DetailHeader"] > div:first-child',
      '[data-detail-title]',
    ].join(',');
    const mark = () => document.querySelectorAll(sel).forEach((el) => el.hasAttribute('data-tauri-drag-region') || el.setAttribute('data-tauri-drag-region', ''));
    mark();
    new MutationObserver(mark).observe(document.body, { childList: true, subtree: true });
  }

  mkRt(id, phase = 'ready') {
    const d = this.D(id);
    const t = d && !d.nodata ? d.temp : 0;
    return { id, phase, temp: t, hist: [t, t], discAt: 0 };
  }
  D(id) {
    return this.data.disks.find((d) => d.id === id);
  }

  /* ── Verificación del entorno (datos reales) ── */
  onbStepTexts(o, liveRt) {
    const sc = this.data.smartctl;
    const path = sc ? sc.path : 'smartctl';
    return [
      ['smartctl encontrado', sc ? `${path} · versión ${sc.version}` : 'Buscando en /opt/homebrew/bin, /usr/local/bin y el PATH'],
      ['Salida JSON soportada', 'smartctl --json --version'],
      ['Acceso a datos SMART sin privilegios', 'Lectura NVMe a través de IOKit'],
      [liveRt.length + (liveRt.length === 1 ? ' dispositivo detectado' : ' dispositivos detectados'), 'smartctl --scan-open -j'],
    ];
  }
  smartctlBadge(s) {
    const sc = this.data.smartctl;
    if (!sc) return { smartctlStatus: s.onb.mode === 'missing' ? 'smartctl no encontrado' : 'buscando smartctl…', smartctlDot: s.onb.mode === 'missing' ? 'var(--health-critical-solid)' : 'var(--text-tertiary)', smartctlTip: 'smartctl no localizado' };
    return { smartctlStatus: `smartctl ${sc.version} · listo`, smartctlDot: 'var(--health-optimal-solid)', smartctlTip: `${sc.path} · smartmontools ${sc.version} (${sc.build})` };
  }

  async runOnboarding() {
    clearTimeout(this._onb);
    const k = this.M().speedK();
    const pause = (ms) => new Promise((r) => (this._onb = setTimeout(r, ms * k)));
    const run = (this._onbRun = (this._onbRun || 0) + 1);
    const alive = () => run === this._onbRun;
    this.setState({ onb: { mode: 'ok', step: 0 } });
    let env = null;
    try { [env] = await Promise.all([api.envCheck(this.state.set.smartctlPath || undefined), pause(520)]); } catch (e) { env = { smartctl: null, error: errText(e) }; }
    if (!alive()) return;
    this.env = env;
    this.data.appVersion = env.appVersion || this.data.appVersion;
    this.data.smartctl = env.smartctl;
    if (!env.smartctl) { this.setState({ onb: { mode: 'missing', step: 0, fail: true } }); return; }
    const { major, minor } = env.smartctl;
    if ((major < 7 || (major === 7 && minor < 4)) && !this.oldAccepted) { this.setState({ onb: { mode: 'old', step: 0, warnOld: true } }); return; }
    this.addLogReal('smartctl --version', null, 0, 40);
    this.setState({ onb: { mode: 'ok', step: 1 } });
    await pause(520);
    if (!alive()) return;
    this.setState({ onb: { mode: 'ok', step: 2 } });
    const t0 = performance.now();
    const [entries] = await Promise.all([api.listDisks().catch(() => []), pause(520)]);
    if (!alive()) return;
    this.addLogReal('smartctl --scan-open -j', null, 0, performance.now() - t0);
    this.data.disks = entries.map((e) => normalizeDisk({ id: e.id, diskutil: e.diskutil, smart: null }, null, this.thresholds()));
    this.setState({ disks: entries.map((e) => this.mkRt(e.id, 'identifying')), onb: { mode: 'ok', step: 3 } });
    this.refreshProfiler().then(() => entries.forEach((e) => this.readOne(e.id)));
    await pause(520);
    if (!alive()) return;
    this.setState({ onb: { mode: 'ok', step: 4 } });
    this._onb = setTimeout(() => this.finishOnboarding(), 900 * k);
  }
  continueOld = () => { this.oldAccepted = true; this.runOnboarding(); };

  async refreshProfiler() {
    try { this.profiler = await api.readProfiler(); } catch { /* sin datos de conexión */ }
  }

  /* ── Lectura de discos ── */
  addLogReal(cmd, disk, exit, ms) {
    this.setState((s) => ({ cmdLog: s.cmdLog.concat([this.logEntry(cmd, disk, exit, (Math.max(0, ms) / 1000).toFixed(2) + ' s')]).slice(-200) }));
  }

  prevSnapshot(key) {
    const snaps = this.history.snapshots[key] || [];
    const old = snaps.filter((x) => Date.now() - x.takenAt >= 60 * 60 * 1000);
    const last = old[old.length - 1];
    return last ? { takenAt: last.takenAt, data: last.data } : null;
  }

  async readOne(id, { flash = false } = {}) {
    if (this.reading.has(id)) return;
    this.reading.add(id);
    try {
      const raw = await api.readDisk(id);
      this.outputs[id] = raw.smart;
      const placeholder = normalizeDisk({ id, diskutil: raw.diskutil, smart: raw.smart }, this.profiler, this.thresholds());
      const d = normalizeDisk({ id, diskutil: raw.diskutil, smart: raw.smart, error: raw.error }, this.profiler, this.thresholds(), this.prevSnapshot(placeholder.key));
      this.data.disks = this.data.disks.filter((x) => x.id !== id).concat([d]);
      if (raw.smart) this.addLogReal(raw.smart.cmd, id, raw.smart.exit, raw.smart.durationMs);
      this.setState((s) => ({
        dataRev: (s.dataRev || 0) + 1,
        disks: s.disks.map((x) => (x.id === id ? { ...x, phase: x.phase === 'identifying' ? 'ready' : x.phase, fresh: x.phase === 'identifying', temp: d.nodata ? 0 : d.temp, hist: x.hist.length > 2 ? x.hist : [d.temp, d.temp] } : x)),
      }), () => { if (flash) setTimeout(() => document.querySelectorAll('[data-flash]').forEach((el) => this.M().flash(el)), 30); });
      if (!d.nodata) this.snapshot(d, 'auto');
      if (d.verdict === 'critical' && this.state.set.notifCrit && !this._critNotified?.has(d.key)) {
        (this._critNotified ||= new Set()).add(d.key);
        this.notify('Estado crítico detectado', `${d.model} · ${d.sentence}`);
      }
      return d;
    } catch (e) {
      this.toast({ title: 'No se pudo leer el disco', body: `${id} · ${errText(e)}`, icon: '#i-alert' });
      this.setState((s) => ({ disks: s.disks.map((x) => (x.id === id && x.phase === 'identifying' ? { ...x, phase: 'ready' } : x)) }));
    } finally {
      this.reading.delete(id);
    }
  }

  /* ── Conexión en caliente (eventos reales de diskutil) ── */
  async connectReal(id) {
    if (this.state.disks.some((x) => x.id === id && x.phase !== 'gone')) return;
    let entry = null;
    try { entry = (await api.listDisks()).find((e) => e.id === id); } catch { /* ignorado */ }
    if (!entry) return;
    this.data.disks = this.data.disks.filter((x) => x.id !== id).concat([normalizeDisk({ id, diskutil: entry.diskutil, smart: null }, this.profiler, this.thresholds())]);
    const before = this.M().snapshot('[data-flip]');
    this.setState((s) => ({ disks: s.disks.filter((x) => x.id !== id).concat([this.mkRt(id, 'identifying')]) }), () => {
      this.M().play('[data-flip]', before);
      this.M().enter(document.querySelector('[data-card-id="' + id + '"]'), 'materialize');
      this.M().enter(document.querySelector('[data-side-id="' + id + '"]'), 'rise');
    });
    await this.refreshProfiler();
    const d = await this.readOne(id);
    if (d) {
      this.toast({ title: 'Disco conectado', body: d.model + ' · ' + d.connLabel, icon: { thunderbolt: '#i-thunderbolt', usb4: '#i-usb', usb: '#i-usb', internal: '#i-chip' }[d.conn] });
      if (this.state.set.notifConnect && document.hidden) this.notify('Disco conectado', d.model + ' · ' + d.connLabel);
      if (this.state.batch) this.batchOffer(id);
    }
  }

  disconnect(id, how) {
    const rt = this.rt(id);
    if (!rt || rt.phase === 'gone' || rt.phase === 'disconnected') return;
    if (how === 'eject') {
      const d = this.D(id);
      api.eject(id, !!d?.internal)
        .then(() => super.disconnect(id, 'eject'))
        .catch((e) => this.toast({ title: 'No se pudo expulsar', body: errText(e), icon: '#i-alert' }));
      return;
    }
    super.disconnect(id, how);
  }

  rescan = async () => {
    const icon = document.querySelector('[data-refresh-icon]');
    if (icon && !this.M().reduced()) icon.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 520 * this.M().speedK(), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    const r = this.state.route;
    if (r.screen === 'device' && this.rt(r.id)?.phase === 'ready') { await this.readOne(r.id, { flash: true }); this.onTick(); return; }
    const t0 = performance.now();
    let entries = [];
    try { entries = await api.listDisks(); } catch (e) { this.toast({ title: 'No se pudo re-escanear', body: errText(e), icon: '#i-alert' }); return; }
    this.addLogReal('smartctl --scan-open -j', null, 0, performance.now() - t0);
    const now = entries.map((e) => e.id);
    const live = this.state.disks.filter((x) => x.phase === 'ready' || x.phase === 'identifying').map((x) => x.id);
    now.filter((id) => !live.includes(id)).forEach((id) => this.connectReal(id));
    live.filter((id) => !now.includes(id)).forEach((id) => this.disconnect(id));
    live.filter((id) => now.includes(id)).forEach((id) => this.readOne(id));
  };

  /* ── Temperatura en vivo (smartctl -A -j) ── */
  onTick = async () => {
    if (this.state.tempPaused) { this.setState({ now: Date.now() }); return; }
    const ids = this.state.disks.filter((x) => x.phase === 'ready' && this.D(x.id) && !this.D(x.id).nodata).map((x) => x.id);
    if (this._ticking) return;
    this._ticking = true;
    let temps = [];
    try { temps = ids.length ? await api.readTemps(ids) : []; } catch { temps = []; } finally { this._ticking = false; }
    const byId = Object.fromEntries(temps.filter((t) => t.temp != null).map((t) => [t.id, t]));
    let pulse = null;
    const disks = this.state.disks.map((rt) => {
      const t = byId[rt.id];
      if (!t) return rt;
      const d = this.D(rt.id);
      if ((rt.temp < d.warnT && t.temp >= d.warnT) || (rt.temp < d.critT && t.temp >= d.critT)) pulse = rt.id;
      if (t.sensors?.length) d.sensors = t.sensors;
      const hist = rt.hist.slice(rt.hist.length >= 1800 ? 1 : 0);
      hist.push(t.temp);
      return { ...rt, temp: t.temp, hist };
    });
    this.liveShift = true;
    this.pulseId = pulse;
    this.setState({ disks, now: Date.now() });
  };

  /* ── Consola: ejecuta de verdad (allowlist en el núcleo) ── */
  async execConsole(d, cmd) {
    const tokens = cmd.replace(/^smartctl\s+/, '').split(/\s+/).filter((t) => t && t !== d.id);
    const json = tokens.includes('-j');
    const flags = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '-j') continue;
      if (t === '-l' && tokens[i + 1]) { flags.push('-l ' + tokens[++i]); continue; }
      flags.push(t);
    }
    try {
      const r = await api.smartctlRun(d.id, flags, json);
      this.outputs[d.id] = r;
      this.addLogReal(r.cmd, d.id, r.exit, r.durationMs);
      this.setState((st) => ({ cOut: json ? st.cOut : 'text' }));
    } catch (e) {
      this.toast({ title: 'Comando no ejecutado', body: errText(e), icon: '#i-alert' });
    }
  }
  makeJSON(d) {
    return this.outputs[d.id]?.json ?? { smartctl: { messages: [{ string: 'Sin salida todavía', severity: 'information' }] } };
  }
  makeText(d) {
    const o = this.outputs[d.id];
    return o ? (o.text.length ? o.text.join('\n') : o.stderr || '(sin salida de texto)') : 'Sin salida todavía. Ejecuta una herramienta.';
  }

  /* ── Historial (SQLite) ── */
  async loadHistory() {
    try { this.history = await api.historyAll(); } catch { return; }
    this.rebuildHistory();
  }
  rebuildHistory() {
    const hist = {};
    const liveKeys = new Map(this.data.disks.map((d) => [d.key, d.id]));
    const rows = (key) => (this.history.snapshots[key] || []).map((x) => [dateText(x.takenAt), x.data.life ?? null, x.data.writtenTB ?? null, x.data.hours ?? null, x.data.mediaErr ?? null, x.data.temp ?? null, x.data.unsafe ?? null]);
    const past = [];
    for (const dev of this.history.devices) {
      const id = liveKeys.get(dev.key);
      if (id) { hist[id] = rows(dev.key); continue; }
      const snaps = this.history.snapshots[dev.key] || [];
      const last = snaps[snaps.length - 1];
      const pid = 'past-' + dev.key.replace(/[^A-Za-z0-9]/g, '').slice(-24);
      hist[pid] = rows(dev.key);
      past.push({ id: pid, model: dev.model, short: dev.model, serial: dev.serial || '', verdict: last?.data.verdict || 'nodata', life: last?.data.life ?? 0, connLabel: dev.info?.connLabel || '', lastSeen: dateText(dev.lastSeen), disconnected: true });
    }
    this.data.hist = hist;
    this.data.pastDisks = past;
    if (!past.some((p) => p.id === this.state.histSel) && !this.data.disks.some((d) => d.id === this.state.histSel)) {
      const first = this.data.disks[0]?.id || past[0]?.id;
      if (first) this.setState({ histSel: first, cmp: [Math.max(0, (hist[first] || []).length - 2), Math.max(0, (hist[first] || []).length - 1)] });
    }
    this.setState((s) => ({ dataRev: (s.dataRev || 0) + 1 }));
  }
  async snapshot(d, source) {
    const snaps = this.history.snapshots[d.key] || [];
    const last = snaps[snaps.length - 1];
    const data = { life: d.life, used: d.used, writtenTB: d.writtenTB, hours: d.hours, mediaErr: d.mediaErr, temp: d.temp, unsafe: d.unsafe, spare: d.spare, verdict: d.verdict, critWarn: d.critWarn };
    const changed = !last || ['life', 'hours', 'mediaErr', 'writtenTB'].some((k) => last.data[k] !== data[k]);
    if (source === 'auto' && last && !changed && Date.now() - last.takenAt < SNAPSHOT_EVERY_MS) return;
    try {
      const id = await api.historyAdd({ key: d.key, model: d.model, serial: d.serial || null, info: { connLabel: d.connLabel, capacityTB: d.capacityTB } }, source, data);
      const row = { id, deviceKey: d.key, takenAt: Date.now(), source, data };
      this.history.snapshots[d.key] = snaps.concat([row]);
      if (!this.history.devices.some((x) => x.key === d.key)) this.history.devices.unshift({ key: d.key, model: d.model, serial: d.serial, firstSeen: Date.now(), lastSeen: Date.now(), info: {} });
      this.rebuildHistory();
    } catch { /* el historial no bloquea la lectura */ }
  }
  exportHistory() {
    api.saveTextFile('healthdiskinfo-historial.json', 'json', JSON.stringify(this.history, null, 2))
      .then((p) => p && this.toast({ title: 'Historial exportado', body: basename(p), icon: '#i-check-circle' }))
      .catch((e) => this.toast({ title: 'No se pudo exportar', body: errText(e), icon: '#i-alert' }));
  }
  deleteHistory() {
    this.setState({ dialog: null });
    api.historyClear().then(() => {
      this.history = { devices: [], snapshots: {} };
      this.rebuildHistory();
      this.toast({ title: 'Historial borrado', body: 'Se eliminaron las instantáneas guardadas.', icon: '#i-trash' });
    }).catch((e) => this.toast({ title: 'No se pudo borrar', body: errText(e), icon: '#i-alert' }));
  }
  exportCsv(d, rt) {
    const rows = ['segundos_atras,temperatura_c'].concat(rt.hist.map((v, i) => (rt.hist.length - 1 - i) * this.state.tempInt + ',' + v));
    api.saveTextFile('temperatura-' + d.id + '.csv', 'csv', rows.join('\n'))
      .then((p) => p && this.toast({ title: 'CSV exportado', body: basename(p), icon: '#i-check-circle' }))
      .catch((e) => this.toast({ title: 'No se pudo exportar', body: errText(e), icon: '#i-alert' }));
  }

  /* ── Reportes ── */
  async loadReports() {
    try {
      const rows = await api.reportsList();
      this.setState({ reports: rows.map((r) => ({ id: r.id, disk: r.meta.disk, model: r.meta.model, date: dateTimeText(r.createdAt), verdict: r.meta.verdict, format: r.format, pages: r.meta.pages, client: r.meta.client, file: basename(r.path), path: r.path })) });
    } catch { /* sin reportes */ }
  }
  reportFor(id) {
    super.reportFor(id);
    this.writeReportSource();
  }
  render() {
    // La vista previa (iframe) lee la instantánea del disco elegido desde localStorage.
    if (this.state.route?.screen === 'reports' && this.state.route.sub === 'new') this.writeReportSource();
    return super.render();
  }
  writeReportSource() {
    const s = this.state;
    const d = this.D(s.repDisk);
    if (!d) return;
    const sig = [d.id, d.key, this.state.dataRev, s.repKind, s.repSecs.join(','), s.repTech, s.repClient, s.repNotes, s.set.company].join('|');
    if (sig === this._repSig) return;
    this._repSig = sig;
    reportPayload.write(this.reportSourceFor(d));
  }
  reportSourceFor(d) {
    return {
      disks: [d],
      scans: this.data.scans[d.id] ? { [d.id]: this.data.scans[d.id] } : {},
      bench: this.benchSummary(d),
      exitBits: this.data.exitBits,
      appVersion: this.data.appVersion,
      smartctl: this.data.smartctl,
      company: this.state.set.company || '',
      date: dateTimeText(Date.now()),
      cmds: this.state.cmdLog.filter((e) => e.disk === d.id || e.disk === null).slice(-8).map((e) => ({ t: e.t, cmd: e.cmd, exit: e.exit + ' · ' + (e.exit ? this.exitChips(e.exit).map((c) => c.label.replace(/^\d+ · /, '')).join(' + ') : 'Sin problemas') })),
    };
  }
  /** Último benchmark completado del disco, para el reporte rápido. */
  benchSummary(d) {
    const b = this.benchRun[d.id];
    if (!b || b.status !== 'passed') return {};
    const rs = b.results || [];
    const seqRead = benchFind(rs, 'SEQ1M Q8T1', false)?.mbps ?? null;
    if (seqRead == null) return {};
    return { [d.id]: { seqRead, seqWrite: benchFind(rs, 'SEQ1M Q8T1', true)?.mbps ?? null, ceiling: d.path?.ceiling ?? null, at: b.started } };
  }
  newReportId() {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const n = (this.state.reports || []).filter((r) => r.id.includes(stamp)).length + 1;
    return `HDI-${stamp}-${String(n).padStart(4, '0')}`;
  }
  /** Exporta y registra un reporte. Compartido por el constructor y la acción «Reporte rápido». */
  async exportOne(d, o: { kind: 'full' | 'quick'; format: string; paper: string; s: string[]; tech: string; client: string; notes: string; mask: boolean }, ctx?: { source: any; raw: any }) {
    // ctx: exportar una revisión guardada del expediente (con su propia fecha y datos crudos).
    const source = ctx?.source ?? this.reportSourceFor(d);
    reportPayload.write(source);
    const rid = this.newReportId();
    const quick = o.kind === 'quick';
    const params = { disk: d.id, paper: o.paper, s: o.s, tech: o.tech, client: o.client, notes: o.notes, mask: o.mask, id: rid, kind: o.kind };
    const raw = ctx ? ctx.raw ?? null : this.outputs[d.id]?.json ?? null;
    const res = await exportReport({ format: o.format, params, source, disk: d, raw, fileBase: `${rid} ${d.short}${quick ? ' (rápido)' : ''}` });
    if (!res) return null;
    this.lastExportPath = res.path;
    const pages = o.format === 'JSON' ? 0 : quick ? 1 : this.repPages();
    const row = { id: rid, deviceKey: d.key, createdAt: Date.now(), format: o.format, path: res.path, meta: { disk: d.id, model: d.model, verdict: d.verdict, pages, client: o.client, sha256: res.sha256, kind: o.kind } };
    await api.reportsAdd(row);
    const rep = { id: rid, disk: d.id, model: d.model, date: dateTimeText(row.createdAt), verdict: d.verdict, format: o.format, pages, client: o.client, file: basename(res.path), path: res.path, fresh: true };
    this.setState((st) => ({ reports: [rep].concat(st.reports || []) }));
    this.toast({ title: quick ? 'Reporte rápido guardado' : 'Reporte guardado', body: rep.file, icon: '#i-check-circle' });
    this.addLogReal(`hdi-report --format ${o.format.toLowerCase()}${quick ? ' --quick' : ''} ${d.id}`, d.id, 0, 0);
    return rep;
  }
  genReport = async () => {
    if (this.state.repPhase === 'generating') return;
    const k = this.M().speedK();
    const step = (n) => this.setState({ repStep: n });
    const pause = (ms) => new Promise((r) => setTimeout(r, ms * k));
    this.setState({ repPhase: 'generating', repStep: 0 });
    const s0 = this.state;
    const id = s0.repDisk;
    try {
      const live = this.rt(id)?.phase === 'ready';
      if (live) await this.readOne(id);
      await pause(200);
      step(1);
      await pause(300);
      step(2);
      await pause(300);
      step(3);
      const rep = await this.exportOne(this.D(id), { kind: s0.repKind === 'quick' ? 'quick' : 'full', format: s0.repFormat, paper: s0.repPaper, s: s0.repSecs, tech: s0.repTech, client: s0.repClient, notes: s0.repNotes, mask: s0.repMask });
      if (!rep) { this.setState({ repPhase: 'idle', repStep: 0 }); this.toast({ title: 'Exportación cancelada', icon: '#i-info' }); return; }
      this.setState({ repPhase: 'done', repStep: 4 });
      this.M().enter(document.querySelector('[data-paper]'), 'paper');
    } catch (e) {
      this.setState({ repPhase: 'error', repStep: 3 });
      this.toast({ title: 'No se pudo generar el reporte', body: errText(e), icon: '#i-alert' });
    }
  };
  /** Acción directa del menú ⋯: PDF rápido de una hoja sin pasar por el constructor. */
  quickReport = async (id) => {
    this.setState({ ctx: null });
    const s = this.state;
    try {
      if (this.rt(id)?.phase === 'ready') await this.readOne(id);
      const d = this.D(id);
      if (!d) return;
      const rep = await this.exportOne(d, { kind: 'quick', format: 'PDF', paper: s.repPaper, s: [], tech: s.repTech, client: '', notes: '', mask: s.set.maskDefault !== false });
      if (!rep) this.toast({ title: 'Exportación cancelada', icon: '#i-info' });
    } catch (e) {
      this.toast({ title: 'No se pudo generar el reporte rápido', body: errText(e), icon: '#i-alert' });
    }
  };
  deleteReport(id) {
    api.reportsDelete(id).then(() => super.deleteReport(id)).catch((e) => this.toast({ title: 'No se pudo eliminar', body: errText(e), icon: '#i-alert' }));
  }
  async openReport(rp) {
    if (!rp.path) return;
    try { const { openPath } = await import('@tauri-apps/plugin-opener'); await openPath(rp.path); } catch (e) { this.toast({ title: 'No se pudo abrir', body: errText(e), icon: '#i-alert' }); }
  }
  finderReport(rp) {
    if (rp.path) api.revealInFinder(rp.path).catch((e) => this.toast({ title: 'No se encontró el archivo', body: errText(e), icon: '#i-alert' }));
  }
  showFinder() {
    if (this.lastExportPath) api.revealInFinder(this.lastExportPath).catch(() => {});
  }

  /* ── Ajustes ── */
  async redetect() {
    this.setSet({ detecting: true });
    try {
      const env = await api.envCheck(this.state.set.smartctlPath || undefined);
      this.data.smartctl = env.smartctl;
      if (env.smartctl) { this.toast({ title: 'smartctl detectado', body: `${env.smartctl.path} · ${env.smartctl.version}`, icon: '#i-check-circle' }); this.addLogReal('smartctl --version', null, 0, 40); }
      else this.toast({ title: 'smartctl no encontrado', body: 'Instálalo con: brew install smartmontools', icon: '#i-alert' });
    } finally { this.setSet({ detecting: false }); }
  }

  /* ── Notificaciones del sistema ── */
  async notify(title, body) {
    try {
      const n = await import('@tauri-apps/plugin-notification');
      let ok = await n.isPermissionGranted();
      if (!ok) ok = (await n.requestPermission()) === 'granted';
      if (ok) n.sendNotification({ title, body });
    } catch { /* sin permiso */ }
  }

  /* ── Pruebas: escaneo de lectura real (helper de solo lectura como root) ── */
  // "Continuar" en la hoja de confirmación: en la app real el diálogo de contraseña es el nativo de macOS.
  startScan = async () => {
    const dg = this.state.dialog;
    if (!dg) return;
    const d = this.D(dg.id);
    this.setState({ dialog: null });
    const before = await this.readOne(dg.id);
    this.scanRun = { id: dg.id, kind: dg.scan, before: before || d, maxTemp: before?.temp || d?.temp || 0, zones: [], started: Date.now() };
    this.setState({ test: { diskId: dg.id, kind: dg.scan, p: 0, status: 'running', samples: [], errors: 0, auth: true } });
    this.addLogReal('smartctl -x -j ' + dg.id + '   # instantánea previa', dg.id, this.outputs[dg.id]?.exit ?? 0, this.outputs[dg.id]?.durationMs ?? 0);
    try {
      await api.scanStart(dg.id, dg.scan, !!d?.internal, !!this.state.set.keepAwake, dg.scan === 'stress' ? STRESS_SECONDS : undefined);
    } catch (e) {
      this.setState({ test: null });
      this.scanRun = null;
      if (errText(e).includes('acceso-disco-denegado')) this.setState({ dialog: { kind: 'permission', id: dg.id, scan: dg.scan } });
      else this.toast({ title: 'No se pudo iniciar el escaneo', body: errText(e), icon: '#i-alert' });
    }
  };
  retryScan = () => {
    const dg = this.state.dialog;
    if (!dg) return;
    this.setState({ dialog: { kind: 'scan', id: dg.id, scan: dg.scan } }, () => this.startScan());
  };
  authOk = () => this.startScan();

  onScanEvent(id, ev) {
    const run = this.scanRun;
    const t = this.state.test;
    if (!run || run.id !== id || !t || t.diskId !== id) return;
    const rt = this.rt(id);
    if (rt && rt.temp > run.maxTemp) run.maxTemp = rt.temp;
    if (ev.t === 'start') { run.total = ev.total; run.blockSize = ev.blockSize; return; }
    if (ev.t === 'progress') {
      const q = t.kind === 'full' ? ev.p : ev.q;
      this.setState({ test: { ...t, auth: false, p: Math.min(1, ev.p), samples: t.samples.concat([[Math.min(1, q), ev.mbps]]).slice(-2000), errors: ev.errors } });
      return;
    }
    if (ev.t === 'zone') {
      run.zones.push([ev.q, nf(ev.lbaStart), nf(ev.lbaEnd)]);
      this.setState({ test: { ...t, errors: run.zones.length } });
      return;
    }
    if (ev.t === 'auth-fallback') {
      this.toast({ title: 'Touch ID no autorizó el acceso', body: 'Introduce tu contraseña de administrador.', icon: '#i-lock' });
      return;
    }
    if (ev.t === 'error' && ev.code === 'EPERM') {
      this.setState({ test: null, dialog: { kind: 'permission', id, scan: run.kind } });
      this.scanRun = null;
      return;
    }
    if (ev.t === 'auth-cancelled' || ev.t === 'failed' || ev.t === 'error') {
      this.setState({ test: null });
      this.scanRun = null;
      if (ev.t === 'auth-cancelled') this.toast({ title: 'Escaneo cancelado', body: 'No se autorizó el acceso al disco.', icon: '#i-info' });
      else this.toast({ title: 'El escaneo falló', body: ev.message || 'Error desconocido', icon: '#i-alert' });
      return;
    }
    if (ev.t === 'done') this.finishScan(id, ev);
  }

  async finishScan(id, ev) {
    const run = this.scanRun;
    this.scanRun = null;
    const t = this.state.test;
    const status = ev.status === 'passed' ? 'passed' : ev.status === 'errors' ? 'errors' : ev.status;
    const after = ev.status === 'interrupted' ? null : await this.readOne(id);
    const b = run.before || {}, a = after || b;
    const fmt = (d) => ({ read: d.readText, hostReads: nf(d.hostReads), temp: (d.temp ?? 0) + ' °C', media: nf(d.mediaErr ?? 0), errLog: d.errLogUnavailable ? '—' : nf(d.errLog ?? 0), spare: d.spare + ' %', hours: nf(d.hours) + ' h' });
    const secs = Math.round(ev.durationMs / 1000);
    if (run.kind === 'stress') {
      const drop = ev.firstAvg > 0 ? Math.max(0, (ev.firstAvg - ev.lastAvg) / ev.firstAvg) : 0;
      const d0 = this.D(id);
      this.stress[id] = { ...ev, drop, maxTemp: run.maxTemp, startTemp: b.temp ?? 0, throttled: drop >= 0.3 || (d0 && run.maxTemp >= d0.warnT), secs };
    }
    const scan = {
      kind: run.kind, durationSim: secs, durationText: secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} s` : `${secs} s`,
      avg: ev.avg, min: ev.min, max: ev.max, maxTemp: run.maxTemp, errors: run.zones.length, zones: run.zones,
      result: status === 'errors' ? 'errors' : 'passed', before: fmt(b), after: fmt(a), at: Date.now(),
    };
    if ((status === 'passed' || status === 'errors') && run.kind !== 'stress') this.data.scans[id] = scan;
    const d = this.D(id);
    if (d && !d.nodata && after) this.snapshot(after, 'test_after');
    this.setState({ test: t ? { ...t, p: status === 'passed' || status === 'errors' ? 1 : t.p, status } : null, dataRev: (this.state.dataRev || 0) + 1 }, () => {
      if (status !== 'passed' && status !== 'errors') return;
      const ok = status === 'passed';
      this.toast({ title: 'Prueba completada', body: (d?.short || id) + ' · ' + (ok ? 'Aprobado' : 'Con errores: ' + run.zones.length + ' zonas ilegibles'), icon: ok ? '#i-check-circle' : '#i-alert' });
      this.addLogReal((run.kind === 'full' ? 'hdi-scan --full ' : run.kind === 'stress' ? `hdi-scan --stress ${STRESS_SECONDS}s ` : 'hdi-scan --sample 2% ') + id, id, 0, ev.durationMs);
      setTimeout(() => this.M().pulse(document.querySelector('[data-test-result-icon]')), 60);
      if (this.state.set.notifTest) this.notify('NVitals Drive', 'Prueba completada · ' + (d?.short || id));
    });
  }

  cancelTest = () => {
    this.setState({ dialog: null });
    if (this.state.test?.kind === 'bench') api.benchCancel().catch(() => {});
    else api.scanCancel().catch(() => {});
  };

  /* ── Comparación antes/después de una carga de trabajo (solo lectura SMART) ── */
  async takeWorkloadBaseline(d) {
    const before = await this.readOne(d.id);
    if (!before) return;
    this.workload[d.key] = { at: Date.now(), before };
    delete this.workloadResult[d.id];
    this.setState((st) => ({ dataRev: (st.dataRev || 0) + 1, test: st.test && st.test.diskId === d.id && st.test.kind === 'workload' ? null : st.test }));
    this.toast({ title: 'Instantánea inicial guardada', body: 'Usa el disco (copia archivos, ejecuta tu carga) y vuelve a Pruebas para comparar.', icon: '#i-check-circle' });
  }
  async compareWorkload(d) {
    const base = this.workload[d.key];
    if (!base) return;
    const after = await this.readOne(d.id);
    if (!after) return;
    const b = base.before;
    const newMedia = after.mediaErr - b.mediaErr;
    const newErrLog = (after.errLog ?? 0) - (b.errLog ?? 0);
    const secs = Math.round((Date.now() - base.at) / 1000);
    this.workloadResult[d.id] = { b, a: after, secs, newMedia, newErrLog };
    delete this.workload[d.key];
    this.setState({ test: { diskId: d.id, kind: 'workload', p: 1, status: newMedia > 0 ? 'errors' : 'passed', samples: [], errors: Math.max(0, newMedia) } });
    this.addLogReal('smartctl -x -j ' + d.id + '   # comparación antes/después', d.id, this.outputs[d.id]?.exit ?? 0, this.outputs[d.id]?.durationMs ?? 0);
  }

  /* ── Autopruebas SMART de discos SATA (macOS las permite vía IOKit) ── */
  async startSelfTest(d, kind) {
    try {
      const r = await api.selftestStart(d.id, kind);
      this.addLogReal(r.cmd, d.id, r.exit, r.durationMs);
      if (r.exit & 0x06) throw new Error((r.json?.smartctl?.messages || []).map((m) => m.string).join(' · ') || 'smartctl no pudo iniciar la autoprueba');
    } catch (e) {
      this.toast({ title: 'No se pudo iniciar la autoprueba', body: errText(e), icon: '#i-alert' });
      return;
    }
    this.setState({ test: { diskId: d.id, kind: 'selftest-' + kind, p: 0, status: 'running', samples: [], errors: 0 } });
    clearInterval(this._stT);
    this.selfTestStarted = Date.now();
    this._stT = setInterval(async () => {
      const t = this.state.test;
      if (!t || t.diskId !== d.id || !String(t.kind).startsWith('selftest')) { clearInterval(this._stT); return; }
      try {
        const r = await api.smartctlRun(d.id, ['-c'], true);
        const st = r.json?.ata_smart_data?.self_test?.status || {};
        const running = (st.value >> 4) === 0x0f;
        if (running) {
          const remaining = st.remaining_percent ?? 100;
          this.setState({ test: { ...t, p: Math.min(0.99, 1 - remaining / 100) } });
          return;
        }
        clearInterval(this._stT);
        await this.readOne(d.id);
        const ok = st.passed !== false && (st.value ?? 0) === 0;
        this.setState({ test: { ...t, p: 1, status: st.value === 1 || st.value === 2 ? 'cancelled' : ok ? 'passed' : 'errors' } });
        this.toast({ title: 'Autoprueba completada', body: d.short + ' · ' + (st.string || (ok ? 'Sin errores' : 'Con errores')), icon: ok ? '#i-check-circle' : '#i-alert' });
        if (this.state.set.notifTest) this.notify('NVitals Drive', 'Autoprueba completada · ' + d.short);
      } catch { /* se reintenta en el siguiente ciclo */ }
    }, 5000);
  }

  /* ── Benchmark de lectura/escritura con fio (escribe un archivo temporal) ── */
  askBench(d) {
    this.setState({ dialog: { kind: 'bench', id: d.id, loading: true, volume: null, size: 1024 } });
    api.benchInfo(d.id).then((info) => {
      this.benchInfo[d.id] = info;
      this.setState((st) => (st.dialog?.kind === 'bench' ? { dialog: { ...st.dialog, loading: false, volume: info.volumes[0]?.id ?? null } } : null));
    }).catch((e) => {
      this.benchInfo[d.id] = null;
      this.setState((st) => (st.dialog?.kind === 'bench' ? { dialog: { ...st.dialog, loading: false, error: String(e) } } : null));
    });
  }

  startBench = async () => {
    const dg = this.state.dialog;
    if (!dg || dg.kind !== 'bench' || !dg.volume) return;
    const vol = this.benchInfo[dg.id]?.volumes.find((v) => v.id === dg.volume);
    try {
      await api.benchRun(dg.id, dg.volume, dg.size);
    } catch (e) {
      this.toast({ title: 'No se pudo iniciar el benchmark', body: String(e), icon: '#i-alert' });
      return;
    }
    this.benchRun[dg.id] = { started: Date.now(), jobStart: Date.now(), i: 0, total: 8, secs: 6, results: [], series: [], live: null, volume: vol?.name || dg.volume, sizeMib: dg.size, status: 'running', error: null };
    this.setState({ dialog: null, test: { diskId: dg.id, kind: 'bench', p: 0, status: 'running', samples: [], errors: 0 } });
    clearInterval(this._benchT);
    this._benchT = setInterval(() => {
      const t = this.state.test, b = this.benchRun[dg.id];
      if (!t || t.kind !== 'bench' || t.status !== 'running' || !b) { clearInterval(this._benchT); return; }
      const part = Math.min(0.98, (Date.now() - b.jobStart) / 1000 / b.secs);
      this.setState({ test: { ...t, p: Math.min(0.995, (b.i + part) / b.total) } });
    }, 250);
  };

  onBenchEvent(id, ev) {
    const b = this.benchRun[id];
    if (!b) return;
    if (ev.t === 'start') Object.assign(b, { total: ev.total, secs: ev.seconds });
    else if (ev.t === 'job') Object.assign(b, { i: ev.i, jobStart: Date.now(), live: null, cur: ev.key + (ev.write ? ' · escritura' : ' · lectura') });
    else if (ev.t === 'tick') {
      (b.series[ev.i] ||= []).push({ ms: ev.ms, mbps: ev.mbps, iops: ev.iops });
      b.live = { mbps: ev.mbps, iops: ev.iops, write: ev.write };
    }
    else if (ev.t === 'result') b.results.push({ key: ev.key, write: ev.write, mbps: ev.mbps, iops: ev.iops, latUs: ev.latUs });
    else if (ev.t === 'done' || ev.t === 'failed' || ev.t === 'cancelled') {
      clearInterval(this._benchT);
      b.status = ev.t === 'done' ? 'passed' : ev.t === 'cancelled' ? 'cancelled' : 'failed';
      b.error = ev.message || null;
      b.secsTotal = Math.round((Date.now() - b.started) / 1000);
      const d = this.D(id);
      const status = ev.t === 'done' ? 'passed' : ev.t === 'cancelled' ? 'cancelled' : 'errors';
      this.setState((st) => ({ test: st.test && st.test.diskId === id && st.test.kind === 'bench' ? { ...st.test, p: ev.t === 'done' ? 1 : st.test.p, status } : st.test }));
      this.addLogReal(`fio ${BENCH_PROFILES.join(', ')} · ${b.volume}`, id, ev.t === 'done' ? 0 : 1, b.secsTotal * 1000);
      if (ev.t === 'failed') this.toast({ title: 'El benchmark falló', body: b.error || 'fio terminó con error.', icon: '#i-alert' });
      if (ev.t === 'done') {
        setTimeout(() => this.M().pulse(document.querySelector('[data-test-result-icon]')), 60);
        if (this.state.set.notifTest) this.notify('NVitals Drive', 'Benchmark completado · ' + (d?.short || id));
      }
    }
    this.setState((st) => ({ dataRev: (st.dataRev || 0) + 1 }));
  }

  /** Techo de velocidad: cadena puerto → gabinete → SSD con el resultado medido. */
  speedPathView(d, results: BenchSample[] = [], live: { mbps: number; write: boolean } | null = null) {
    const p = d.path;
    if (!p) return null;
    const rated = this.state.set.rated?.[d.key] || {};
    const sr = benchFind(results, 'SEQ1M Q8T1', false)?.mbps ?? null;
    const sw = benchFind(results, 'SEQ1M Q8T1', true)?.mbps ?? null;
    const linkIcon = d.conn === 'usb' ? '#i-usb' : d.conn === 'usb4' || d.conn === 'thunderbolt' ? '#i-thunderbolt' : '#i-enclosure';
    const hop = (k, h, icon, title) => {
      const bn = p.bottleneck === k;
      return { title, label: h.label, detail: h.detail, icon, cap: h.mbps ? '~' + nf(h.mbps) + ' MB/s' : 'Sin datos', bn,
        bg: bn ? 'var(--health-warning-bg)' : 'var(--surface-sunken)', border: bn ? 'var(--health-warning-border)' : 'var(--border-subtle)', fg: bn ? 'var(--health-warning-fg)' : 'var(--text-secondary)' };
    };
    const scale = Math.max(p.ceiling || 0, p.ssd.mbps || 0, rated.read || 0, sr || 0, 1);
    const bar = (label, v, color, note = '') => (v ? { label, val: nf(v) + ' MB/s', w: (Math.min(1, v / scale) * 100).toFixed(1) + '%', color, note } : null);
    const bars = [
      live ? bar(live.write ? 'Escritura en vivo' : 'Lectura en vivo', live.mbps, live.write ? 'var(--data-write)' : 'var(--data-read)', p.ceiling ? Math.round((live.mbps / p.ceiling) * 100) + ' % del techo' : '') : null,
      bar('Lectura medida', sr, 'var(--data-read)', sr && p.ceiling ? Math.round((sr / p.ceiling) * 100) + ' % del techo' : ''),
      bar('Escritura medida', sw, 'var(--data-write)', ''),
      bar('Techo de la conexión', p.ceiling, 'var(--health-warning-fg)', p.bottleneck ? 'Límite: ' + { port: 'puerto de la Mac', link: 'gabinete / puente', ssd: 'SSD' }[p.bottleneck] : ''),
      bar('Enlace PCIe del SSD', p.ssd.mbps, 'var(--text-tertiary)', 'teórico'),
      bar('Nominal del SSD (lectura)', rated.read, 'var(--text-tertiary)', 'según el fabricante'),
    ].filter(Boolean);
    return {
      hops: [hop('port', p.port, '#i-monitor', 'Puerto de la Mac'), hop('link', p.link, linkIcon, 'Gabinete / puente'), hop('ssd', p.ssd, '#i-ssd', 'SSD')],
      bars, hasBars: bars.length > 0, flowing: !!live, flowColor: live?.write ? 'var(--data-write)' : 'var(--data-read)',
      note: p.bottleneck === 'ssd' ? 'El SSD es el eslabón más lento: el gabinete y el puerto no lo limitan.'
        : p.bottleneck ? `El eslabón más lento fija el máximo posible: ~${nf(p.ceiling)} MB/s, aunque el SSD admita más.`
          : 'No hay datos suficientes para calcular el techo de la conexión.',
    };
  }

  /* ── Expedientes: ficha por número de serie con revisiones y carpeta propia ── */
  async loadInventory() {
    try {
      const inv = await api.inventoryList();
      this.setState((st) => ({ inv, invSel: st.invSel.filter((x) => inv.some((r) => r.serial === x)) }));
    } catch { /* sin base de datos */ }
  }
  async loadDossier(serial) {
    try {
      const dos = await api.inventoryGet(serial);
      const last = dos?.checks[dos.checks.length - 1];
      this.setState({ invDossier: dos, invCheck: last?.id ?? null, invEdit: dos ? this.invFields(dos.record) : null });
    } catch (e) {
      this.setState({ invDossier: null });
      this.toast({ title: 'No se pudo abrir el expediente', body: errText(e), icon: '#i-alert' });
    }
  }
  invFields(r) {
    return { status: r?.status || 'stock', lot: r?.lot || '', supplier: r?.supplier || '', destination: r?.destination || '', cost: r?.cost != null ? String(r.cost) : '', price: r?.price != null ? String(r.price) : '', notes: r?.notes || '' };
  }
  /** Ficha del expediente de un disco conectado (por clave o por serie). */
  invFor(d) {
    if (!d) return null;
    return (this.state.inv || []).find((x) => x.deviceKey === d.key || (d.serial && x.serial === d.serial)) || null;
  }
  openDossier = (serial) => this.nav('#/inventory/' + serial);
  askInventory = (id) => {
    const d = this.D(id);
    if (!d) return;
    const row = this.invFor(d);
    const b = this.state.batch;
    const f = this.invFields(row);
    if (b) { if (!row?.lot && b.lot) f.lot = b.lot; if (!row?.supplier && b.supplier) f.supplier = b.supplier; if (!row) f.status = b.status || 'stock'; }
    this.setState({ ctx: null, popover: null, dialog: { kind: 'inventory', id, serial: d.serial || row?.serial || '', manual: !d.serial && !row, exists: !!row, checks: row?.checks || 0, f, saving: false, error: '' } });
  };
  batchOffer(id) {
    if (this.state.dialog) { (this._batchQueue ||= []).push(id); return; }
    this.askInventory(id);
  }
  /** Fuente del reporte a partir de una revisión guardada (con su fecha real). */
  sourceFromCheck(c) {
    const id = c.disk?.id;
    return {
      disks: [c.disk], scans: c.extras?.scan ? { [id]: c.extras.scan } : {}, bench: c.extras?.bench ? { [id]: c.extras.bench } : {},
      exitBits: this.data.exitBits, appVersion: this.data.appVersion, smartctl: this.data.smartctl, company: this.state.set.company || '',
      date: dateTimeText(c.takenAt), cmds: [],
    };
  }
  stampOf(ms) {
    const t = new Date(ms), p = (n) => String(n).padStart(2, '0');
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}.${p(t.getMinutes())}.${p(t.getSeconds())}`;
  }
  /** PDF rápido de una revisión, directo a la carpeta <raíz>/<serie>/. */
  async saveCheckPdf(serial, c, checkId) {
    const source = this.sourceFromCheck(c);
    const sha256 = await sha256Hex(JSON.stringify(c.raw ?? c.disk));
    reportPayload.write({ ...source, sha256 });
    const rid = this.newReportId();
    const params = { disk: c.disk.id, paper: this.state.repPaper, s: [], tech: this.state.repTech, client: '', notes: '', mask: false, id: rid, kind: 'quick' as const };
    const path = await api.inventoryExportPdf(serial, `${this.stampOf(c.takenAt)} ${serial} (rápido).pdf`, reportHash(params), this.state.repPaper, checkId);
    const row = { id: rid, deviceKey: c.disk.key, createdAt: Date.now(), format: 'PDF', path, meta: { disk: c.disk.id, model: c.disk.model, verdict: c.disk.verdict, pages: 1, client: '', sha256, kind: 'quick', serial } };
    await api.reportsAdd(row).catch(() => {});
    const rep = { id: rid, disk: c.disk.id, model: c.disk.model, date: dateTimeText(row.createdAt), verdict: c.disk.verdict, format: 'PDF', pages: 1, client: '', file: basename(path), path, fresh: true };
    this.setState((st) => ({ reports: [rep].concat(st.reports || []) }));
    return path;
  }
  saveInventory = async () => {
    const dg = this.state.dialog;
    if (!dg || dg.kind !== 'inventory' || dg.saving) return;
    const serial = dg.manual ? normalizeSerial(dg.serial) : dg.serial;
    if (!validSerial(serial)) {
      this.setState({ dialog: { ...dg, error: serial ? 'El número de serie solo puede tener letras, números, punto, guion y guion bajo.' : 'Escribe el número de serie de la etiqueta del disco.' } });
      return;
    }
    this.setState({ dialog: { ...dg, saving: true, error: '' } });
    try {
      if (this.rt(dg.id)?.phase === 'ready') await this.readOne(dg.id);
      const live = this.D(dg.id);
      const d = live.serial ? live : { ...live, serial };
      const f = dg.f;
      const record = { serial, deviceKey: d.key, model: d.model, vendor: d.vendor, capacityBytes: d.bytes || null, status: f.status, lot: f.lot, supplier: f.supplier, destination: f.destination, cost: parseMoney(f.cost), price: parseMoney(f.price), notes: f.notes };
      const bench = this.benchSummary(d)[d.id] || null;
      const br = this.benchRun[d.id];
      const extras = { bench, benchResults: br?.status === 'passed' ? br.results : null, scan: this.data.scans[d.id] || null, path: d.path || null };
      const raw = this.outputs[dg.id]?.json ?? null;
      const takenAt = Date.now();
      const checkId = await api.inventoryAdd(record, { verdict: d.verdict, life: d.nodata ? null : d.life, disk: d, raw, extras });
      const files = [];
      if (this.state.set.invPdf !== false) files.push(await this.saveCheckPdf(serial, { disk: d, raw, extras, takenAt }, checkId));
      if (this.state.set.invJson !== false && raw) files.push(await api.inventorySaveFile(serial, `${this.stampOf(takenAt)} ${serial} smartctl.json`, JSON.stringify(raw, null, 2)));
      this.addLogReal(`hdi-inventory --add ${serial}`, dg.id, 0, 0);
      this.setState((st) => ({ dialog: null, batch: st.batch ? { ...st.batch, added: st.batch.added + 1 } : null }));
      this.toast({ title: dg.exists ? 'Revisión agregada al expediente' : 'Agregado al expediente', body: `${serial}${files.length ? ' · ' + files.length + (files.length === 1 ? ' archivo' : ' archivos') + ' en su carpeta' : ''}`, icon: '#i-check-circle' });
      await this.loadInventory();
      if (this.state.route?.screen === 'inventory' && this.state.route.sub === serial) this.loadDossier(serial);
    } catch (e) {
      this.setState({ dialog: { ...this.state.dialog, saving: false, error: errText(e) } });
    }
  };
  invSaveEdit = async () => {
    const dos = this.state.invDossier, f = this.state.invEdit;
    if (!dos || !f) return;
    try {
      await api.inventoryUpdate(dos.record.serial, { status: f.status, lot: f.lot, supplier: f.supplier, destination: f.destination, cost: parseMoney(f.cost), price: parseMoney(f.price), notes: f.notes });
      this.toast({ title: 'Expediente actualizado', body: dos.record.serial, icon: '#i-check-circle' });
      await this.loadInventory();
      await this.loadDossier(dos.record.serial);
    } catch (e) {
      this.toast({ title: 'No se pudo guardar', body: errText(e), icon: '#i-alert' });
    }
  };
  invDelete = async () => {
    const dos = this.state.invDossier;
    if (!dos) return;
    try {
      await api.inventoryDelete(dos.record.serial);
      this.setState({ dialog: null, invDossier: null });
      this.toast({ title: 'Expediente eliminado', body: 'Su carpeta y sus PDF se conservaron.', icon: '#i-trash' });
      await this.loadInventory();
      this.nav('#/inventory');
    } catch (e) {
      this.toast({ title: 'No se pudo eliminar', body: errText(e), icon: '#i-alert' });
    }
  };
  /** Exportar la revisión elegida: al diálogo de guardado o a la carpeta del expediente. */
  invExport = async (fmt) => {
    const dos = this.state.invDossier;
    const c = dos?.checks.find((x) => x.id === this.state.invCheck) || dos?.checks[dos.checks.length - 1];
    if (!dos || !c) return;
    this.setState({ popover: null });
    try {
      if (fmt === 'folder') {
        const path = await this.saveCheckPdf(dos.record.serial, c, c.id);
        this.toast({ title: 'PDF guardado en la carpeta del expediente', body: basename(path), icon: '#i-check-circle' });
        this.loadDossier(dos.record.serial);
        return;
      }
      const kind = fmt === 'full' ? 'full' : 'quick';
      const format = fmt === 'html' ? 'HTML' : fmt === 'json' ? 'JSON' : 'PDF';
      const s = this.state;
      const rep = await this.exportOne(c.disk, { kind, format, paper: s.repPaper, s: s.repSecs, tech: s.repTech, client: dos.record.destination || '', notes: dos.record.notes || '', mask: false }, { source: this.sourceFromCheck(c), raw: c.raw });
      if (!rep) this.toast({ title: 'Exportación cancelada', icon: '#i-info' });
    } catch (e) {
      this.toast({ title: 'No se pudo exportar', body: errText(e), icon: '#i-alert' });
    }
  };
  startBatch = () => {
    const dg = this.state.dialog;
    const f = dg?.kind === 'batch' ? dg.f : null;
    if (!f || !f.lot.trim()) { this.setState({ dialog: { ...dg, error: 'Ponle nombre al lote para identificarlo después.' } }); return; }
    this._batchQueue = [];
    this.setState({ dialog: null, batch: { lot: f.lot.trim(), supplier: f.supplier.trim(), status: f.status, added: 0 } });
    this.toast({ title: 'Recibiendo lote «' + f.lot.trim() + '»', body: 'Conecta los discos uno por uno; cada uno abrirá su hoja de expediente.', icon: '#i-folder' });
  };
  endBatch = () => {
    const b = this.state.batch;
    this._batchQueue = [];
    this.setState({ batch: null });
    if (b) this.toast({ title: 'Lote «' + b.lot + '» terminado', body: b.added + (b.added === 1 ? ' disco agregado' : ' discos agregados') + ' al expediente.', icon: '#i-check-circle' });
  };

  /* ── Selección de expedientes y reporte rápido de varios discos (desviación #21) ── */
  invShown() {
    const s = this.state;
    return filterInventory(s.inv || [], { q: s.invQ, status: s.invStatus, lot: s.invLot }).map((x) => x.serial);
  }
  /** Lote común de los discos elegidos (referencia sugerida del reporte). */
  invCommonLot(serials) {
    const lots = new Set((this.state.inv || []).filter((x) => serials.includes(x.serial)).map((x) => x.lot || ''));
    return lots.size === 1 ? [...lots][0] : '';
  }
  invSetPick = (on, sel = []) => this.setState((st) => ({ invPick: on, invSel: on ? sel : [], invAnchor: sel[0] ?? null, popover: null, invRep: { ...st.invRep, ref: null, busy: false } }));
  /** Marca o desmarca un disco; con ⇧ marca el rango visible desde el último elegido. */
  invToggle = (serial, range) => {
    const shown = this.invShown();
    this.setState((s) => {
      const sel = new Set(s.invSel);
      const a = shown.indexOf(s.invAnchor), b = shown.indexOf(serial);
      if (range && a >= 0 && b >= 0) shown.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((x) => sel.add(x));
      else if (sel.has(serial)) sel.delete(serial);
      else sel.add(serial);
      return { invSel: [...sel], invAnchor: serial };
    });
  };
  /** Marca todos los visibles (respeta búsqueda y filtros) o, si ya lo están, los desmarca. */
  invSelectVisible = (force) => {
    const shown = this.invShown(), sel = new Set(this.state.invSel);
    const all = shown.length > 0 && shown.every((x) => sel.has(x));
    shown.forEach((x) => (all && !force ? sel.delete(x) : sel.add(x)));
    this.setState({ invSel: [...sel] });
  };
  invRemove = (serial) => this.setState((st) => ({ invSel: st.invSel.filter((x) => x !== serial) }));
  /** Seleccionados en el orden de la tabla (y del PDF). */
  invSorted(serials = this.state.invSel) {
    const sel = new Set(serials);
    return sortInventory((this.state.inv || []).filter((x) => sel.has(x.serial)), this.state.invSort);
  }
  /** Clic en un encabezado: la misma columna invierte el sentido; otra empieza en su sentido natural. */
  invSortBy = (key) => this.setState((st) => {
    const cur = st.invSort, def = INV_SORTS.find((x) => x.key === key);
    return { invSort: cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: def?.dir || 'asc' } };
  });
  // Esc sale del modo selección y ⌘A marca los visibles; lo demás sigue igual.
  baseKey = this.onKey;
  onKey = (e) => {
    const s = this.state;
    if (s.invPick && s.route?.screen === 'inventory' && !s.dialog && !s.palette && !s.popover && !s.ctx) {
      const inField = /input|textarea|select/i.test(e.target?.tagName || '');
      if (e.key === 'Escape') { e.preventDefault(); this.invSetPick(false); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && !inField) { e.preventDefault(); this.invSelectVisible(true); return; }
    }
    this.baseKey(e);
  };
  /** PDF de una hoja-tabla con la última revisión de cada disco elegido (diálogo Guardar). */
  invBatchReport = async () => {
    const s = this.state, serials = s.invSel;
    if (!serials.length || s.invRep.busy) return;
    this.setState((st) => ({ invRep: { ...st.invRep, busy: true } }));
    try {
      const extra = !!s.invRep.extra;
      // En el orden de la tabla: inventory_latest respeta el orden pedido y el reporte no lo cambia.
      const rows = await api.inventoryLatest(this.invSorted(serials).map((x) => x.serial));
      // Solo lo que se imprime: los datos comerciales únicamente si se pidieron (nunca costo ni precio).
      const items = rows.filter((r) => r.check).map((r) => ({ serial: r.serial, model: r.model, takenAt: r.check.takenAt, disk: r.check.disk, ...(extra ? { status: r.status, lot: r.lot || null, destination: r.destination || null } : {}) }));
      if (!items.length) throw new Error('Los discos elegidos no tienen revisiones guardadas.');
      const ref = String(s.invRep.ref ?? this.invCommonLot(serials)).trim();
      const n = items.length, label = `${n} ${n === 1 ? 'disco' : 'discos'}`;
      const th = this.thresholds();
      const sha256 = await sha256Hex(JSON.stringify(items.map((x) => x.disk)));
      reportPayload.write({ batch: { items, extra, th, order: 'given' }, sha256, disks: [], scans: {}, exitBits: this.data.exitBits, appVersion: this.data.appVersion, smartctl: this.data.smartctl, company: s.set.company || '', date: dateTimeText(Date.now()), cmds: [] });
      this._repSig = null; // la vista previa del constructor vuelve a escribir su propia fuente
      const rid = this.newReportId();
      const hash = reportHash({ disk: '', paper: s.repPaper, s: [], tech: s.repTech, client: ref, notes: '', mask: false, id: rid, kind: 'batch' });
      const path = await api.exportPdf(`${rid} Reporte de ${label}.pdf`, hash, s.repPaper);
      if (!path) { this.toast({ title: 'Exportación cancelada', icon: '#i-info' }); return; }
      this.lastExportPath = path;
      const { sum, pages } = batchLayout(items, { extra, th, order: 'given', paper: s.repPaper });
      const model = ref || 'Discos del expediente';
      const row = { id: rid, deviceKey: 'batch', createdAt: Date.now(), format: 'PDF', path, meta: { kind: 'batch', disk: label, model, verdict: sum.worst, pages: pages.length, client: ref, sha256, serials: items.map((x) => x.serial) } };
      await api.reportsAdd(row);
      const rep = { id: rid, disk: label, model, date: dateTimeText(row.createdAt), verdict: sum.worst, format: 'PDF', pages: pages.length, client: ref, file: basename(path), path, fresh: true };
      this.setState((st) => ({ reports: [rep].concat(st.reports || []) }));
      this.toast({ title: `Reporte de ${label} guardado`, body: rep.file, icon: '#i-check-circle' });
      this.addLogReal(`hdi-report --format pdf --batch ${n}`, null, 0, 0);
    } catch (e) {
      this.toast({ title: 'No se pudo generar el reporte', body: errText(e), icon: '#i-alert' });
    } finally {
      this.setState((st) => ({ invRep: { ...st.invRep, busy: false } }));
    }
  };

  /** View-model de la pantalla Expedientes, la hoja y los puntos de entrada. */
  inventoryVals(out) {
    const s = this.state, r = s.route;
    const segBtnK = (on) => ({ bg: on ? 'var(--surface-raised)' : 'transparent', shadow: on ? 'var(--shadow-1)' : 'none', fg: on ? 'var(--text-primary)' : 'var(--text-secondary)', pressed: on ? 'true' : 'false' });
    const sw = (on) => ({ track: on ? 'var(--accent)' : 'var(--gray-6)', knob: on ? 'translateX(12px)' : 'none', on: on ? 'true' : 'false' });
    const hvK = (v, k) => `var(--health-${v}-${k})`;
    const stTone = (k) => { const st = statusOf(k); return st.tone === 'accent' ? { fg: 'var(--accent-fg)', bg: 'var(--accent-soft)' } : { fg: hvK(st.tone, 'fg'), bg: hvK(st.tone, 'bg') }; };
    const scr = r?.screen;
    out.navInventory = true;
    out.navInventoryBg = scr === 'inventory' ? 'var(--surface-selected)' : 'transparent';
    out.navInventoryCur = scr === 'inventory' ? 'page' : 'false';
    out.navInventoryCount = (s.inv || []).length ? String(s.inv.length) : '';
    out.goInventory = () => this.nav('#/inventory');
    out.isInventory = scr === 'inventory';
    if (out.isInventory) {
      out.crumbs = r.sub && s.invDossier
        ? [{ label: 'Expedientes', go: () => this.nav('#/inventory'), weight: 500, color: 'var(--text-secondary)', sep: false }, { label: s.invDossier.record.serial, go: () => {}, weight: 600, color: 'var(--text-primary)', sep: true }]
        : [{ label: 'Expedientes', go: () => {}, weight: 600, color: 'var(--text-primary)', sep: false }];
    }
    // Lista
    const rows = s.inv || [];
    const shown = filterInventory(rows, { q: s.invQ, status: s.invStatus, lot: s.invLot });
    out.invAll = rows.length;
    out.invEmpty = rows.length === 0;
    out.invNoMatch = rows.length > 0 && shown.length === 0;
    out.invCountTxt = shown.length === rows.length ? `${rows.length} ${rows.length === 1 ? 'disco' : 'discos'}` : `${shown.length} de ${rows.length}`;
    out.invQ = s.invQ;
    out.onInvQ = (e) => this.setState({ invQ: e.target.value });
    out.invStatuses = [{ key: 'all', label: 'Todos' }, ...STATUSES.map((x) => ({ key: x.key, label: x.label }))].map((x) => ({ label: x.label, ...segBtnK(s.invStatus === x.key), pick: () => this.setState({ invStatus: x.key }) }));
    out.invLots = lotsOf(rows);
    out.invLot = s.invLot;
    out.onInvLot = (e) => this.setState({ invLot: e.target.value });
    const pick = !!s.invPick, selSet = new Set(s.invSel || []);
    out.invRows = shown.map((x) => {
      const v = x.last?.verdict || 'nodata', st = statusOf(x.status), tone = stTone(x.status);
      const hours = invVerdict(x) !== 'nodata' && x.last?.hours != null ? nf(Math.round(x.last.hours)) + ' h' : '';
      const checked = pick && selSet.has(x.serial);
      const sel = pick ? checked : r?.sub === x.serial;
      return {
        checked, box: checked ? 'var(--accent)' : 'transparent', boxBorder: checked ? 'var(--accent)' : 'var(--border-strong)', check: checked ? 1 : 0,
        serial: x.serial, model: x.model, lot: x.lot || '', life: x.last?.life != null ? x.last.life + ' %' : '—', hours, checks: x.checks,
        vIcon: (VERDICTS[v] || VERDICTS.nodata)[1], vFg: hvK(v, 'solid'), vLabel: (VERDICTS[v] || VERDICTS.nodata)[0],
        stLabel: st.label, stIcon: st.icon, stFg: tone.fg, stBg: tone.bg, bg: sel ? 'var(--surface-selected)' : 'transparent', cur: sel ? 'true' : 'false',
        when: x.last ? dateText(x.last.takenAt) : '',
        // En modo selección el clic marca (⇧ = rango); fuera de él, ⌘-clic entra al modo con esta fila.
        pick: (e) => (pick ? this.invToggle(x.serial, !!e?.shiftKey) : e?.metaKey ? this.invSetPick(true, [x.serial]) : this.openDossier(x.serial)),
      };
    });
    out.invPick = pick;
    out.invPickBtn = { label: pick ? 'Listo' : 'Seleccionar', run: () => this.invSetPick(!pick) };
    out.invSelAll = null;
    out.invBatch = null;
    if (pick) {
      const vis = shown.map((x) => x.serial), n = s.invSel.length;
      const allOn = vis.length > 0 && vis.every((x) => selSet.has(x));
      const hidden = s.invSel.filter((x) => !vis.includes(x)).length;
      out.invSelAll = {
        on: allOn, box: allOn ? 'var(--accent)' : 'transparent', boxBorder: allOn ? 'var(--accent)' : 'var(--border-strong)', check: allOn ? 1 : 0,
        label: allOn ? 'Quitar selección' : vis.length === 1 ? 'Seleccionar el visible' : `Seleccionar los ${vis.length}`,
        txt: `${n} ${n === 1 ? 'seleccionado' : 'seleccionados'}${hidden ? ` (${hidden} ${hidden === 1 ? 'oculto' : 'ocultos'} por los filtros)` : ''}`,
        toggle: () => this.invSelectVisible(false), disabled: vis.length === 0,
      };
      // Resumen con la última revisión de la lista (sin cargar las revisiones completas).
      const chosen = this.invSorted();
      const vOf = (x) => (x.last?.verdict && VERDICTS[x.last.verdict] ? x.last.verdict : 'nodata');
      const lives = chosen.filter((x) => vOf(x) !== 'nodata' && x.last?.life != null).map((x) => ({ life: x.last.life, serial: x.serial }));
      const min = lives.reduce((m, x) => (!m || x.life < m.life ? x : m), null);
      const segBtnP = (on) => ({ bg: on ? 'var(--surface-raised)' : 'transparent', shadow: on ? 'var(--shadow-1)' : 'none', fg: on ? 'var(--text-primary)' : 'var(--text-secondary)', pressed: on ? 'true' : 'false' });
      const rep = s.invRep;
      out.invBatch = {
        n, empty: n === 0, title: n ? `${n} ${n === 1 ? 'disco seleccionado' : 'discos seleccionados'}` : 'Ningún disco seleccionado',
        tiles: VERDICT_KEYS.map((k) => { const c = chosen.filter((x) => vOf(x) === k).length; return { key: k, label: VERDICTS[k][0], icon: VERDICTS[k][1], count: c, fg: c ? hvK(k, 'fg') : 'var(--text-tertiary)', bg: c ? hvK(k, 'bg') : 'var(--surface-sunken)' }; }),
        avgTxt: lives.length ? Math.round(lives.reduce((a, x) => a + x.life, 0) / lives.length) + ' %' : '—',
        minTxt: min ? `${min.life} %` : '—', minSerial: min?.serial || '',
        list: chosen.map((x, i) => {
          const v = vOf(x), nd = v === 'nodata', st = statusOf(x.status), tone = stTone(x.status), l = x.last;
          return {
            n: i + 1, serial: x.serial, model: x.model, life: l?.life != null && !nd ? l.life + ' %' : '—',
            hours: !nd && l?.hours != null ? nf(Math.round(l.hours)) + ' h' : '—',
            written: !nd && l?.writtenTB != null ? tbText(l.writtenTB) : '—',
            lot: x.lot || '—', when: l ? dateText(l.takenAt) : '—',
            stLabel: st.label, stIcon: st.icon, stFg: tone.fg, stBg: tone.bg,
            vIcon: VERDICTS[v][1], vFg: hvK(v, 'solid'), vLabel: VERDICTS[v][0], remove: () => this.invRemove(x.serial),
          };
        }),
        // Tabla de seleccionados (desviación #22): encabezados ordenables y pestañas Tabla / Reporte PDF.
        pane: s.invPane,
        panes: [['table', 'Tabla'], ['report', 'Reporte PDF']].map(([k, l]) => ({ label: l, ...segBtnK(s.invPane === k), pick: () => this.setState({ invPane: k }) })),
        lotCol: chosen.some((x) => x.lot),
        cols: INV_SORTS.filter((c) => c.key !== 'lot' || chosen.some((x) => x.lot)).map((c) => {
          const on = s.invSort.key === c.key;
          return { key: c.key, label: c.key === 'serial' ? 'Serie' : c.key === 'taken' ? 'Revisión' : c.key === 'hours' ? 'Horas' : c.key === 'written' ? 'Escritos' : c.key === 'life' ? 'Vida' : c.label, right: ['life', 'hours', 'written'].includes(c.key), sort: on ? (s.invSort.dir === 'asc' ? 'ascending' : 'descending') : 'none', arrow: on ? (s.invSort.dir === 'asc' ? '#i-arrow-up' : '#i-arrow-down') : '', fg: on ? 'var(--text-primary)' : 'var(--text-tertiary)', tip: on ? `Orden: ${c.label.toLowerCase()}, ${c[s.invSort.dir]}` : `Ordenar por ${c.label.toLowerCase()}`, pick: () => this.invSortBy(c.key) };
        }),
        sortSel: { value: s.invSort.key, options: INV_SORTS.map((c) => ({ value: c.key, label: c.label })), onChange: (e) => this.invSortBy(e.target.value) },
        sortDir: (() => { const c = INV_SORTS.find((x) => x.key === s.invSort.key) || INV_SORTS[0]; return { label: c[s.invSort.dir], icon: s.invSort.dir === 'asc' ? '#i-arrow-up' : '#i-arrow-down', toggle: () => this.invSortBy(s.invSort.key) }; })(),
        ref: rep.ref ?? this.invCommonLot(s.invSel), onRef: (e) => { const v = e.target.value; this.setState((st) => ({ invRep: { ...st.invRep, ref: v } })); },
        tech: s.repTech, onTech: (e) => this.setState({ repTech: e.target.value }),
        papers: [['letter', 'Carta'], ['a4', 'A4']].map(([k, l]) => ({ label: l, ...segBtnP(s.repPaper === k), pick: () => this.setState({ repPaper: k }) })),
        swExtra: sw(!!rep.extra), tgExtra: () => this.setState((st) => ({ invRep: { ...st.invRep, extra: !st.invRep.extra } })),
        busy: !!rep.busy, run: this.invBatchReport,
      };
    }
    out.invStartBatch = () => this.setState({ dialog: { kind: 'batch', f: { lot: '', supplier: '', status: 'stock' }, error: '' } });
    out.invRoot = s.invRoot;
    // Detalle
    const dos = r?.sub && s.invDossier?.record.serial === r.sub ? s.invDossier : null;
    out.invNoSel = out.isInventory && !r?.sub && rows.length > 0;
    out.invDetail = null;
    if (dos && dos.checks.length) {
      const idx = Math.max(0, dos.checks.findIndex((c) => c.id === s.invCheck));
      const c = dos.checks[idx] || dos.checks[dos.checks.length - 1];
      const d = c.disk || {};
      const qv = quickView(d, { mask: false, bench: c.extras?.bench, scan: c.extras?.scan });
      const rec = dos.record, st = statusOf(rec.status), tone = stTone(rec.status);
      const liveId = this.data.disks.find((x) => x.key === rec.deviceKey || (x.serial && x.serial === rec.serial))?.id;
      const connected = !!liveId && this.rt(liveId)?.phase === 'ready';
      const f = s.invEdit || this.invFields(rec);
      const setF = (k) => (e) => this.setState((st2) => ({ invEdit: { ...(st2.invEdit || this.invFields(rec)), [k]: e.target.value } }));
      const dirty = JSON.stringify(f) !== JSON.stringify(this.invFields(rec));
      const latest = c.id === dos.checks[dos.checks.length - 1].id;
      out.invDetail = {
        serial: rec.serial, model: rec.model, sub: [qv.brand !== '—' ? qv.brand : null, qv.cap, d.connLabel].filter(Boolean).join(' · '),
        stLabel: st.label, stIcon: st.icon, stFg: tone.fg, stBg: tone.bg,
        created: dateTimeText(rec.createdAt), folder: dos.folder,
        copyIcon: s.copied === 'inv-serial' ? '#i-check' : '#i-copy', copy: () => this.copy('inv-serial', rec.serial),
        reveal: () => api.inventoryReveal(rec.serial).catch((e) => this.toast({ title: 'No se pudo abrir la carpeta', body: errText(e), icon: '#i-alert' })),
        connected, newCheck: connected ? () => this.askInventory(liveId) : null,
        askDelete: () => this.setState({ dialog: { kind: 'invDelete', serial: rec.serial } }),
        exportOpen: s.popover === 'invExport', toggleExport: () => this.setState({ popover: s.popover === 'invExport' ? null : 'invExport' }),
        exports: [
          ['quick', '#i-bolt', 'Reporte rápido (PDF)'], ['full', '#i-report', 'Reporte completo (PDF)'], ['html', '#i-external', 'Reporte completo (HTML)'], ['json', '#i-braces', 'Datos (JSON)'], ['folder', '#i-folder', 'Guardar PDF en su carpeta'],
        ].map(([k, icon, label]) => ({ icon, label, run: () => this.invExport(k) })),
        // Lectura elegida
        checkLabel: latest ? `Última revisión · ${dateTimeText(c.takenAt)}` : `Revisión del ${dateTimeText(c.takenAt)}`,
        latest, showLatest: latest ? null : () => this.setState({ invCheck: dos.checks[dos.checks.length - 1].id }),
        d, qv, life: d.nodata ? null : d.life, verdict: qv.verdict, vLabel: qv.vLabel, vIcon: qv.vIcon, sentence: d.nodata ? d.reason || d.sentence : d.sentence,
        facts: d.nodata ? [] : [['Estado SMART', d.critWarn ? 'Fallido' : 'Aprobado'], ['Temperatura', `${d.temp} °C`], ['Errores de medios', String(d.mediaErr ?? 0)]],
        meters: d.nodata ? [] : [
          { label: 'Vida útil restante', value: `${d.life} %`, pct: d.life, tone: hvK(qv.verdict, 'solid'), note: `Desgaste acumulado: ${d.used} %` },
          { label: 'Repuesto disponible', value: `${d.spare} %`, pct: d.spare, mark: d.spareTh, tone: qv.spareK === 'crit' ? hvK('critical', 'solid') : qv.spareK === 'warn' ? hvK('warning', 'solid') : hvK('optimal', 'solid'), note: `Umbral del fabricante: ${d.spareTh} %` },
        ],
        // Datos comerciales
        f, setF, dirty, save: this.invSaveEdit, reset: () => this.setState({ invEdit: this.invFields(rec) }),
        statusOpts: STATUSES.map((x) => ({ value: x.key, label: x.label })),
        money: { cost: money(rec.cost), price: money(rec.price), margin: rec.cost != null && rec.price != null ? money(rec.price - rec.cost) : null },
        // Revisiones (la más reciente arriba)
        checks: dos.checks.map((ck, i) => {
          const prev = i ? dos.checks[i - 1].disk : null, delta = checkDelta(prev, ck.disk || {}), v = ck.verdict || 'nodata';
          return {
            id: ck.id, n: i + 1, when: dateTimeText(ck.takenAt), life: ck.life != null ? ck.life + ' %' : '—', vLabel: (VERDICTS[v] || VERDICTS.nodata)[0], vIcon: (VERDICTS[v] || VERDICTS.nodata)[1], vFg: hvK(v, 'solid'),
            written: ck.disk?.writtenText || '—', hours: ck.disk?.hours != null ? nf(ck.disk.hours) + ' h' : '—', delta: delta ? delta.text : i ? '' : 'Primera revisión',
            deltaBad: !!delta && delta.mediaErr > 0, sel: ck.id === c.id, pick: () => this.setState({ invCheck: ck.id }),
            pdf: ck.pdfPath ? () => api.revealInFinder(ck.pdfPath).catch(() => {}) : null,
          };
        }).reverse(),
        checksTxt: `${dos.checks.length} ${dos.checks.length === 1 ? 'revisión' : 'revisiones'}`,
      };
    } else if (dos) {
      out.invDetail = null;
    }
    out.invLoading = out.isInventory && !!r?.sub && !dos;
    // Hoja «Agregar al expediente»
    const dg = s.dialog;
    out.hasInvSheet = !!dg && dg.kind === 'inventory';
    if (out.hasInvSheet) {
      const d = this.D(dg.id);
      const set = (k) => (e) => this.setState((st2) => ({ dialog: { ...st2.dialog, f: { ...st2.dialog.f, [k]: e.target.value } } }));
      const serial = dg.manual ? normalizeSerial(dg.serial) : dg.serial;
      out.invSheet = {
        model: d?.model || '', title: dg.exists ? 'Nueva revisión del expediente' : 'Agregar al expediente',
        serial: dg.serial, manual: dg.manual, onSerial: (e) => this.setState((st2) => ({ dialog: { ...st2.dialog, serial: e.target.value, error: '' } })),
        exists: dg.exists, checksTxt: dg.exists ? `Ya tiene ${dg.checks} ${dg.checks === 1 ? 'revisión' : 'revisiones'}; esta será la número ${dg.checks + 1}.` : '',
        f: dg.f, set, statusOpts: STATUSES.map((x) => ({ value: x.key, label: x.label })),
        where: `${s.invRoot || '…/Expedientes'}/${serial || '<serie>'}/`,
        files: [s.set.invPdf !== false ? 'reporte rápido en PDF' : null, s.set.invJson !== false ? 'JSON de smartctl' : null].filter(Boolean).join(' y '),
        nodata: !!d?.nodata, batch: s.batch ? `Lote en recepción: «${s.batch.lot}»` : '',
        error: dg.error, saving: dg.saving, save: this.saveInventory,
        submit: (e) => { e.preventDefault(); this.saveInventory(); },
      };
    }
    out.hasBatchSheet = !!dg && dg.kind === 'batch';
    if (out.hasBatchSheet) {
      const set = (k) => (e) => this.setState((st2) => ({ dialog: { ...st2.dialog, f: { ...st2.dialog.f, [k]: e.target.value }, error: '' } }));
      out.batchSheet = { f: dg.f, set, error: dg.error, statusOpts: STATUSES.map((x) => ({ value: x.key, label: x.label })), start: this.startBatch, submit: (e) => { e.preventDefault(); this.startBatch(); } };
    }
    out.hasInvDelete = !!dg && dg.kind === 'invDelete';
    out.invDeleteSerial = dg?.serial || '';
    out.invDeleteGo = this.invDelete;
    out.batchBar = s.batch ? { lot: s.batch.lot, added: s.batch.added, txt: `${s.batch.added} ${s.batch.added === 1 ? 'agregado' : 'agregados'}`, end: this.endBatch } : null;
    // Punto de entrada en el Resumen del disco
    if (scr === 'device' && r.id) {
      const d = this.D(r.id), row = this.invFor(d);
      out.invAction = row
        ? { label: 'En expediente · ' + statusOf(row.status).label, icon: '#i-check', run: () => this.openDossier(row.serial) }
        : { label: 'Agregar al expediente', icon: '#i-folder', run: () => this.askInventory(r.id) };
    }
    // Ajustes
    out.invSettings = {
      root: s.invRoot, pick: () => api.inventoryPickRoot().then((p) => p && this.setState({ invRoot: p })).catch((e) => this.toast({ title: 'No se pudo cambiar la carpeta', body: errText(e), icon: '#i-alert' })),
      swPdf: sw(s.set.invPdf !== false), tgPdf: () => this.setSet({ invPdf: s.set.invPdf === false }),
      swJson: sw(s.set.invJson !== false), tgJson: () => this.setSet({ invJson: s.set.invJson === false }),
    };
  }

  paletteAll() {
    const items = super.paletteAll();
    const q = String(this.state.pq || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const inv = (this.state.inv || []).map((x) => ({ g: 'Expedientes', label: x.model, sub: [x.serial, statusOf(x.status).label, x.lot].filter(Boolean).join(' · '), icon: '#i-folder', kbd: '', run: () => this.openDossier(x.serial) }));
    const go = { g: 'Ir a', label: 'Expedientes', sub: 'Discos agregados por número de serie', icon: '#i-folder', kbd: '', run: () => this.nav('#/inventory') };
    const multi = { g: 'Acciones', label: 'Reporte rápido de varios discos', sub: 'Elige discos del expediente', icon: '#i-bolt', kbd: '', run: () => { this.nav('#/inventory'); this.invSetPick(true); } };
    const match = (it) => !q || (it.label + ' ' + it.sub).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q);
    return items.concat((q ? inv.filter(match) : inv.slice(0, 5)), inv.length && match(multi) ? [multi] : [], match(go) ? [go] : []);
  }
  paletteFlat() {
    const all = this.paletteAll();
    return ['Discos', 'Expedientes', 'Acciones', 'Ir a'].flatMap((g) => all.filter((i) => i.g === g));
  }

  testView(d) {
    const v = super.testView(d);
    const s = this.state;
    const busy = !!(s.test && s.test.status === 'running');
    const boot = !!d.bootDisk;
    const ata = d.protocol === 'ATA' && d.optAdmin?.selftest;
    const base = { locked: false, lockTxt: '', disTxt: '', infoOpen: false, toggleInfo: () => {} };
    v.cards = v.cards.map((c) => {
      if ((c.key === 'full' || c.key === 'quick') && this.auth?.touchId) return { ...c, req: 'Touch ID o contraseña' };
      if ((c.key === 'short' || c.key === 'long') && ata) {
        return { ...c, ...base, req: 'Disco SATA · autoprueba del propio disco', disabled: busy, btnOpacity: busy ? 0.4 : 1, disTxt: busy ? 'Hay una prueba en curso.' : '', start: () => this.startSelfTest(d, c.key) };
      }
      return c;
    });
    const wl = this.workload[d.key];
    const hhmm = (ms) => new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    v.cards.push(
      { ...base, key: 'stress', title: 'Prueba de estrés térmico', cmd: `hdi-scan --stress ${STRESS_SECONDS / 60}min /dev/r${d.id}`, icon: '#i-thermometer',
        desc: 'Lectura sostenida durante 10 minutos mientras se registra la temperatura. Detecta si el gabinete se sobrecalienta y el disco reduce su velocidad (estrangulamiento térmico).',
        dur: `${STRESS_SECONDS / 60} min`, req: this.auth?.touchId ? 'Touch ID o contraseña' : 'Contraseña de administrador',
        disabled: boot || busy, btnOpacity: boot || busy ? 0.4 : 1, disTxt: boot ? 'No disponible para el disco interno de arranque.' : busy ? 'Hay una prueba en curso.' : '', start: () => this.askScan('stress') },
      { ...base, key: 'workload', title: 'Comparación antes/después de una carga', cmd: `smartctl -x -j ${d.id}  ×2`, icon: '#i-history',
        desc: wl ? `Instantánea inicial a las ${hhmm(wl.at)}: ${wl.before.writtenText} escritos, ${wl.before.mediaErr} errores de medios. Usa el disco y compara cuando termines.`
          : 'Toma una instantánea SMART, usa el disco (copiar archivos, benchmark o uso normal) y compara: datos escritos y leídos, errores nuevos, temperatura y apagados inseguros.',
        dur: wl ? 'Lista para comparar' : 'Lo que dure tu carga', req: 'Sin contraseña · solo lectura SMART',
        disabled: !!d.nodata || busy, btnOpacity: d.nodata || busy ? 0.4 : 1, disTxt: d.nodata ? 'Requiere datos SMART.' : '', btnLabel: wl ? 'Comparar ahora' : 'Tomar instantánea',
        start: () => (wl ? this.compareWorkload(d) : this.takeWorkloadBaseline(d)) },
      { ...base, key: 'bench', title: 'Benchmark de lectura/escritura', cmd: 'fio · SEQ1M Q8T1 · SEQ1M Q1T1 · RND4K Q32T1 · RND4K Q1T1', icon: '#i-bolt',
        desc: 'Mide la velocidad real de lectura y escritura con fio (código abierto) sobre un archivo temporal en un volumen del disco, y la compara con el techo de la conexión.',
        dur: '~1 min', req: 'Sin contraseña · archivo temporal',
        disabled: busy, btnOpacity: busy ? 0.4 : 1, disTxt: busy ? 'Hay una prueba en curso.' : '', start: () => this.askBench(d) },
    );
    const t = s.test && s.test.diskId === d.id ? s.test : null;
    if (t && v.run && !['full', 'quick', 'stress'].includes(t.kind)) {
      v.run.zones = [];
      v.run.zonesList = [];
      v.run.hasZones = false;
    }
    if (t && v.run) {
      if (t.kind === 'stress') {
        const st = this.stress[d.id];
        v.run.kindLabel = 'Prueba de estrés térmico';
        v.run.chartTitle = 'Velocidad de lectura sostenida a lo largo de la prueba';
        v.run.axisMid = '50 % del tiempo';
        v.run.diff = [];
        v.run.hasDiff = false;
        if (v.run.done && st && (t.status === 'passed' || t.status === 'errors')) {
          const tone = st.throttled ? 'warning' : 'optimal';
          v.run.rTitle = st.throttled ? 'Estrangulamiento térmico detectado' : 'Sin estrangulamiento térmico';
          v.run.rBody = st.throttled
            ? `La velocidad cayó ${Math.round(st.drop * 100)} % (de ${nf(st.firstAvg)} a ${nf(st.lastAvg)} MB/s) y la temperatura llegó a ${st.maxTemp} °C. Mejora la disipación del gabinete.`
            : `Velocidad estable (${nf(st.firstAvg)} → ${nf(st.lastAvg)} MB/s) con temperatura máxima de ${st.maxTemp} °C.`;
          v.run.rFg = `var(--health-${tone}-fg)`; v.run.rBg = `var(--health-${tone}-bg)`; v.run.rBorder = `var(--health-${tone}-border)`;
          v.run.rIcon = st.throttled ? '#i-alert' : '#i-check-circle';
          v.run.stats = [['Duración', st.secs >= 60 ? `${Math.floor(st.secs / 60)} min ${st.secs % 60} s` : `${st.secs} s`], ['Promedio', nf(st.avg) + ' MB/s'], ['Al inicio', nf(st.firstAvg) + ' MB/s'], ['Al final', nf(st.lastAvg) + ' MB/s'], ['Temperatura', `${st.startTemp} → ${st.maxTemp} °C`], ['Caída de velocidad', Math.round(st.drop * 100) + ' %']].map(([label, val]) => ({ label, val }));
        }
      } else if (String(t.kind).startsWith('selftest')) {
        v.run.kindLabel = t.kind === 'selftest-short' ? 'Autoprueba SMART corta' : 'Autoprueba SMART extendida';
        v.run.noChart = true;
        v.run.speed = '—';
        v.run.remaining = '—';
        v.run.elapsed = fmtClock((Date.now() - (this.selfTestStarted || Date.now())) / 1000);
        v.run.diff = [];
        v.run.hasDiff = false;
        if (v.run.done) {
          v.run.stats = [['Tipo', t.kind === 'selftest-short' ? 'Corta' : 'Extendida'], ['Resultado', t.status === 'passed' ? 'Sin errores' : t.status === 'cancelled' ? 'Cancelada' : 'Con errores']].map(([label, val]) => ({ label, val }));
          if (t.status === 'passed') v.run.rBody = 'El disco completó su autoprueba sin errores. El resultado queda en su log de autopruebas.';
        }
      } else if (t.kind === 'bench') {
        const b = this.benchRun[d.id] || { results: [], i: 0, total: 8, secs: 6 };
        const rs: BenchSample[] = b.results;
        const rated = this.state.set.rated?.[d.key] || {};
        v.run.kindLabel = 'Benchmark de lectura/escritura' + (v.run.running && b.cur ? ` · ${b.cur} (${b.i + 1} de ${b.total})` : '');
        v.run.noChart = true;
        v.run.diff = [];
        v.run.hasDiff = false;
        v.run.errors = '0';
        const last = rs[rs.length - 1];
        v.run.speed = last ? nf(last.mbps) : '—';
        v.run.elapsed = fmtClock((Date.now() - (b.started || Date.now())) / 1000);
        v.run.remaining = fmtClock(Math.max(0, (b.total - b.i) * b.secs - (Date.now() - (b.jobStart || Date.now())) / 1000));
        const maxMbps = Math.max(1, ...rs.map((r) => r.mbps));
        const cell = (r, color) => (r ? { val: nf(r.mbps, r.mbps < 100 ? 1 : 0), sub: r.iops >= 1000 && /RND/.test(r.key) ? nf(r.iops) + ' IOPS · ' + nf(r.latUs) + ' µs' : nf(r.latUs / 1000, 2) + ' ms', w: (r.mbps / maxMbps * 100).toFixed(1) + '%', color } : { val: '—', sub: '', w: '0%', color });
        const JOBS = BENCH_PROFILES.flatMap((k) => [false, true].map((w) => ({ key: k, write: w })));
        v.run.bench = {
          running: !!v.run.running,
          i: b.i, total: b.total, secs: b.secs, jobP: v.run.running ? Math.min(1, (Date.now() - (b.jobStart || Date.now())) / 1000 / b.secs) : 1,
          live: b.live, ceiling: d.path?.ceiling ?? null, ssdMax: d.path?.ssd?.mbps ?? null, rated,
          elapsed: v.run.elapsed, remaining: v.run.remaining, temp: v.run.temp,
          jobs: JOBS.map((j, idx) => {
            const r = benchFind(rs, j.key, j.write);
            return { ...j, idx, series: b.series?.[idx] || [], state: r ? 'done' : v.run.running && idx === b.i ? 'running' : 'pending', mbps: r?.mbps ?? null, iops: r?.iops ?? null, latUs: r?.latUs ?? null };
          }),
          rows: BENCH_PROFILES.map((k) => ({ key: k, hint: { 'SEQ1M Q8T1': 'Secuencial · archivos grandes', 'SEQ1M Q1T1': 'Secuencial sin cola', 'RND4K Q32T1': 'Aleatorio · carga intensa', 'RND4K Q1T1': 'Aleatorio · uso diario' }[k],
            r: cell(benchFind(rs, k, false), 'var(--data-speed)'), w: cell(benchFind(rs, k, true), 'var(--accent)') })),
          meta: `fio · archivo temporal de ${b.sizeMib >= 1024 ? b.sizeMib / 1024 + ' GB' : b.sizeMib + ' MB'} en «${b.volume || '—'}» · ${b.secs - 1} s por prueba`,
          path: this.speedPathView(d, rs, v.run.running ? b.live : null),
        };
        if (v.run.done) {
          const vd = benchVerdict(rs, d.path, rated);
          if (t.status === 'passed') {
            v.run.rTitle = vd.title; v.run.rBody = vd.body;
            v.run.rFg = `var(--health-${vd.tone}-fg)`; v.run.rBg = `var(--health-${vd.tone}-bg)`; v.run.rBorder = `var(--health-${vd.tone}-border)`;
            v.run.rIcon = vd.tone === 'warning' ? '#i-alert' : '#i-check-circle';
          } else if (t.status === 'errors') {
            v.run.rTitle = 'El benchmark falló'; v.run.rBody = b.error || 'fio terminó con error.';
          } else {
            v.run.rBody = 'Cancelaste el benchmark. El archivo temporal se borró.';
          }
          const q32r = benchFind(rs, 'RND4K Q32T1', false), q32w = benchFind(rs, 'RND4K Q32T1', true), q1r = benchFind(rs, 'RND4K Q1T1', false);
          v.run.stats = [
            ['Lectura secuencial', vd.seqRead != null ? nf(vd.seqRead) + ' MB/s' : '—'], ['Escritura secuencial', vd.seqWrite != null ? nf(vd.seqWrite) + ' MB/s' : '—'],
            ['4K Q32 lectura', q32r ? nf(q32r.iops) + ' IOPS' : '—'], ['4K Q32 escritura', q32w ? nf(q32w.iops) + ' IOPS' : '—'],
            ['Latencia 4K Q1', q1r ? nf(q1r.latUs) + ' µs' : '—'], ['Techo de la conexión', d.path?.ceiling ? '~' + nf(d.path.ceiling) + ' MB/s' : '—'],
          ].map(([label, val]) => ({ label, val }));
        }
      } else if (t.kind === 'workload') {
        const r = this.workloadResult[d.id];
        v.run.kindLabel = 'Comparación antes/después de una carga';
        v.run.noChart = true;
        if (r) {
          const dW = r.a.writtenTB - r.b.writtenTB, dR = r.a.readTB - r.b.readTB;
          v.run.rTitle = r.newMedia > 0 ? `${r.newMedia} errores de medios nuevos` : 'Sin errores nuevos';
          v.run.rBody = r.newMedia > 0
            ? 'Durante la carga aparecieron errores de integridad no recuperados. Respalda tus datos y ejecuta un escaneo de lectura completo.'
            : `El disco registró la carga correctamente: +${nf(dW, 2)} TB escritos y +${nf(dR, 2)} TB leídos sin errores nuevos.`;
          v.run.stats = [['Duración', r.secs >= 3600 ? `${Math.floor(r.secs / 3600)} h ${Math.floor((r.secs % 3600) / 60)} min` : `${Math.floor(r.secs / 60)} min ${r.secs % 60} s`], ['Escritos', `+${nf(dW, 2)} TB`], ['Leídos', `+${nf(dR, 2)} TB`], ['Errores de medios', `+${Math.max(0, r.newMedia)}`], ['Temperatura', `${r.b.temp} → ${r.a.temp} °C`], ['Apagados inseguros', `+${Math.max(0, r.a.unsafe - r.b.unsafe)}`]].map(([label, val]) => ({ label, val }));
          const row = (label, a, b, bad) => { const ch = a !== b; return { label, a, b, ch, mark: ch ? '↑' : '=', fg: bad && ch ? 'var(--health-critical-fg)' : ch ? 'var(--accent-fg)' : 'var(--text-tertiary)', bg: bad && ch ? 'var(--health-critical-bg)' : ch ? 'var(--accent-soft)' : 'transparent', weight: ch ? 600 : 400 }; };
          v.run.diff = [
            row('Datos escritos', r.b.writtenText, r.a.writtenText), row('Datos leídos', r.b.readText, r.a.readText),
            row('Comandos de escritura', nf(r.b.hostWrites), nf(r.a.hostWrites)), row('Errores de medios', nf(r.b.mediaErr), nf(r.a.mediaErr), true),
            row('Entradas en el log de errores', r.b.errLog == null ? '—' : nf(r.b.errLog), r.a.errLog == null ? '—' : nf(r.a.errLog), true),
            row('Temperatura', r.b.temp + ' °C', r.a.temp + ' °C'), row('Apagados inseguros', nf(r.b.unsafe), nf(r.a.unsafe)), row('Horas de encendido', nf(r.b.hours) + ' h', nf(r.a.hours) + ' h'),
          ];
          v.run.hasDiff = true;
        }
      }
    }
    return v;
  }

  renderVals() {
    const out = super.renderVals();
    const dg = this.state.dialog;
    out.cancelCopy = this.state.test?.kind === 'bench'
      ? { title: '¿Cancelar el benchmark?', body: '. El archivo temporal se borrará.', keep: 'Seguir midiendo', confirm: 'Cancelar benchmark' }
      : null;
    // Reporte rápido: selector de tipo en el constructor, vista previa de 1 hoja y acción del menú ⋯.
    const quick = this.state.repKind === 'quick';
    const segBtnK = (on) => ({ bg: on ? 'var(--surface-raised)' : 'transparent', shadow: on ? 'var(--shadow-1)' : 'none', fg: on ? 'var(--text-primary)' : 'var(--text-secondary)', pressed: on ? 'true' : 'false' });
    out.repKinds = [['full', 'Completo'], ['quick', 'Rápido']].map(([k, l]) => ({ label: l, ...segBtnK((this.state.repKind || 'full') === k), pick: () => this.setState((st) => ({ repKind: k, repPhase: st.repPhase === 'done' ? 'idle' : st.repPhase })) }));
    out.quickMode = quick;
    if (out.previewSrc) out.previewSrc += '&kind=' + (quick ? 'quick' : 'full');
    if (quick) {
      out.repPagesTxt = '1 página · ' + (this.state.repPaper === 'a4' ? 'A4 (210 × 297 mm)' : 'Carta (8.5 × 11 in)');
      out.previewH = (1120 + 40) + 'px';
      out.previewWrapH = Math.round((1120 + 40) * 0.5) + 'px';
    }
    if (out.ctx?.items) {
      const cid = this.state.ctx?.id;
      const at = out.ctx.items.findIndex((x) => x.label === 'Generar reporte');
      out.ctx.items.splice(at + 1, 0, { label: 'Reporte rápido', icon: '#i-bolt', danger: false, fg: 'var(--text-primary)', run: () => this.quickReport(cid) });
    }
    if (out.moreItems && this.state.route?.id) {
      const rid = this.state.route.id;
      out.moreItems.unshift({ label: 'Reporte rápido (PDF)', icon: '#i-bolt', kbd: '', danger: false, fg: 'var(--text-primary)', run: () => { this.setState({ popover: null }); this.quickReport(rid); } });
    }
    this.inventoryVals(out);
    if (this.state.palette) {
      const flat = this.paletteFlat(), s = this.state; let idx = 0;
      out.pgroups = ['Discos', 'Expedientes', 'Acciones', 'Ir a'].map((g) => ({ g, items: flat.filter((i) => i.g === g).map((it) => { const my = idx++; return { ...it, sel: my === s.pi ? 'true' : 'false', bg: my === s.pi ? 'var(--accent)' : 'transparent', fg: my === s.pi ? 'var(--text-on-accent)' : 'var(--text-primary)', subFg: my === s.pi ? 'var(--text-on-accent)' : 'var(--text-tertiary)', go: () => { this.setState({ palette: false }); it.run(); }, hover: () => { if (s.pi !== my) this.setState({ pi: my }); } }; }) })).filter((g) => g.items.length);
      out.pEmpty = flat.length === 0;
    }
    if (out.ctx?.items && this.state.ctx?.id) {
      const cid = this.state.ctx.id, row = this.invFor(this.D(cid));
      const at = out.ctx.items.findIndex((x) => x.label === 'Reporte rápido');
      out.ctx.items.splice(at + 1, 0, row
        ? { label: 'Ver expediente', icon: '#i-folder', danger: false, fg: 'var(--text-primary)', run: () => { this.setState({ ctx: null }); this.openDossier(row.serial); } }
        : { label: 'Agregar al expediente', icon: '#i-folder', danger: false, fg: 'var(--text-primary)', run: () => this.askInventory(cid) });
    }
    if (out.moreItems && this.state.route?.id && out.invAction) {
      const ia = out.invAction;
      out.moreItems.splice(1, 0, { label: ia.label, icon: ia.icon, kbd: '', danger: false, fg: 'var(--text-primary)', run: () => { this.setState({ popover: null }); ia.run(); } });
    }
    out.hasBench = !!dg && dg.kind === 'bench';
    if (out.hasBench) {
      const d = this.D(dg.id);
      const info = this.benchInfo[dg.id];
      const rated = this.state.set.rated?.[d?.key] || {};
      const setRated = (k) => (e) => {
        const n = parseInt(String(e.target.value).replace(/\D/g, ''), 10);
        this.setState((st) => ({ set: { ...st.set, rated: { ...(st.set.rated || {}), [d.key]: { ...((st.set.rated || {})[d.key] || {}), [k]: Number.isFinite(n) && n > 0 ? n : null } } } }));
      };
      const segBtn = (on) => ({ bg: on ? 'var(--surface-raised)' : 'transparent', shadow: on ? 'var(--shadow-1)' : 'none', fg: on ? 'var(--text-primary)' : 'var(--text-secondary)', pressed: on ? 'true' : 'false' });
      const vol = info?.volumes.find((x) => x.id === dg.volume);
      const gb = (b) => nf(b / 1e9, b < 1e11 ? 1 : 0) + ' GB';
      out.bd = {
        model: d?.model || dg.id,
        loading: !!dg.loading,
        noFio: !dg.loading && !!info && !info.fio,
        error: dg.error || '',
        noVolumes: !dg.loading && !!info && !!info.fio && info.volumes.length === 0,
        ready: !dg.loading && !!info?.fio && info.volumes.length > 0,
        fio: info?.version || 'fio',
        volumes: (info?.volumes || []).map((x) => ({ value: x.id, label: `${x.name} · ${x.fs} · ${gb(x.free)} libres` })),
        volume: dg.volume || '',
        onVolume: (e) => this.setState((st) => ({ dialog: { ...st.dialog, volume: e.target.value } })),
        sizes: (info?.sizes || [256, 1024, 4096]).map((n) => ({ label: n >= 1024 ? n / 1024 + ' GB' : n + ' MB', ...segBtn(dg.size === n), pick: () => this.setState((st) => ({ dialog: { ...st.dialog, size: n } })) })),
        where: vol ? (vol.dir === vol.mount ? `«${vol.name}»` : `la carpeta temporal de «${vol.name}»`) : '',
        sizeText: dg.size >= 1024 ? dg.size / 1024 + ' GB' : dg.size + ' MB',
        ratedRead: rated.read ? String(rated.read) : '', ratedWrite: rated.write ? String(rated.write) : '',
        onRatedRead: setRated('read'), onRatedWrite: setRated('write'),
        copyIcon: this.state.copied === 'brew-fio' ? '#i-check' : '#i-copy',
        copy: () => this.copy('brew-fio', 'brew install fio'),
        path: d ? this.speedPathView(d) : null,
        start: this.startBench,
        startOpacity: !dg.loading && !!info?.fio && !!dg.volume ? 1 : 0.4,
      };
    }
    out.hasPermission = !!dg && dg.kind === 'permission';
    out.permApp = import.meta.env.DEV ? 'la Terminal donde ejecutas «pnpm dev»' : 'NVitals Drive';
    out.permOpen = () => api.openPrivacySettings('removable');
    out.permOpenFull = () => api.openPrivacySettings('full');
    out.permRetry = this.retryScan;
    out.authText = this.auth?.touchId
      ? 'macOS te pedirá Touch ID (o tu contraseña) para leer el dispositivo sin procesar.'
      : 'macOS te pedirá tu contraseña de administrador para leer el dispositivo sin procesar.';
    if (dg && dg.kind === 'scan' && dg.scan === 'stress' && out.dlg) {
      out.dlg.title = '¿Iniciar prueba de estrés térmico?';
      out.dlg.dur = `${STRESS_SECONDS / 60} min de lectura sostenida, registrando velocidad y temperatura`;
    }
    const cmd = this.auth?.enableCommand || '';
    out.authRow = this.auth ? {
      on: this.auth.touchId,
      help: this.auth.touchId
        ? 'Las pruebas de lectura se autorizan con tu huella; si Touch ID falla se pide la contraseña.'
        : 'Para usar Touch ID en lugar de la contraseña, ejecuta en Terminal el comando copiado (habilita Touch ID para sudo) y reinicia la app.',
      copy: () => this.copy('auth-cmd', cmd),
      copyIcon: this.state.copied === 'auth-cmd' ? '#i-check' : '#i-copy',
    } : null;
    return out;
  }

  /* ── Pruebas: estimaciones con datos reales ── */
  spec(id, kind) {
    const d = this.D(id);
    const sc = this.data.scans[id];
    const avg = sc?.avg || (d?.conn === 'usb' ? 900 : d?.conn === 'internal' ? 0 : 2800);
    const live = this.scanRun && this.scanRun.id === id ? this.scanRun : null;
    const t = this.state.test;
    // Durante la prueba, la duración se proyecta con el avance real.
    const projected = live && t && t.p > 0.01 ? (Date.now() - live.started) / 1000 / t.p : null;
    const full = { durationSim: projected ?? (sc && !live ? sc.durationSim : Math.max(60, Math.round((d?.bytes || 1e12) / 1e6 / Math.max(avg, 1)))), avg, min: sc?.min || avg, max: sc?.max || avg, maxTemp: live ? live.maxTemp : sc?.maxTemp || d?.temp || 0, zones: live ? live.zones : sc?.zones || [], result: sc?.result || 'passed', before: sc?.before, after: sc?.after };
    if (kind === 'stress') return { ...full, durationSim: projected ?? STRESS_SECONDS, zones: live ? full.zones : [] };
    if (kind === 'quick') return { ...full, durationSim: projected ?? 90, zones: live ? full.zones : full.zones.filter((z, i) => i % 5 === 0) };
    return full;
  }
}
