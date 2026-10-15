// Lógica de la app traducida desde el <script data-dc-script> de
// prototype-design/HealthDiskInfo.dc.html. Construye el view-model (renderVals)
// que consumen las pantallas de src/ui/screens.
// @ts-nocheck — objeto dinámico heredado del prototipo; se tipa progresivamente.
import { Component } from 'react';
import { HDI_MOCK } from './mock/mockData';
import { Motion } from './runtime/motion';
import { AppTemplate } from './screens/AppTemplate';

const TABS = [['overview','Resumen','#i-shield'],['smart','Salud SMART','#i-pulse'],['temperature','Temperatura','#i-thermometer'],['tests','Pruebas','#i-test'],['logs','Registros','#i-log'],['identity','Identidad','#i-id'],['console','Consola','#i-terminal']];
const VERD = { optimal:['Óptimo','#i-shield-check'], good:['Bueno','#i-check-circle'], warning:['Atención','#i-alert'], critical:['Crítico','#i-octagon'], nodata:['Sin datos','#i-circle-dashed'] };
const RANK = { critical:0, warning:1, nodata:2, good:3, optimal:4 };
const CONNI = { thunderbolt:'#i-thunderbolt', usb4:'#i-usb', usb:'#i-usb', internal:'#i-chip' };
const ST = { ok:['Normal','#i-check-circle','optimal'], note:['Nota','#i-info','nodata'], warn:['Atención','#i-alert','warning'], crit:['Crítico','#i-octagon','critical'] };
const nf = (n, d = 0) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const hv = (v, k) => 'var(--health-' + v + '-' + k + ')';
const p2 = n => String(n).padStart(2, '0');
const clockNow = () => { const d = new Date(); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
const fmtClock = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + p2(m) : p2(m)) + ':' + p2(x); };
const fmtMin = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? h + ' h ' + m + ' min' : m ? m + ' min ' + x + ' s' : x + ' s'; };
const norm = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const truncMid = (s, a = 26, b = 30) => s.length > a + b + 1 ? s.slice(0, a) + '…' + s.slice(-b) : s;
const RING = { S: [14, 2], H: [40, 4], M: [64, 6], L: [176, 12] };

export class AppController extends Component<Record<string, never>, any> {
  [key: string]: any;
  /** Datos con la forma del prototipo. Modo mock: los del prototipo; la app real los reemplaza. */
  data = HDI_MOCK;
  state = {
    ready: false, route: { screen: 'onboarding' }, theme: 'dark', wall: 'dark', motion: 'system', transp: 'system', speed: 1,
    scenario: 'mixed', disks: [], view: 'grid', filter: 'all', sort: 'health', sweep: 0, bootAnim: false,
    sel: 0, palette: false, pq: '', pi: 0, toasts: [], scen: false, popover: null, ctx: null, dialog: null, test: null,
    consoleOpen: false, consoleH: 240, cmdLog: [], onb: { mode: 'ok', step: 0 }, onbHelp: false, scrolled: false, raw: false,
    serialShown: false, tempWin: 15, tempInt: 2, tempPaused: false, copied: null, tip: null, tabInd: { x: 0, w: 0 }, tabInstant: false,
    banner: null, unit: 'C', hideInternal: false, reports: null, repDisk: 'disk4', repSecs: ['summary', 'identity', 'smart', 'temp', 'tests', 'logs', 'appendix'], repTech: 'Andrea Castillo', repClient: 'Inventario · lote 38', repNotes: '', repMask: true, repPaper: 'letter', repFormat: 'PDF', repPhase: 'idle', repStep: 0, repFail: false, histSel: 'disk4', cmp: [3, 4], set: { notifConnect: true, notifTest: true, notifCrit: true, keepAwake: true, sound: false, company: 'Laboratorio Castillo', maskDefault: true, thMedia: 10, thSpare: 10, thWarn: 70, thCrit: 80, detecting: false }, cOut: 'view', cOpts: ['-x'], cJson: true, jq: '', collapsed: {}, lockInfo: null, alts: false, now: Date.now()
  };

  D(id) { return this.data.disks.find(d => d.id === id); }
  rt(id) { return this.state.disks.find(d => d.id === id); }
  M() { return Motion; }

  componentDidMount() {
    this.boot();
  }
  componentWillUnmount() {
    ['_tick', '_testT', '_w'].forEach(k => clearInterval(this[k]));
    window.removeEventListener('hashchange', this.onHash); window.removeEventListener('keydown', this.onKey);
    document.removeEventListener('mouseover', this.onOver); document.removeEventListener('mousedown', this.onDown);
  }

  boot() {
    window.addEventListener('hashchange', this.onHash); window.addEventListener('keydown', this.onKey);
    document.addEventListener('mouseover', this.onOver); document.addEventListener('mousedown', this.onDown);
    const saved = (() => { try { return JSON.parse(localStorage.getItem('hdi-proto') || '{}'); } catch (e) { return {}; } })();
    const disks = this.data.disks.map(d => this.mkRt(d.id));
    const log = this.bootLog();
    this.setState({ ready: true, disks, cmdLog: log, theme: saved.theme || 'dark', wall: saved.wall || 'dark', motion: saved.motion || 'system', transp: saved.transp || 'system', speed: saved.speed || 1, route: this.parse() }, () => {
      if (!location.hash || this.state.route.screen === 'onboarding') { if (!location.hash) location.hash = '#/onboarding'; this.runOnboarding(); }
      else this.setState({ sweep: 1 });
    });
    this.startTick();
  }
  persist(p) { this.setState(p, () => { try { const s = this.state; localStorage.setItem('hdi-proto', JSON.stringify({ theme: s.theme, wall: s.wall, motion: s.motion, transp: s.transp, speed: s.speed })); } catch (e) {} }); }

  mkRt(id, phase = 'ready') { const d = this.D(id); const base = d.temp || 0; return { id, phase, temp: base, hist: this.genHist(base, 1800), discAt: 0 }; }
  genHist(base, n) { const a = []; let t = base; for (let i = 0; i < n; i++) { const r = Math.random(); t += r < 0.33 ? -1 : r > 0.66 ? 1 : 0; if (t > base + 2) t = base + 1; if (t < base - 2) t = base - 1; a.push(t); } a[n - 1] = base; return a; }
  bootLog() {
    const M = this.data; const out = [this.logEntry('smartctl --scan-open -j', null, 0, '0.08 s')];
    M.disks.forEach(d => out.push(this.logEntry('smartctl -x -j ' + d.id, d.id, d.exit, (0.14 + Math.random() * 0.2).toFixed(2) + ' s')));
    return out;
  }
  logEntry(cmd, disk, exit, dur) { return { id: Math.random().toString(36).slice(2), t: clockNow(), cmd, disk, exit, dur: dur || (0.12 + Math.random() * 0.25).toFixed(2) + ' s' }; }
  addLog(cmd, disk, exit) { this.setState(s => ({ cmdLog: s.cmdLog.concat([this.logEntry(cmd, disk, exit)]).slice(-200) })); }
  exitChips(code) {
    if (!code) return [{ label: '0 · Sin problemas', fg: hv('optimal', 'fg'), bg: hv('optimal', 'bg') }];
    return this.data.exitBits.filter(b => code & b.bit).map(b => { const tone = b.bit === 2 ? 'nodata' : b.bit === 8 ? 'critical' : 'warning'; return { label: b.bit + ' · ' + b.label, fg: hv(tone, 'fg'), bg: hv(tone, 'bg') }; });
  }

  parse() {
    const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!p[0]) return { screen: 'onboarding' };
    if (p[0] === 'device') return { screen: 'device', id: p[1], tab: TABS.some(t => t[0] === p[2]) ? p[2] : 'overview' };
    return { screen: p[0], sub: p[1] || '' };
  }
  nav(h) { if (location.hash === h) this.onHash(); else location.hash = h; }
  onHash = () => {
    const prev = this.state.route, route = this.parse();
    if (prev.screen === 'device' && route.screen === 'device' && prev.id === route.id && prev.tab !== route.tab) {
      const a = TABS.findIndex(t => t[0] === prev.tab), b = TABS.findIndex(t => t[0] === route.tab); this.tabDir = b > a ? 1 : -1; this.tabChanged = true;
    }
    if (route.screen !== 'device' || prev.id !== route.id) { this.setState({ scrolled: false, banner: null, serialShown: false, jq: '', alts: false }); const sc = document.querySelector('[data-scroller]'); if (sc) sc.scrollTop = 0; }
    this.setState({ route, popover: null, ctx: null });
    if (route.screen === 'onboarding' && prev.screen !== 'onboarding') this.runOnboarding();
  };

  /* ── Onboarding ── */
  runOnboarding() {
    clearTimeout(this._onb); const mode = this.state.onb.mode;
    this.setState({ onb: { mode, step: 0 } });
    const k = this.M().speedK();
    const step = n => { this._onb = setTimeout(() => {
      if (mode === 'missing' && n === 0) { this.setState({ onb: { mode, step: 0, fail: true } }); return; }
      if (mode === 'old' && n === 0) { this.setState({ onb: { mode, step: 0, warnOld: true } }); return; }
      this.setState({ onb: { mode, step: n + 1 } });
      if (n + 1 < 4) step(n + 1); else this._onb = setTimeout(() => this.finishOnboarding(), 900 * k);
    }, 520 * k); };
    step(0);
  }
  continueOld = () => { const mode = this.state.onb.mode; this.setState({ onb: { mode, step: 1, oldAccepted: true } }); let n = 1; const k = this.M().speedK(); const go = () => { this._onb = setTimeout(() => { n++; this.setState(s => ({ onb: { ...s.onb, step: n } })); if (n < 4) go(); else this._onb = setTimeout(() => this.finishOnboarding(), 900 * k); }, 520 * k); }; go(); };
  recheck = () => { this.setState({ onb: { mode: 'ok', step: 0 } }, () => this.runOnboarding()); };
  finishOnboarding() { this.setState({ bootAnim: true, sweep: 0 }); this.nav('#/devices'); setTimeout(() => this.sweepRings(), 120); setTimeout(() => this.setState({ bootAnim: false }), 1400); }
  sweepRings() {
    if (this.M().reduced()) { this.setState({ sweep: 1 }); return; }
    const dur = 900 * this.M().speedK(), t0 = performance.now();
    const f = now => { const x = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - x, 4); this.setState({ sweep: e }); if (x < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }

  /* ── Ticks ── */
  startTick() { clearInterval(this._tick); this._tick = setInterval(this.onTick, this.state.tempInt * 1000); }
  onTick = () => {
    if (this.state.tempPaused) { this.setState({ now: Date.now() }); return; }
    const test = this.state.test; let pulse = null;
    const disks = this.state.disks.map(rt => {
      if (rt.phase !== 'ready') return rt; const d = this.D(rt.id); if (d.nodata) return rt;
      let t = rt.temp;
      const testing = test && test.status === 'running' && test.diskId === rt.id;
      if (!testing) { const r = Math.random(); t += r < 0.33 ? -1 : r > 0.66 ? 1 : 0; if (t > d.temp + 2) t = d.temp + 2 - (t > d.temp + 3 ? 1 : 0); if (t < d.temp - 2) t = d.temp - 2; if (Math.abs(rt.temp - d.temp) > 2) t = rt.temp + (rt.temp > d.temp ? -1 : 1); }
      if ((rt.temp < d.warnT && t >= d.warnT) || (rt.temp < d.critT && t >= d.critT)) pulse = rt.id;
      const hist = rt.hist.slice(rt.hist.length >= 1800 ? 1 : 0); hist.push(t);
      return { ...rt, temp: t, hist };
    });
    this.liveShift = true; this.pulseId = pulse;
    this.setState({ disks, now: Date.now() });
  };

  /* ── Scenarios ── */
  applyScenario = name => {
    const M = this.data; const ids = M.disks.map(d => d.id);
    let disks = ids.map(id => this.mkRt(id)), route = '#/devices', test = null, onb = { mode: 'ok', step: 0 };
    clearInterval(this._testT); clearTimeout(this._onb); clearTimeout(this._disc);
    if (name === 'empty') disks = [];
    if (name === 'loading') disks = ids.map(id => this.mkRt(id, 'identifying'));
    if (name === 'one') disks = [this.mkRt('disk4')];
    if (name === 'nosmartctl') { onb = { mode: 'missing', step: 0 }; route = '#/onboarding'; }
    if (name === 'oldversion') { onb = { mode: 'old', step: 0 }; route = '#/onboarding'; }
    if (name === 'partial') route = '#/device/disk0/logs';
    if (name === 'testRunning') { test = this.newTest('disk4', 'full', 0.34); route = '#/device/disk4/tests'; }
    if (name === 'testOk') { test = this.newTest('disk4', 'full', 1, 'passed'); route = '#/device/disk4/tests'; }
    if (name === 'testErrors') { test = this.newTest('disk5', 'full', 1, 'errors'); route = '#/device/disk5/tests'; }
    if (name === 'reportGenerating') { route = '#/reports/new'; setTimeout(() => { this.setState({ repDisk: 'disk4', repPhase: 'idle' }); this.genReport(); }, 300); }
    if (name === 'testDisconnect') { test = this.newTest('disk5', 'full', 0.4); route = '#/device/disk5/tests'; this._disc = setTimeout(() => this.disconnect('disk5'), 2200); }
    this.setState({ scenario: name, disks, test, onb, sweep: 1, dialog: null, popover: null, banner: null, palette: false }, () => {
      this.nav(route);
      if (test && test.status === 'running') this.runTest();
    });
  };

  /* ── Hot-plug ── */
  connectNext = () => {
    const present = this.state.disks.filter(d => d.phase !== 'gone').map(d => d.id);
    const next = this.data.disks.find(d => !present.includes(d.id)); if (!next) { this.toast({ title: 'Todos los discos simulados ya están conectados', icon: '#i-info' }); return; }
    this.connect(next.id);
  };
  connect(id) {
    const d = this.D(id); const before = this.M().snapshot('[data-flip]');
    this.setState(s => ({ disks: s.disks.filter(x => x.id !== id).concat([this.mkRt(id, 'identifying')]) }), () => {
      this.M().play('[data-flip]', before);
      const card = document.querySelector('[data-card-id="' + id + '"]'); this.M().enter(card, 'materialize');
      this.M().enter(document.querySelector('[data-side-id="' + id + '"]'), 'rise');
      this.toast({ title: 'Disco conectado', body: d.model + ' · ' + d.connLabel, icon: CONNI[d.conn] });
      this.addLog('smartctl --scan-open -j', null, 0);
      setTimeout(() => { this.setState(s => ({ disks: s.disks.map(x => x.id === id ? { ...x, phase: 'ready', fresh: true } : x) })); this.addLog('smartctl -x -j ' + id, id, d.exit); }, 1500 * this.M().speedK());
    });
  }
  disconnectOne = () => {
    const r = this.state.route; const live = this.state.disks.filter(d => d.phase === 'ready' || d.phase === 'identifying');
    const target = r.screen === 'device' && live.some(d => d.id === r.id) ? r.id : (live[live.length - 1] || {}).id;
    if (target) this.disconnect(target);
  };
  disconnect(id, how) {
    const d = this.D(id); const rt = this.rt(id); if (!rt || rt.phase === 'gone') return;
    const t = this.state.test; const interrupted = t && t.status === 'running' && t.diskId === id;
    this.setState(s => ({ disks: s.disks.map(x => x.id === id ? { ...x, phase: 'disconnected', discAt: Date.now() } : x),
      test: interrupted ? { ...s.test, status: 'interrupted' } : s.test,
      dialog: interrupted ? { kind: 'interrupted', id } : s.dialog,
      banner: s.route.screen === 'device' && s.route.id === id ? 'disconnected' : s.banner }));
    if (interrupted) clearInterval(this._testT);
    this.toast(how === 'eject' ? { title: 'Disco expulsado', body: d.model + ' · Ya puedes desconectarlo', icon: '#i-eject' } : { title: 'Disco desconectado', body: d.model, icon: '#i-plug' });
    setTimeout(() => {
      const card = document.querySelector('[data-card-id="' + id + '"]'); const side = document.querySelector('[data-side-id="' + id + '"]');
      Promise.all([this.M().exit(card, 'pop'), this.M().exit(side, 'fade')]).then(() => {
        const before = this.M().snapshot('[data-flip]');
        this.setState(s => ({ disks: s.disks.map(x => x.id === id ? { ...x, phase: 'gone' } : x) }), () => this.M().play('[data-flip]', before));
      });
    }, 1200 * this.M().speedK());
  }

  /* ── Tests ── */
  spec(id, kind) {
    const M = this.data, d = this.D(id), s = M.scans[id];
    const speeds = { disk4: [2870, 2410, 3050, 58], disk6: [2980, 2620, 3120, 72], disk8: [2150, 1880, 2290, 61], disk5: [1742, 38, 2960, 61], disk7: [940, 860, 1010, 0], disk0: [0, 0, 0, 0] };
    const sp = speeds[id]; const full = { durationSim: s ? s.durationSim : Math.round(d.bytes / 1e6 / sp[0]), avg: sp[0], min: sp[1], max: sp[2], maxTemp: sp[3], zones: s ? s.zones : [], result: s ? s.result : 'passed', before: s && s.before, after: s && s.after };
    if (kind === 'quick') return { ...full, durationSim: 90, zones: full.zones.filter((z, i) => i % 5 === 0) };
    return full;
  }
  speedAt(id, kind, q) {
    const sp = this.spec(id, kind); if (sp.zones.some(z => Math.abs(z[0] - q) < 0.0045)) return 38 + Math.round(Math.random() * 18);
    let v = sp.avg + Math.sin(q * 37) * 70 + Math.sin(q * 113) * 45 + (Math.random() - 0.5) * 60 - (q > 0.9 ? (q - 0.9) * 3000 : 0);
    if (id === 'disk5') v = 1900 + Math.sin(q * 29) * 260 + (Math.random() - 0.5) * 120;
    return Math.round(Math.max(sp.min + (id === 'disk5' ? 900 : 0), Math.min(sp.max, v)));
  }
  newTest(id, kind, p = 0, status = 'running') {
    const samples = []; for (let q = 0; q <= p; q += 0.004) samples.push([q, this.speedAt(id, kind, q)]);
    const sp = this.spec(id, kind);
    return { diskId: id, kind, p, status, samples, errors: sp.zones.filter(z => z[0] <= p).length };
  }
  runTest() { clearInterval(this._testT); this._testT = setInterval(() => this.testStep(), 250); }
  testStep() {
    const t = this.state.test; if (!t || t.status !== 'running') { clearInterval(this._testT); return; }
    const sp = this.spec(t.diskId, t.kind), d = this.D(t.diskId);
    const p = Math.min(1, t.p + 2.5 / sp.durationSim);
    const samples = t.samples.concat([[p, this.speedAt(t.diskId, t.kind, p)]]);
    const errors = sp.zones.filter(z => z[0] <= p).length;
    const target = d.temp ? Math.round(d.temp + (sp.maxTemp - d.temp) * (1 - Math.exp(-p * 3.2)) / (1 - Math.exp(-3.2))) : 0;
    const done = p >= 1;
    this.setState(s => ({ test: { ...t, p, samples, errors, status: done ? sp.result : 'running' }, disks: s.disks.map(x => x.id === t.diskId && d.temp ? { ...x, temp: target } : x) }), () => {
      if (done) {
        clearInterval(this._testT);
        const ok = sp.result === 'passed';
        this.toast({ title: 'Prueba completada', body: d.short + ' · ' + (ok ? 'Aprobado' : 'Con errores: ' + sp.zones.length + ' zonas ilegibles'), icon: ok ? '#i-check-circle' : '#i-alert' });
        this.addLog((t.kind === 'full' ? 'hdi-scan --full ' : 'hdi-scan --sample 2% ') + t.diskId, t.diskId, 0);
        setTimeout(() => this.M().pulse(document.querySelector('[data-test-result-icon]')), 60);
        this.notify('NVitals Drive', 'Prueba completada · ' + d.short);
      }
    });
  }
  askScan(kind) { this.setState({ dialog: { kind: 'scan', scan: kind, id: this.state.route.id } }); }
  startScan = () => {
    const dg = this.state.dialog; this.setState({ dialog: { ...dg, kind: 'auth' } });
  };
  authOk = () => {
    const dg = this.state.dialog; this.setState({ dialog: null, test: this.newTest(dg.id, dg.scan, 0) }, () => this.runTest());
    this.addLog('smartctl -x -j ' + dg.id + '   # instantánea previa', dg.id, this.D(dg.id).exit);
  };
  cancelTest = () => { clearInterval(this._testT); this.setState(s => ({ dialog: null, test: s.test ? { ...s.test, status: 'cancelled' } : null })); };
  resetTest = () => this.setState({ test: null });

  /* ── Refresh ── */
  rescan = () => {
    const icon = document.querySelector('[data-refresh-icon]');
    if (icon && !this.M().reduced()) icon.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 520 * this.M().speedK(), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    const r = this.state.route;
    if (r.screen === 'device') { this.addLog('smartctl -x -j ' + r.id, r.id, this.D(r.id).exit); this.onTick(); setTimeout(() => document.querySelectorAll('[data-flash]').forEach(el => this.M().flash(el)), 30); }
    else { this.addLog('smartctl --scan-open -j', null, 0); }
  };

  /* ── Toasts ── */
  toast(t) {
    const id = (this._tid = (this._tid || 0) + 1);
    this.setState(s => ({ toasts: s.toasts.concat([{ ...t, id }]).slice(-4) }));
    this.armToast(id, 4500);
  }
  armToast(id, ms) { this._tt = this._tt || {}; clearTimeout(this._tt[id]); this._tt[id] = setTimeout(() => this.dismissToast(id), ms * this.M().speedK()); }
  dismissToast(id) {
    const el = document.querySelector('[data-toast-id="' + id + '"]');
    this.M().exit(el, 'toast').then(() => this.setState(s => ({ toasts: s.toasts.filter(t => t.id !== id) })));
  }
  toastDown(id, e) {
    const el = e.currentTarget; const x0 = e.clientX; let dx = 0; clearTimeout(this._tt[id]);
    const mv = ev => { dx = Math.max(0, ev.clientX - x0); el.style.transform = 'translateX(' + dx + 'px)'; el.style.opacity = String(1 - Math.min(0.8, dx / 240)); };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (dx > 80) { el.animate([{ transform: 'translateX(' + dx + 'px)', opacity: el.style.opacity }, { transform: 'translateX(120%)', opacity: 0 }], { duration: 160 * this.M().speedK(), easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }).finished.then(() => this.setState(s => ({ toasts: s.toasts.filter(t => t.id !== id) })));
      } else { el.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 300 * this.M().speedK(), easing: this.M().spring({ bounce: 0.15, duration: 0.3 }) }); el.style.transform = ''; el.style.opacity = ''; this.armToast(id, 2500); } };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }

  /* ── Pointer / keyboard globals ── */
  onOver = e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null; if (el === this.tipEl) return;
    this.tipEl = el; clearTimeout(this._tipT);
    if (!el) { this.lastTip = Date.now(); if (this.state.tip) this.setState({ tip: null }); return; }
    const show = () => { const r = el.getBoundingClientRect(); this.setState({ tip: { text: el.getAttribute('data-tip'), x: Math.round(r.left + r.width / 2), y: Math.round(r.bottom + 6) } }); };
    if (this.state.tip || Date.now() - (this.lastTip || 0) < 700) show(); else this._tipT = setTimeout(show, 500);
  };
  onDown = e => {
    if (!e.target.closest) return;
    if ((this.state.popover || this.state.ctx) && !e.target.closest('[data-popover],[data-popover-trigger]')) this.setState({ popover: null, ctx: null });
  };
  onKey = e => {
    const s = this.state, mod = e.metaKey || e.ctrlKey, k = e.key, inField = /input|textarea/i.test((e.target.tagName || ''));
    if (mod && k.toLowerCase() === 'k') { e.preventDefault(); this.setState({ palette: !s.palette, pq: '', pi: 0 }, () => { const i = document.querySelector('[data-palette-input]'); if (i) i.focus(); }); return; }
    if (s.palette) {
      const items = this.paletteFlat();
      if (k === 'Escape') { e.preventDefault(); this.setState({ palette: false }); }
      else if (k === 'ArrowDown') { e.preventDefault(); this.setState({ pi: Math.min(items.length - 1, s.pi + 1) }); }
      else if (k === 'ArrowUp') { e.preventDefault(); this.setState({ pi: Math.max(0, s.pi - 1) }); }
      else if (k === 'Enter') { e.preventDefault(); const it = items[s.pi]; this.setState({ palette: false }); if (it) it.run(); }
      return;
    }
    if (k === 'Escape') { if (s.dialog) this.setState({ dialog: null }); else if (s.popover || s.ctx) this.setState({ popover: null, ctx: null }); else if (s.scen) this.setState({ scen: false }); else if (s.route.screen === 'device') this.goBack(); return; }
    if (e.shiftKey && k === 'D' && !inField && !mod) { this.setState({ scen: !s.scen }); return; }
    if (mod && k.toLowerCase() === 'r') { e.preventDefault(); this.rescan(); return; }
    if (mod && k.toLowerCase() === 'j') { e.preventDefault(); this.toggleConsole(); return; }
    if (mod && k.toLowerCase() === 'e') { e.preventDefault(); this.report(); return; }
    if (mod && k === ',') { e.preventDefault(); this.nav('#/settings'); return; }
    if (mod && /^[1-7]$/.test(k) && s.route.screen === 'device') { e.preventDefault(); this.setState({ tabInstant: true }); this.kbTab = true; this.nav('#/device/' + s.route.id + '/' + TABS[+k - 1][0]); return; }
    if (s.route.screen === 'devices' && !inField && (k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowLeft')) {
      e.preventDefault(); const n = this.visibleCards().length; if (!n) return; const step = (k === 'ArrowDown' || k === 'ArrowRight') ? 1 : -1; this.setState({ sel: (s.sel + step + n) % n }); return;
    }
    if (s.route.screen === 'devices' && k === 'Enter' && !inField) { const c = this.visibleCards()[s.sel]; if (c && c.phase !== 'identifying') this.openDisk(c.id); }
  };

  /* ── Navigation w/ shared element ── */
  openDisk(id, tab) {
    const ring = document.querySelector('[data-ring-for="' + id + '"]');
    this.pendingShared = ring ? ring.getBoundingClientRect() : null; this.sharedFrom = 'card';
    this.nav('#/device/' + id + '/' + (tab || 'overview'));
  }
  goBack = () => {
    const r = this.state.route; const ring = document.querySelector('[data-shared="hdr-ring"]');
    this.pendingBack = ring && r.id ? { rect: ring.getBoundingClientRect(), id: r.id } : null; this.nav('#/devices');
  };
  report = () => { const r = this.state.route; const first = this.state.disks.find(x => x.phase === 'ready' && !this.D(x.id).nodata); this.reportFor(r.screen === 'device' ? r.id : (first ? first.id : 'disk4')); };
  reportFor(id) { this.setState({ repDisk: id, repPhase: 'idle', repStep: 0, repMask: this.state.set.maskDefault, popover: null, ctx: null }); this.nav('#/reports/new'); setTimeout(() => this.M().enter(document.querySelector('[data-paper]'), 'paper'), 40); }
  genReport = () => {
    if (this.state.repPhase === 'generating') return;
    const k = this.M().speedK(); this.setState({ repPhase: 'generating', repStep: 0 });
    const step = n => setTimeout(() => {
      if (n === 3 && this.state.repFail) { this.setState({ repPhase: 'error', repStep: 3 }); return; }
      this.setState({ repStep: n + 1 });
      if (n < 3) step(n + 1);
      else setTimeout(() => {
        const d = this.D(this.state.repDisk), s = this.state; const id = 'HDI-20260924-0' + (143 + (s.reports || this.data.reports).length - 4);
        const rep = { id, disk: d.id, date: '24 sep 2026, 11:' + String(2 + (s.reports || []).length).padStart(2, '0'), verdict: d.verdict, format: s.repFormat, pages: this.repPages(), client: s.repClient, file: id + ' ' + d.short + '.' + s.repFormat.toLowerCase(), fresh: true };
        this.setState(st => ({ repPhase: 'done', reports: [rep].concat(st.reports || this.data.reports) }));
        this.toast({ title: 'Reporte guardado', body: rep.file, icon: '#i-check-circle' });
        this.addLog('hdi-report --format ' + s.repFormat.toLowerCase() + ' ' + d.id, d.id, 0);
        this.M().enter(document.querySelector('[data-paper]'), 'paper');
      }, 350 * k);
    }, 520 * k);
    step(0);
  };
  repPages() { const s = this.state.repSecs; return 2 + (s.includes('smart') ? 1 : 0) + (s.includes('temp') || s.includes('tests') ? 1 : 0); }
  deleteReport(id) { const el = document.querySelector('[data-report-id="' + id + '"]'); const before = this.M().snapshot('[data-report-id]'); this.M().exit(el, 'fade').then(() => { this.setState(s => ({ reports: (s.reports || this.data.reports).filter(r => r.id !== id) })); this.toast({ title: 'Reporte eliminado', body: id, icon: '#i-trash' }); }); }
  setSet(p) { this.setState(s => ({ set: { ...s.set, ...p } })); }
  toggleConsole = () => this.setState(s => ({ consoleOpen: !s.consoleOpen }), () => { if (this.state.consoleOpen) this.M().enter(document.querySelector('[data-console-drawer]'), 'drawer'); });
  closeConsole = () => { const el = document.querySelector('[data-console-drawer]'); if (!el || this.M().reduced()) { this.setState({ consoleOpen: false }); return; } el.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 225 * this.M().speedK(), easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' }).finished.then(() => this.setState({ consoleOpen: false })); };
  consoleDrag = e => { const y0 = e.clientY, h0 = this.state.consoleH; const mv = ev => this.setState({ consoleH: Math.max(140, Math.min(560, h0 + (y0 - ev.clientY))) }); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };

  setTheme(t) {
    const run = () => new Promise(r => this.persist({ theme: t }) || setTimeout(r, 30));
    if (document.startViewTransition && !this.M().reduced()) document.startViewTransition(run); else this.persist({ theme: t });
  }
  copy(key, text) { try { navigator.clipboard.writeText(text); } catch (e) {} this.setState({ copied: key }); clearTimeout(this._cp); this._cp = setTimeout(() => this.setState({ copied: null }), 1400); }

  componentDidUpdate() {
    const M = this.M(); if (!M) return;
    const ps = this._ps || { route: this.state.route, tempInt: this.state.tempInt };
    this._ps = { route: this.state.route, tempInt: this.state.tempInt };
    document.querySelectorAll('[data-anim]:not([data-anim-done])').forEach(el => { const a = el.getAttribute('data-anim'); el.setAttribute('data-anim-done', ''); if (a) M.enter(el, a, { delay: +(el.getAttribute('data-anim-delay') || 0) }); });
    const r = this.state.route;
    if (this.pendingShared !== undefined && r.screen === 'device' && ps.route.screen !== 'device') {
      M.shared(this.pendingShared, document.querySelector('[data-shared="hdr-ring"]'));
      M.enter(document.querySelector('[data-detail-body]'), 'fade'); M.enter(document.querySelector('[data-detail-title]'), 'fade');
      this.pendingShared = undefined;
    }
    if (this.pendingBack && r.screen === 'devices' && ps.route.screen === 'device') {
      M.shared(this.pendingBack.rect, document.querySelector('[data-ring-for="' + this.pendingBack.id + '"]'));
      M.enter(document.querySelector('[data-devices-body]'), 'fade'); this.pendingBack = null;
    }
    if (this.tabChanged) { this.tabChanged = false; const el = document.querySelector('[data-tab-panel]'); if (el && !this.kbTab && !M.reduced()) el.animate([{ opacity: 0, transform: 'translateX(' + (8 * this.tabDir) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: M.ms('--dur-base', 220), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }); this.kbTab = false; }
    const bar = document.querySelector('[data-tabbar]');
    if (bar) { const a = bar.querySelector('[data-tab-active="true"]'); if (a) { const x = a.offsetLeft, w = a.offsetWidth; if (x !== this.state.tabInd.x || w !== this.state.tabInd.w) this.setState({ tabInd: { x, w } }); else if (this.state.tabInstant) setTimeout(() => this.setState({ tabInstant: false }), 30); } }
    if (this.liveShift) { this.liveShift = false; if (!M.reduced() && !this.state.tempPaused) document.querySelectorAll('[data-live-path]').forEach(g => { const dx = +g.getAttribute('data-dx') || 0; g.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: this.state.tempInt * 1000, easing: 'linear' }); }); }
    if (this.pulseId) { M.pulse(document.querySelector('[data-temp-badge="' + this.pulseId + '"]')); this.pulseId = null; }
    if (ps.tempInt !== this.state.tempInt) this.startTick();
    const fr = this.state.disks.find(d => d.fresh); if (fr) { this.setState(s => ({ disks: s.disks.map(x => x.fresh ? { ...x, fresh: false } : x) })); }
  }

  /* ── Ganchos: comportamiento del prototipo; la app real (RealAppController) los reemplaza ── */
  execConsole(d, c) { this.addLog(c, d.id, d.exit); this.setState(st => ({ cOut: c.includes(' -j') ? st.cOut : 'text' })); }
  openReport(rp) { window.open('report.html#disk=' + rp.disk + '&id=' + rp.id, '_blank'); }
  finderReport(rp) { this.toast({ title: 'Mostrar en Finder', body: '~/Documents/NVitals Drive/' + rp.file, icon: '#i-folder' }); }
  showFinder() { this.toast({ title: 'Mostrar en Finder', body: '~/Documents/NVitals Drive/', icon: '#i-folder' }); }
  exportHistory() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(this.data.hist, null, 2)], { type: 'application/json' })); a.download = 'healthdiskinfo-historial.json'; a.click(); }
  exportCsv(d, rt) { const rows = ['segundos_atras,temperatura_c'].concat(rt.hist.map((v, i) => ((rt.hist.length - 1 - i) * this.state.tempInt) + ',' + v)); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'temperatura-' + d.id + '.csv'; a.click(); }
  deleteHistory() { this.setState({ dialog: null }); this.toast({ title: 'Historial borrado', body: 'Se eliminaron las instantáneas guardadas.', icon: '#i-trash' }); }
  redetect() { this.setSet({ detecting: true }); setTimeout(() => { this.setSet({ detecting: false }); this.toast({ title: 'smartctl detectado', body: '/opt/homebrew/bin/smartctl · 7.5', icon: '#i-check-circle' }); this.addLog('smartctl --version', null, 0); }, 900 * this.M().speedK()); }
  onbStepTexts(o, liveRt) { return [['smartctl encontrado', o.warnOld ? '/opt/homebrew/bin/smartctl · versión 7.2' : '/opt/homebrew/bin/smartctl · versión 7.5'], ['Salida JSON soportada', 'smartctl --json --version'], ['Acceso a datos SMART sin privilegios', 'Lectura NVMe a través de IOKit'], [liveRt.length + ' dispositivos detectados', 'smartctl --scan-open -j']]; }
  smartctlBadge(s) { return { smartctlStatus: s.onb.mode === 'missing' ? 'smartctl no encontrado' : 'smartctl 7.5 · listo', smartctlDot: s.onb.mode === 'missing' ? hv('critical', 'solid') : hv('optimal', 'solid'), smartctlTip: '/opt/homebrew/bin/smartctl · smartmontools 7.5' }; }
  notify(title, body) { try { if (window.Notification && Notification.permission === 'granted') new Notification(title, { body }); } catch (e) {} }

  /* ── View builders ── */
  cap(d) { return d.capacityTB >= 1 ? nf(d.capacityTB, d.capacityTB % 1 ? 1 : 0) + ' TB' : nf(d.capacityTB * 1000) + ' GB'; }
  ring(size, pct) { const [s, w] = RING[size]; const r = (s - w) / 2, c = 2 * Math.PI * r; return { c: c.toFixed(2), off: (c * (1 - (pct * this.state.sweep) / 100)).toFixed(2) }; }
  tU(c, short) { const F = this.state.unit === 'F'; const v = F ? Math.round(c * 9 / 5 + 32) : c; return short ? v + '°' : v + (F ? ' °F' : ' °C'); }
  tempState(d, t) { return t >= d.critT ? 'critical' : t >= d.warnT ? 'warning' : 'normal'; }
  tempFg(st) { return st === 'normal' ? 'var(--text-primary)' : hv(st, 'fg'); }
  spark(arr, w, h) { if (!arr || arr.length < 2) return ''; const mn = Math.min(...arr) - 1, mx = Math.max(...arr) + 1; return arr.map((v, i) => (i ? 'L' : 'M') + (i * w / (arr.length - 1)).toFixed(1) + ' ' + (h - (v - mn) / (mx - mn) * h).toFixed(1)).join(' '); }
  visibleCards() {
    const s = this.state; let list = s.disks.filter(x => x.phase !== 'gone').map(x => ({ ...x, d: this.D(x.id) })).filter(x => !(s.hideInternal && x.d.internal));
    if (s.filter === 'external') list = list.filter(x => !x.d.internal); if (s.filter === 'internal') list = list.filter(x => x.d.internal);
    const sorters = { health: (a, b) => RANK[a.d.verdict] - RANK[b.d.verdict], name: (a, b) => a.d.model.localeCompare(b.d.model), temp: (a, b) => (b.temp || -1) - (a.temp || -1) };
    return list.slice().sort(sorters[s.sort]);
  }
  verdictBits(v) { return { vLabel: VERD[v][0], vIcon: VERD[v][1], vFg: hv(v, 'fg'), vBg: hv(v, 'bg'), vBorder: hv(v, 'border'), vSolid: hv(v, 'solid') }; }

  cardView(x, i) {
    const s = this.state, d = x.d, t = Math.round(x.temp), tst = d.nodata ? 'normal' : this.tempState(d, t);
    const testing = s.test && s.test.status === 'running' && s.test.diskId === d.id; const disc = x.phase === 'disconnected';
    const secs = disc ? Math.max(1, Math.round((s.now - x.discAt) / 1000)) : 0;
    return {
      id: d.id, model: d.model, cap: this.cap(d), diskId: d.id, ...this.verdictBits(d.verdict),
      state: x.phase === 'identifying' ? 'identifying' : disc ? 'disconnected' : d.verdict, conn: d.connLabel, connIcon: CONNI[d.conn],
      link: d.nodata ? (d.bridge || d.linkShort || '').replace('Puente USB ', '') : d.linkShort, internal: !!d.internal,
      ring: this.ring('M', d.nodata ? 0 : d.life), lifeNum: d.nodata ? '—' : String(Math.round(d.life * s.sweep)), pctSign: d.nodata ? '' : '%',
      temp: d.nodata ? '—' : this.tU(t), tempFg: this.tempFg(tst), spark: d.nodata ? '' : this.spark(x.hist.slice(-30), 56, 16),
      written: d.writtenText || '—', hours: d.hours ? nf(d.hours) + ' h' : '—', reason: d.reason,
      identifying: x.phase === 'identifying', ready: x.phase !== 'identifying' && !d.nodata, nodata: x.phase !== 'identifying' && !!d.nodata,
      disconnected: disc, discText: 'Desconectado hace ' + secs + ' s',
      filter: disc ? 'grayscale(1)' : 'none', opacity: disc ? 0.55 : 1,
      shadow: s.sel === i && s.route.screen === 'devices' ? '0 0 0 2px var(--accent), var(--shadow-1)' : 'var(--shadow-1)',
      anim: s.bootAnim ? 'rise' : '', delay: Math.min(i, 5) * 40, contentAnim: x.fresh ? 'fade' : '',
      testing, testPct: testing ? Math.floor(s.test.p * 100) + ' %' : '', testScale: testing ? s.test.p : 0,
      aria: d.model + ', ' + VERD[d.verdict][0] + (d.nodata ? '' : ', vida útil ' + d.life + ' %, ' + t + ' grados'),
      open: () => { if (x.phase === 'identifying') return; this.setState({ sel: i }); this.openDisk(d.id); },
      ctx: e => { e.preventDefault(); this.setState({ ctx: { x: e.clientX, y: e.clientY, id: d.id } }); },
      alts: e => { e.stopPropagation(); this.openDisk(d.id); this.setState({ alts: true }); }
    };
  }

  paletteAll() {
    const s = this.state, r = s.route, items = [], live = s.disks.filter(x => x.phase === 'ready').map(x => this.D(x.id));
    const cur = r.screen === 'device' ? this.D(r.id) : null;
    live.forEach(d => items.push({ g: 'Discos', label: d.model, sub: d.connLabel + ' · ' + VERD[d.verdict][0], icon: '#i-ssd', kbd: '', run: () => this.openDisk(d.id) }));
    if (cur) {
      items.push({ g: 'Acciones', label: 'Iniciar escaneo rápido', sub: cur.short, icon: '#i-sample', kbd: '', run: () => { this.nav('#/device/' + cur.id + '/tests'); setTimeout(() => this.askScan('quick'), 50); } });
      TABS.forEach((t, i) => items.push({ g: 'Ir a', label: 'Ir a ' + t[1], sub: cur.short, icon: t[2], kbd: '⌘' + (i + 1), run: () => this.nav('#/device/' + cur.id + '/' + t[0]) }));
    }
    live.forEach(d => items.push({ g: 'Acciones', label: 'Generar reporte de ' + d.model, sub: '', icon: '#i-report', kbd: cur && cur.id === d.id ? '⌘E' : '', run: () => this.reportFor(d.id) }));
    items.push({ g: 'Acciones', label: 'Re-escanear', sub: 'Buscar discos y actualizar datos', icon: '#i-refresh', kbd: '⌘R', run: this.rescan });
    items.push({ g: 'Acciones', label: s.consoleOpen ? 'Ocultar consola' : 'Mostrar consola', sub: '', icon: '#i-terminal', kbd: '⌘J', run: this.toggleConsole });
    items.push({ g: 'Acciones', label: 'Cambiar a tema ' + (s.theme === 'light' ? 'oscuro' : 'claro'), sub: '', icon: s.theme === 'light' ? '#i-moon' : '#i-sun', kbd: '', run: () => this.setTheme(s.theme === 'light' ? 'dark' : 'light') });
    items.push({ g: 'Ir a', label: 'Dispositivos', sub: '', icon: '#i-grid', kbd: '', run: () => this.nav('#/devices') });
    items.push({ g: 'Ir a', label: 'Reportes', sub: '', icon: '#i-report', kbd: '', run: () => this.nav('#/reports') });
    items.push({ g: 'Ir a', label: 'Historial', sub: '', icon: '#i-history', kbd: '', run: () => this.nav('#/history') });
    items.push({ g: 'Ir a', label: 'Ajustes', sub: '', icon: '#i-settings', kbd: '⌘,', run: () => this.nav('#/settings') });
    const q = norm(s.pq.trim()); return q ? items.filter(it => norm(it.label + ' ' + it.sub).includes(q)) : items;
  }
  paletteFlat() { const all = this.paletteAll(); const order = ['Discos', 'Acciones', 'Ir a']; return order.flatMap(g => all.filter(i => i.g === g)); }

  /* Detail builders */
  alertsFor(d) {
    const A = [], act = (tone, title, body, action) => A.push({ tone, title, body, action, ...this.verdictBits(tone), icon: VERD[tone] ? VERD[tone][1] : '#i-info' });
    if (d.nodata) return A;
    if (d.critWarn & 1) act('critical', 'Repuesto por debajo del umbral', 'El repuesto disponible (' + d.spare + ' %) está por debajo del umbral del fabricante (' + d.spareTh + ' %). El disco ya no puede reasignar bloques dañados con seguridad.', 'Respalda tus datos ahora');
    if (d.critWarn & 4) act('critical', 'Fiabilidad degradada', 'El controlador reporta la advertencia crítica 0x' + p2(d.critWarn.toString(16)) + ': la fiabilidad del subsistema NVM está degradada por errores de medios.', 'Reemplaza el disco');
    if (d.mediaErr >= 10) act('critical', d.mediaErr + ' errores de medios', 'Se registraron ' + d.mediaErr + ' errores de integridad de datos no recuperados. Algunos archivos podrían estar dañados.', 'Verifica tus respaldos');
    else if (d.mediaErr > 0) act('warning', d.mediaErr + ' errores de medios', 'El disco registró ' + d.mediaErr + ' errores de lectura no recuperados. Aún funciona, pero la tendencia es relevante.', 'Respalda tus datos');
    if (d.life <= 20 && !(d.critWarn)) act('warning', d.life + ' % de vida útil restante', 'El fabricante estima que queda ' + d.life + ' % de la resistencia a escritura (' + d.writtenText + ' escritos).', 'Planifica su reemplazo');
    const notes = [];
    if (d.unsafe > 0) notes.push(nf(d.unsafe) + ' apagados inseguros');
    if (d.warnTime > 0) notes.push(nf(d.warnTime) + ' min históricos sobre la temperatura de advertencia');
    if (d.errLog > 0 && d.mediaErr === 0) notes.push(nf(d.errLog) + ' entradas en el log de errores');
    if (d.errLogUnavailable) notes.push('El log de errores no se puede leer en este disco');
    notes.forEach(n => A.push({ tone: 'info', title: n, body: 'Nota informativa: no cambia el veredicto.', action: '', vFg: 'var(--text-secondary)', vBg: 'var(--surface-hover)', vBorder: 'var(--border-subtle)', icon: '#i-info', isNote: true }));
    return A;
  }
  tilesFor(d, rt) {
    const t = Math.round(rt.temp), tst = this.tempState(d, t);
    const st = k => ({ stIcon: ST[k][1], stFg: hv(ST[k][2], 'fg'), stLabel: ST[k][0] });
    const lifeK = d.verdict === 'critical' && d.life <= 20 ? 'warn' : d.life <= 20 ? 'warn' : 'ok';
    const spareK = d.spare < d.spareTh ? 'crit' : (d.spare < 100 && d.spare - d.spareTh <= 10) ? 'warn' : 'ok';
    const medK = d.mediaErr >= 10 ? 'crit' : d.mediaErr > 0 ? 'warn' : 'ok';
    return [
      { key: 'life', icon: '#i-shield', label: 'Vida útil restante', value: String(d.life), unit: '%', ctx: d.used + ' % usado (Percentage Used)', ...st(lifeK), meter: true, mPct: d.life + '%', mFill: hv(d.verdict, 'solid'), mTh: 'none', span: 'span 1' },
      { key: 'spare', icon: '#i-shield-check', label: 'Repuesto disponible', value: String(d.spare), unit: '%', ctx: 'Umbral del fabricante: ' + d.spareTh + ' %', ...st(spareK), meter: true, mPct: d.spare + '%', mFill: spareK === 'crit' ? hv('critical', 'solid') : spareK === 'warn' ? hv('warning', 'solid') : 'var(--accent)', mTh: 'block', mThLeft: d.spareTh + '%', span: 'span 1' },
      { key: 'written', icon: '#i-download', label: 'Datos escritos', value: d.writtenText.replace(' TB', ''), unit: 'TB', ctx: 'Leídos: ' + d.readText, ...st('ok'), noSt: true, span: 'span 1' },
      { key: 'hours', icon: '#i-clock', label: 'Horas de encendido', value: nf(d.hours), unit: 'h', ctx: '≈' + nf(Math.round(d.hours / 24)) + ' días', ...st('ok'), noSt: true, span: 'span 1' },
      { key: 'cycles', icon: '#i-power', label: 'Ciclos de encendido', value: nf(d.cycles), unit: '', ctx: nf(d.unsafe) + ' apagados inseguros', ...st(d.unsafe > 0 ? 'note' : 'ok'), span: 'span 1' },
      { key: 'media', icon: '#i-alert', label: 'Errores de medios', value: nf(d.mediaErr), unit: '', ctx: d.errLogUnavailable ? 'Log de errores no disponible' : nf(d.errLog) + ' entradas en el log', ...st(medK), span: 'span 1' },
      { key: 'temp', icon: '#i-thermometer', label: 'Temperatura', value: this.tU(t, true).replace('°', ''), unit: this.state.unit === 'F' ? '°F' : '°C', ctx: (d.estThresholds ? 'Umbrales estimados ' : 'Umbrales ') + this.tU(d.warnT, true) + ' / ' + this.tU(d.critT), ...st(tst === 'normal' ? 'ok' : tst === 'warning' ? 'warn' : 'crit'), spark: this.spark(rt.hist.slice(-60), 180, 28), span: 'span 2', flash: true }
    ].map(x => ({ meter: false, spark: '', noSt: false, mTh: 'none', mThLeft: '0%', flash: false, ...x, hasSpark: !!x.spark, showSt: !x.noSt }));
  }
  smartGroups(d, rt) {
    const t = Math.round(rt.temp);
    const row = (name, val, unit, raw, key, stK, help) => ({ name, val, unit, raw, key, help, stLabel: ST[stK][0], stIcon: ST[stK][1], stFg: hv(ST[stK][2], 'fg') });
    const spareK = d.spare < d.spareTh ? 'crit' : (d.spare < 100 && d.spare - d.spareTh <= 10) ? 'warn' : 'ok';
    const failed = d.critWarn > 0;
    return [
      { title: 'Desgaste', rows: [
        row('Vida útil restante', String(d.life), '%', String(100 - d.used), '100 − percentage_used', d.life <= 20 ? 'warn' : 'ok', 'Estimación del fabricante de cuánta resistencia a escritura le queda al disco. Se calcula como 100 menos «Percentage Used».'),
        row('Porcentaje usado', String(d.used), '%', String(d.used), 'percentage_used', d.used >= 80 ? 'warn' : 'ok', 'Porcentaje de la resistencia nominal ya consumida. Puede superar 100 % y el disco seguir funcionando.'),
        row('Repuesto disponible', String(d.spare), '%', String(d.spare), 'available_spare', spareK, 'Bloques de reserva que el disco usa para reemplazar celdas dañadas. Si baja del umbral, el disco entra en estado crítico.'),
        row('Umbral de repuesto', String(d.spareTh), '%', String(d.spareTh), 'available_spare_threshold', 'ok', 'Nivel mínimo de repuesto definido por el fabricante.')
      ] },
      { title: 'Uso', rows: [
        row('Datos escritos', d.writtenText.replace(' TB', ''), 'TB', nf(d.duWritten), 'data_units_written', 'ok', 'Total escrito por el sistema. Una «data unit» equivale a 512,000 bytes.'),
        row('Datos leídos', d.readText.replace(' TB', ''), 'TB', nf(d.duRead), 'data_units_read', 'ok', 'Total leído por el sistema, en unidades de 512,000 bytes.'),
        row('Comandos de escritura', nf(d.hostWrites), '', nf(d.hostWrites), 'host_writes', 'ok', 'Número de comandos de escritura completados por el controlador.'),
        row('Comandos de lectura', nf(d.hostReads), '', nf(d.hostReads), 'host_reads', 'ok', 'Número de comandos de lectura completados por el controlador.'),
        row('Tiempo ocupado del controlador', nf(d.busy), 'min', nf(d.busy), 'controller_busy_time', 'ok', 'Minutos que el controlador pasó atendiendo comandos de E/S.')
      ] },
      { title: 'Integridad', rows: [
        row('Estado SMART general', failed ? 'Fallido' : 'Aprobado', '', failed ? 'false' : 'true', 'smart_status.passed', failed ? 'crit' : 'ok', 'Autoevaluación global del disco. Falla si hay alguna advertencia crítica activa.'),
        row('Advertencia crítica', '0x' + p2(d.critWarn.toString(16).toUpperCase()), '', String(d.critWarn), 'critical_warning', d.critWarn ? 'crit' : 'ok', 'Máscara de 6 banderas que el controlador activa ante condiciones graves. Ver el desglose abajo.'),
        row('Errores de medios y de integridad', nf(d.mediaErr), '', String(d.mediaErr), 'media_errors', d.mediaErr >= 10 ? 'crit' : d.mediaErr ? 'warn' : 'ok', 'Errores de datos no recuperados detectados por el controlador (ECC, CRC o fallas de comparación).'),
        row('Entradas en el log de errores', d.errLogUnavailable ? 'No disponible' : nf(d.errLog), '', d.errLogUnavailable ? '—' : String(d.errLog), 'num_err_log_entries', d.errLog > 0 ? 'note' : 'ok', 'Cantidad de registros en el log de información de errores durante la vida del disco. Incluye errores menores de comandos.')
      ] },
      { title: 'Térmico', rows: [
        row('Temperatura actual', String(t), '°C', (t + 273) + ' K', 'temperature', this.tempState(d, t) === 'normal' ? 'ok' : this.tempState(d, t) === 'warning' ? 'warn' : 'crit', 'Temperatura compuesta del controlador. NVMe la reporta en kelvin.'),
        ...(d.sensors || []).map((v, i) => row('Sensor ' + (i + 1), String(i === 0 ? t : v + (t - d.temp)), '°C', (v + 273) + ' K', 'temperature_sensors[' + i + ']', 'ok', 'Sensor térmico individual reportado por el disco.')),
        row('Umbral de advertencia' + (d.estThresholds ? ' (estimado)' : ''), String(d.warnT), '°C', d.estThresholds ? '—' : (d.warnT + 273) + ' K', 'wctemp', d.estThresholds ? 'note' : 'ok', d.estThresholds ? 'Este disco no reporta umbrales; se usa un valor estimado de 70 °C.' : 'Temperatura a partir de la cual el disco puede reducir su rendimiento.'),
        row('Umbral crítico' + (d.estThresholds ? ' (estimado)' : ''), String(d.critT), '°C', d.estThresholds ? '—' : (d.critT + 273) + ' K', 'cctemp', d.estThresholds ? 'note' : 'ok', 'Temperatura a partir de la cual el disco puede apagarse para protegerse.'),
        row('Tiempo sobre advertencia', nf(d.warnTime), 'min', String(d.warnTime), 'warning_temp_time', d.warnTime > 0 ? 'note' : 'ok', 'Minutos acumulados por encima de la temperatura de advertencia.'),
        row('Tiempo sobre crítica', nf(d.critTime), 'min', String(d.critTime), 'critical_comp_time', d.critTime > 0 ? 'warn' : 'ok', 'Minutos acumulados por encima de la temperatura crítica.')
      ] },
      { title: 'Energía', rows: [
        row('Horas de encendido', nf(d.hours), 'h', String(d.hours), 'power_on_hours', 'ok', 'Tiempo total encendido. Equivale a ≈' + nf(Math.round(d.hours / 24)) + ' días.'),
        row('Ciclos de encendido', nf(d.cycles), '', String(d.cycles), 'power_cycles', 'ok', 'Veces que el disco se encendió.'),
        row('Apagados inseguros', nf(d.unsafe), '', String(d.unsafe), 'unsafe_shutdowns', d.unsafe > 0 ? 'note' : 'ok', 'Cortes de energía sin aviso previo (por ejemplo, desconectar sin expulsar). Es informativo.')
      ] }
    ];
  }
  critFlags(d) {
    return ['Repuesto bajo el umbral', 'Temperatura fuera de rango', 'Fiabilidad degradada', 'Modo solo lectura', 'Falla del respaldo de memoria volátil', 'Región de memoria persistente no confiable']
      .map((l, i) => { const on = !!(d.critWarn & (1 << i)); return { label: l, bit: 'Bit ' + i, on, icon: on ? '#i-x' : '#i-check', fg: on ? hv('critical', 'fg') : hv('optimal', 'fg'), bg: on ? hv('critical', 'bg') : 'transparent', state: on ? 'Activa' : 'Inactiva' }; });
  }
  tempView(d, rt) {
    const s = this.state, N = Math.max(2, Math.round(s.tempWin * 60 / s.tempInt)), pts = rt.hist.slice(-N);
    const W = 760, X0 = 44, Y0 = 16, Y1 = 236, top = Math.ceil((d.critT + 6) / 10) * 10, bot = 20;
    const y = v => Y1 - (v - bot) / (top - bot) * (Y1 - Y0); const dx = W / (N - 1);
    const start = N - pts.length;
    const path = pts.map((v, i) => (i ? 'L' : 'M') + (X0 + (start + i) * dx).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = path ? path + ' L' + (X0 + W).toFixed(1) + ' ' + Y1 + ' L' + (X0 + start * dx).toFixed(1) + ' ' + Y1 + ' Z' : '';
    const ticks = []; for (let v = bot; v <= top; v += 10) ticks.push({ y: y(v).toFixed(1), top: (y(v) / 256 * 100).toFixed(2) + '%', label: this.tU(v, true) });
    const xl = [0, 1 / 3, 2 / 3, 1].map(f => ({ left: ((X0 + f * W) / 812 * 100).toFixed(2) + '%', tx: f === 1 ? 'translateX(-100%)' : f === 0 ? 'none' : 'translateX(-50%)', label: f === 1 ? 'ahora' : '−' + Math.round(s.tempWin * (1 - f)) + ' min' }));
    const mn = Math.min(...pts), mx = Math.max(...pts), avg = pts.reduce((a, b) => a + b, 0) / pts.length;
    const t = Math.round(rt.temp), tst = this.tempState(d, t);
    const tip = d.warnTime > 0 || t >= 65 ? 'Este disco acumula ' + nf(d.warnTime) + ' min sobre la temperatura de advertencia. Sobre 70 °C sostenidos, considera un gabinete con disipador o mejor ventilación.' : 'La temperatura es estable y está dentro del rango normal para este disco.';
    const sensors = (d.sensors || []).map((v, i) => ({ label: 'Sensor ' + (i + 1), val: this.tU(i === 0 ? t : v + (t - d.temp)), scale: Math.min(1, ((i === 0 ? t : v + (t - d.temp)) - bot) / (d.critT - bot)) }));
    return {
      now: this.tU(t, true).replace('°', ''), unitLbl: this.state.unit === 'F' ? '°F' : '°C', tst, tFg: this.tempFg(tst), stLabel: tst === 'normal' ? 'Normal' : tst === 'warning' ? 'Sobre advertencia' : 'Sobre crítica', stIcon: tst === 'normal' ? '#i-check-circle' : '#i-alert', stColor: tst === 'normal' ? hv('optimal', 'fg') : hv(tst, 'fg'), stBg: tst === 'normal' ? hv('optimal', 'bg') : hv(tst, 'bg'),
      path, area, ticks, xl, dx: dx.toFixed(2), clipId: 'tc-' + d.id,
      yWarn: y(d.warnT).toFixed(1), yCrit: y(d.critT).toFixed(1), hWarn: (y(d.warnT) - y(d.critT)).toFixed(1), hCrit: (y(d.critT) - Y0).toFixed(1), hNorm: (Y1 - y(d.warnT) + 4).toFixed(1),
      warnLbl: 'Advertencia ' + this.tU(d.warnT) + (d.estThresholds ? ' (estimado)' : ''), critLbl: 'Crítico ' + this.tU(d.critT) + (d.estThresholds ? ' (estimado)' : ''), lblWarnTop: ((y(d.warnT) + 3) / 256 * 100).toFixed(2) + '%', lblCritTop: ((y(d.critT) - 3) / 256 * 100).toFixed(2) + '%',
      min: this.tU(mn), max: this.tU(mx), avg: this.state.unit === 'F' ? nf(avg * 9 / 5 + 32, 1) + ' °F' : nf(avg, 1) + ' °C', sensors, tip,
      warnTime: nf(d.warnTime) + ' min', critTime: nf(d.critTime) + ' min', throttle: d.critTime > 0 ? 'Estrangulamiento registrado' : d.warnTime > 0 ? 'Posible estrangulamiento breve' : 'Sin estrangulamiento térmico',
      throttleFg: d.critTime > 0 ? hv('warning', 'fg') : d.warnTime > 0 ? 'var(--text-secondary)' : hv('optimal', 'fg'), throttleIcon: d.critTime > 0 ? '#i-alert' : d.warnTime > 0 ? '#i-info' : '#i-check-circle',
      est: !!d.estThresholds, points: pts.length
    };
  }
  testView(d) {
    const s = this.state, t = s.test && s.test.diskId === d.id ? s.test : null;
    const boot = !!d.bootDisk; const cap = d.bytes / 1e12;
    const sp = this.spec(d.id, 'full');
    const estFull = boot ? '—' : '~' + Math.max(1, Math.round(sp.durationSim / 60)) + ' min', estQuick = '1–2 min';
    const lockTxt = 'macOS no permite enviar el comando de autoprueba NVMe; disponible en discos SATA compatibles o en Linux.';
    const busy = !!(s.test && s.test.status === 'running');
    const cards = [
      { key: 'short', title: 'Autoprueba SMART corta', cmd: 'smartctl -t short ' + d.id, icon: '#i-test', desc: 'El controlador revisa sus componentes internos y una muestra de la superficie.', dur: '~2 min', req: 'Comando NVMe Device Self-test', locked: true, lockTxt },
      { key: 'long', title: 'Autoprueba SMART extendida', cmd: 'smartctl -t long ' + d.id, icon: '#i-test', desc: 'Revisión completa ejecutada por el propio disco, incluida toda la superficie.', dur: '~' + Math.round(cap * 6 + 4) + ' min', req: 'Comando NVMe Device Self-test', locked: true, lockTxt },
      { key: 'full', title: 'Escaneo de lectura completo', cmd: 'hdi-scan --full /dev/r' + d.id, icon: '#i-scan', desc: 'Lee toda la superficie sin escribir nada, detecta zonas ilegibles y mide la velocidad sostenida.', dur: estFull, req: 'Contraseña de administrador', locked: false, disabled: boot || busy, disTxt: boot ? 'No disponible para el disco interno de arranque.' : busy ? 'Hay una prueba en curso.' : '', start: () => this.askScan('full') },
      { key: 'quick', title: 'Escaneo rápido (muestreo)', cmd: 'hdi-scan --sample 2% /dev/r' + d.id, icon: '#i-sample', desc: 'Lee bloques repartidos por todo el disco (~2 % del total) para una revisión exprés.', dur: estQuick, req: 'Contraseña de administrador', locked: false, disabled: boot || busy, disTxt: boot ? 'No disponible para el disco interno de arranque.' : busy ? 'Hay una prueba en curso.' : '', start: () => this.askScan('quick') }
    ].map(c => ({ disabled: false, disTxt: '', start: null, ...c, infoOpen: s.lockInfo === c.key, toggleInfo: () => this.setState({ lockInfo: s.lockInfo === c.key ? null : c.key }) })).map(c => ({ ...c, disabled: !!(c.locked || c.disabled), btnOpacity: c.locked || c.disabled ? 0.4 : 1 }));
    const hist = (d.selftests || []).map(x => ({ label: x.type + ' · ' + x.result + ' · a las ' + nf(x.hours) + ' h', src: 'Log de autopruebas del disco', icon: x.ok ? '#i-check-circle' : '#i-alert', fg: x.ok ? hv('optimal', 'fg') : hv('critical', 'fg'), lba: x.lba !== '—' ? 'LBA con falla: ' + x.lba : '' }));
    if (d.selftestUnsupported) hist.push({ label: 'Este disco no admite autopruebas', src: 'Lectura del log de autopruebas', icon: '#i-info', fg: 'var(--text-secondary)', lba: '' });
    let run = null;
    if (t) {
      const ts = this.spec(d.id, t.kind), vs = t.samples.map(x => x[1]); const last = vs[vs.length - 1] || 0;
      const W = 760, X0 = 44, Y1 = 150, Y0 = 10, vmax = 3200; const y = v => Y1 - v / vmax * (Y1 - Y0);
      const path = t.samples.map((q, i) => (i ? 'L' : 'M') + (X0 + q[0] * W).toFixed(1) + ' ' + y(q[1]).toFixed(1)).join(' ');
      const endX = X0 + (t.samples.length ? t.samples[t.samples.length - 1][0] : 0) * W;
      const area = path ? path + ' L' + endX.toFixed(1) + ' ' + Y1 + ' L' + X0 + ' ' + Y1 + ' Z' : '';
      const zones = ts.zones.filter(z => z[0] <= t.p).map(z => ({ x: (X0 + z[0] * W).toFixed(1), lba: z[1] + '–' + z[2], pos: nf(z[0] * 100, 1) + ' %' }));
      const doneSt = t.status !== 'running'; const partial = t.status === 'cancelled' || t.status === 'interrupted';
      const avgP = vs.length ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0;
      const rt = this.rt(d.id); const curT = rt ? Math.round(rt.temp) : d.temp;
      const R = { passed: ['Aprobado', 'Sin zonas ilegibles. La superficie completa se leyó correctamente.', 'optimal', '#i-check-circle'], errors: ['Con errores', ts.zones.length + ' zonas ilegibles. La velocidad cayó a ~40 MB/s en esas regiones.', 'critical', '#i-alert'], cancelled: ['Cancelado', 'Cancelaste la prueba al ' + Math.floor(t.p * 100) + ' %. Se conservaron los resultados parciales.', 'nodata', '#i-stop'], interrupted: ['Interrumpido', 'El disco se desconectó al ' + Math.floor(t.p * 100) + ' %. Se conservaron los resultados parciales.', 'warning', '#i-plug'] }[t.status] || ['', '', 'nodata', '#i-info'];
      const full = t.status === 'passed' || t.status === 'errors';
      const stats = full && t.kind === 'full' ? [['Duración', (this.data.scans[d.id] || {}).durationText || fmtMin(ts.durationSim)], ['Velocidad promedio', nf(ts.avg) + ' MB/s'], ['Mínima', nf(ts.min) + ' MB/s'], ['Máxima', nf(ts.max) + ' MB/s'], ['Temperatura máxima', ts.maxTemp + ' °C'], ['Zonas ilegibles', String(ts.zones.length)]]
        : [['Duración', fmtMin(t.p * ts.durationSim)], ['Velocidad promedio', nf(avgP) + ' MB/s'], ['Mínima', nf(Math.min(...vs)) + ' MB/s'], ['Máxima', nf(Math.max(...vs)) + ' MB/s'], ['Temperatura máxima', curT + ' °C'], ['Zonas ilegibles', String(zones.length)]];
      const sc = this.data.scans[d.id];
      const diff = full && sc ? [['Datos leídos', 'read'], ['Comandos de lectura', 'hostReads'], ['Temperatura', 'temp'], ['Errores de medios', 'media'], ['Entradas en el log de errores', 'errLog'], ['Repuesto disponible', 'spare'], ['Horas de encendido', 'hours']].map(([l, k]) => {
        const a = sc.before[k], b = sc.after[k], ch = a !== b, bad = ch && (k === 'media' || k === 'errLog');
        return { label: l, a, b, ch, mark: ch ? (bad ? '↑' : '↑') : '=', fg: bad ? hv('critical', 'fg') : ch ? 'var(--accent-fg)' : 'var(--text-tertiary)', bg: bad ? hv('critical', 'bg') : ch ? 'var(--accent-soft)' : 'transparent', weight: ch ? 600 : 400 };
      }) : [];
      run = {
        running: !doneSt, done: doneSt, kindLabel: t.kind === 'full' ? 'Escaneo de lectura completo' : 'Escaneo rápido (muestreo)',
        pct: String(Math.floor(t.p * 100)), p: t.p.toFixed(4), elapsed: fmtClock(t.p * ts.durationSim), remaining: fmtClock((1 - t.p) * ts.durationSim),
        speed: nf(last), temp: d.temp ? this.tU(curT) : '—', errors: String(t.errors), errFg: t.errors ? hv('critical', 'fg') : 'var(--text-primary)',
        path, area, zones, hasZones: zones.length > 0, zonesList: zones.slice(0, 12), yTicks: [0, 1000, 2000, 3000].map(v => ({ y: y(v).toFixed(1), top: (y(v) / 176 * 100).toFixed(2) + '%', label: v ? nf(v) : '0' })),
        rTitle: R[0], rBody: R[1], rFg: hv(R[2], 'fg'), rBg: hv(R[2], 'bg'), rBorder: hv(R[2], 'border'), rIcon: R[3], stats: stats.map(x => ({ label: x[0], val: x[1] })),
        diff, hasDiff: diff.length > 0, partial, live: 'Progreso del escaneo: ' + Math.floor(t.p * 10) * 10 + ' %'
      };
    }
    return { cards, hist, run, hasRun: !!run };
  }
  identityView(d) {
    const s = this.state; const masked = d.serial ? d.serial.slice(0, 6) + '•'.repeat(Math.max(4, d.serial.length - 6)) : '—';
    const rows = [
      ['Modelo', d.model, d.model], ['Número de serie', s.serialShown ? d.serial : masked, d.serial || '', true, true], ['Firmware', d.fw || '—', d.fw || ''],
      ['Proveedor PCI', d.pciVendor || '—', d.pciVendor || ''], ['OUI IEEE', d.oui || '—', d.oui || ''], ['Versión NVMe', d.nvme || '—', d.nvme || ''],
      ['Capacidad total', nf(d.bytes) + ' bytes [' + this.cap(d) + ']', String(d.bytes)], ['Tamaño de bloque lógico', nf(d.lbaSize) + ' B', String(d.lbaSize)],
      ['Namespaces', d.namespaces != null ? String(d.namespaces) : '—', String(d.namespaces || '')], ['ID de controlador', d.ctrlId != null ? String(d.ctrlId) : '—', String(d.ctrlId || '')],
      ['Conexión', d.connLabel + ' · ' + d.link, d.connLabel + ' · ' + d.link], ['Puente o gabinete', d.bridge || (d.internal ? 'Integrado (sin puente)' : 'Desconocido'), d.bridge || ''],
      ['Identificador', d.id, d.id, true], ['Ruta IOService', truncMid(d.ioservice || ''), d.ioservice || '', true]
    ].map(([k, v, c, mono, serial]) => ({ k, v, mono: mono ? 'var(--font-mono)' : 'inherit', tip: c.length > 60 ? c : '', serial: !!serial, eyeIcon: s.serialShown ? '#i-eye-off' : '#i-eye', eyeLbl: s.serialShown ? 'Ocultar número de serie' : 'Mostrar número de serie', toggleSerial: () => this.setState({ serialShown: !s.serialShown }), copyIcon: s.copied === 'id-' + k ? '#i-check' : '#i-copy', copy: () => this.copy('id-' + k, c) }));
    const chip = (on, label) => ({ label, icon: on ? '#i-check' : '#i-x', fg: on ? 'var(--accent-fg)' : 'var(--text-tertiary)', bg: on ? 'var(--accent-soft)' : 'transparent', border: on ? 'var(--accent-border)' : 'var(--border-default)', bstyle: on ? 'solid' : 'dashed', state: on ? 'Compatible' : 'No compatible' });
    const a = d.optAdmin || {}, n = d.optNvm || {};
    return {
      rows,
      admin: [[a.selftest, 'Autoprueba (Device Self-test)'], [a.format, 'Format NVM'], [a.fwdl, 'Descarga de firmware'], [a.security, 'Security send/receive'], [a.nsmgmt, 'Gestión de namespaces'], [a.virt, 'Virtualización']].map(x => chip(!!x[0], x[1])),
      nvm: [[n.dsm, 'Dataset Management / TRIM'], [n.wz, 'Write Zeroes'], [n.compare, 'Compare'], [n.verify, 'Verify'], [n.timestamp, 'Timestamp'], [n.reservations, 'Reservas']].map(x => chip(!!x[0], x[1])),
      thresholds: [{ k: 'Advertencia (WCTEMP)', v: d.warnT + ' °C' + (d.estThresholds ? ' · estimado' : '') }, { k: 'Crítica (CCTEMP)', v: d.critT + ' °C' + (d.estThresholds ? ' · estimado' : '') }],
      ps: (d.powerStates || []).map(p => ({ id: p[0], w: p[1], op: p[2], en: p[3], ex: p[4] })),
      lba: (d.lbaFormats || []).map(l => ({ id: l[0], size: l[1], meta: l[2], perf: l[3] }))
    };
  }
  makeJSON(d) {
    if (d.id === 'disk4') return this.data.json4;
    const j = { smartctl: { version: [7, 5], platform_info: 'Darwin 27.0.0 arm64', exit_status: d.exit }, device: { name: d.id, type: d.nodata ? 'sntrealtek' : 'nvme', protocol: 'NVMe' }, model_name: d.model };
    if (d.nodata) { j.smartctl.messages = [{ string: 'Read NVMe Identify Controller failed: SMART not supported over USB on macOS', severity: 'error' }]; j.user_capacity = { blocks: d.blocks, bytes: d.bytes }; return j; }
    Object.assign(j, { serial_number: d.serial.slice(0, 6) + '••••••', firmware_version: d.fw, nvme_version: { string: d.nvme }, user_capacity: { blocks: d.blocks, bytes: d.bytes }, smart_status: { passed: !d.critWarn, nvme: { value: d.critWarn } },
      nvme_smart_health_information_log: { critical_warning: d.critWarn, temperature: d.temp, available_spare: d.spare, available_spare_threshold: d.spareTh, percentage_used: d.used, data_units_read: d.duRead, data_units_written: d.duWritten, host_reads: d.hostReads, host_writes: d.hostWrites, controller_busy_time: d.busy, power_cycles: d.cycles, power_on_hours: d.hours, unsafe_shutdowns: d.unsafe, media_errors: d.mediaErr, num_err_log_entries: d.errLogUnavailable ? null : d.errLog, warning_temp_time: d.warnTime, critical_comp_time: d.critTime, temperature_sensors: d.sensors },
      temperature: { current: d.temp }, spare_available: { current_percent: d.spare, threshold_percent: d.spareTh }, endurance_used: { current_percent: d.used }, power_on_time: { hours: d.hours }, power_cycle_count: d.cycles });
    if (d.errLogUnavailable) j.smartctl.messages = [{ string: 'Read Error Information Log failed: GetLogPage failed: system=0x38, sub=0x0, code=745', severity: 'error' }];
    return j;
  }
  makeText(d) {
    if (d.id === 'disk4') return this.data.text4;
    const h = 'smartctl 7.5 2025-04-30 r5714 [Darwin 27.0.0 arm64] (local build)\nCopyright (C) 2002-25, Bruce Allen, Christian Franke, www.smartmontools.org\n\n';
    if (d.nodata) return h + '/dev/' + d.id + ': Unknown USB bridge [0x0bda:0x9210 (0xf01)]\nPlease specify device type with the -d option.\n\nUse smartctl -h to get a usage summary';
    const L = (k, v) => (k + ':').padEnd(36) + v;
    return h + ['=== START OF INFORMATION SECTION ===', L('Model Number', d.model), L('Serial Number', d.serial.slice(0, 6) + '••••••'), L('Firmware Version', d.fw), L('NVMe Version', d.nvme), '', '=== START OF SMART DATA SECTION ===', 'SMART overall-health self-assessment test result: ' + (d.critWarn ? 'FAILED!' : 'PASSED'), '', 'SMART/Health Information (NVMe Log 0x02)', L('Critical Warning', '0x' + p2(d.critWarn.toString(16))), L('Temperature', d.temp + ' Celsius'), L('Available Spare', d.spare + '%'), L('Available Spare Threshold', d.spareTh + '%'), L('Percentage Used', d.used + '%'), L('Data Units Read', nf(d.duRead)), L('Data Units Written', nf(d.duWritten)), L('Power Cycles', nf(d.cycles)), L('Power On Hours', nf(d.hours)), L('Unsafe Shutdowns', nf(d.unsafe)), L('Media and Data Integrity Errors', nf(d.mediaErr)), L('Error Information Log Entries', d.errLogUnavailable ? '-' : nf(d.errLog)), '', d.errLogUnavailable ? 'Read Error Information Log failed: GetLogPage failed' : 'Error Information (NVMe Log 0x01)'].join('\n');
  }
  jsonLines(obj) {
    const s = this.state, out = [], q = norm(s.jq.trim());
    const fmt = v => v === null ? ['null', 'var(--syn-bool)'] : typeof v === 'string' ? ['"' + v + '"', 'var(--syn-string)'] : typeof v === 'boolean' ? [String(v), 'var(--syn-bool)'] : [String(v), 'var(--syn-number)'];
    const push = (depth, key, val, color, tail, tog, path, coll) => { const txt = (key || '') + ' ' + val; out.push({ pad: (depth * 16 + 20) + 'px', key: key != null ? '"' + key + '"' : '', colon: key != null ? ': ' : '', val, color, tail, tog: !!tog, chev: coll ? '#i-chevron-right' : '#i-chevron-down', toggle: tog ? () => this.setState(st => ({ collapsed: { ...st.collapsed, [path]: !st.collapsed[path] } })) : null, bg: q && norm(txt).includes(q) ? 'var(--health-warning-bg)' : 'transparent' }); };
    const walk = (key, v, depth, path, last) => {
      const comma = last ? '' : ',';
      if (v && typeof v === 'object') {
        const arr = Array.isArray(v), ent = arr ? v.map((x, i) => [i, x]) : Object.entries(v);
        if (arr && ent.every(e => typeof e[1] !== 'object')) { push(depth, key, '[' + v.map(x => fmt(x)[0]).join(', ') + ']', 'var(--syn-number)', comma); return; }
        const coll = !!s.collapsed[path];
        push(depth, key, arr ? '[' : '{', 'var(--syn-punct)', coll ? ' … ' + ent.length + (arr ? ' elementos ' : ' claves ') + (arr ? ']' : '}') + comma : '', true, path, coll);
        if (!coll) { ent.forEach(([k, x], i) => walk(arr ? null : k, x, depth + 1, path + '.' + k, i === ent.length - 1)); push(depth, null, arr ? ']' : '}', 'var(--syn-punct)', comma); }
      } else { const [t, c] = fmt(v); push(depth, key, t, c, comma); }
    };
    walk(null, obj, 0, '$', true); return out;
  }
  consoleView(d) {
    const s = this.state; const OPTS = [['-i', 'Información'], ['-H', 'Salud'], ['-A', 'Atributos'], ['-c', 'Capacidades'], ['-l error', 'Log de errores'], ['-l selftest', 'Log de autopruebas'], ['-x', 'Todo']];
    const cmd = 'smartctl ' + s.cOpts.join(' ') + (s.cJson ? ' -j' : '') + ' ' + d.id;
    const exec = c => this.execConsole(d, c);
    const tools = OPTS.map(([o, l]) => ({ label: l, flag: o, run: () => { this.setState({ cOpts: [o] }); exec('smartctl ' + o + ' -j ' + d.id); } }));
    const chips = OPTS.map(([o, l]) => { const on = s.cOpts.includes(o); return { flag: o, on: on ? 'true' : 'false', bg: on ? 'var(--accent-soft)' : 'transparent', fg: on ? 'var(--accent-fg)' : 'var(--text-secondary)', border: on ? 'var(--accent-border)' : 'var(--border-default)', tip: l, toggle: () => this.setState(st => ({ cOpts: on ? st.cOpts.filter(x => x !== o) : st.cOpts.concat([o]) })) }; });
    const hist = s.cmdLog.filter(e => e.disk === d.id).slice().reverse().map(e => ({ ...e, chips: this.exitChips(e.exit), copyIcon: s.copied === 'cmd-' + e.id ? '#i-check' : '#i-copy', copy: () => this.copy('cmd-' + e.id, e.cmd), rerun: () => this.execConsole(d, e.cmd) }));
    const json = this.makeJSON(d);
    const fmtRows = d.nodata ? [['Dispositivo', '/dev/' + d.id], ['Modelo', d.model], ['Capacidad', this.cap(d)], ['Resultado', 'SMART no disponible por USB en macOS']] :
      [['Modelo', d.model], ['Firmware', d.fw], ['Estado SMART', d.critWarn ? 'Fallido' : 'Aprobado'], ['Advertencia crítica', '0x' + p2(d.critWarn.toString(16))], ['Temperatura', d.temp + ' °C'], ['Repuesto', d.spare + ' % (umbral ' + d.spareTh + ' %)'], ['Porcentaje usado', d.used + ' %'], ['Datos escritos', d.writtenText], ['Datos leídos', d.readText], ['Horas de encendido', nf(d.hours) + ' h'], ['Ciclos de encendido', nf(d.cycles)], ['Apagados inseguros', nf(d.unsafe)], ['Errores de medios', nf(d.mediaErr)], ['Entradas en el log', d.errLogUnavailable ? 'No disponible' : nf(d.errLog)]];
    return {
      tools, chips, cmd, run: () => exec(cmd), jsonToggle: () => this.setState({ cJson: !s.cJson }), jsonOn: s.cJson ? 'true' : 'false', jsonBg: s.cJson ? 'var(--accent-soft)' : 'transparent', jsonFg: s.cJson ? 'var(--accent-fg)' : 'var(--text-secondary)', jsonBorder: s.cJson ? 'var(--accent-border)' : 'var(--border-default)',
      views: [['view', 'Vista'], ['json', 'JSON'], ['text', 'Texto']].map(([k, l]) => ({ label: l, on: s.cOut === k, bg: s.cOut === k ? 'var(--surface-raised)' : 'transparent', shadow: s.cOut === k ? 'var(--shadow-1)' : 'none', fg: s.cOut === k ? 'var(--text-primary)' : 'var(--text-secondary)', pick: () => this.setState({ cOut: k }) })),
      isView: s.cOut === 'view', isJson: s.cOut === 'json', isText: s.cOut === 'text', lines: s.cOut === 'json' ? this.jsonLines(json) : [], text: this.makeText(d),
      fmtRows: fmtRows.map(r => ({ k: r[0], v: r[1] })), jq: s.jq, onJq: e => this.setState({ jq: e.target.value }),
      copyOut: () => this.copy('out', s.cOut === 'json' ? JSON.stringify(json, null, 2) : this.makeText(d)), copyOutIcon: s.copied === 'out' ? '#i-check' : '#i-copy', copyCmd: () => this.copy('cmd', cmd), copyCmdIcon: s.copied === 'cmd' ? '#i-check' : '#i-copy',
      exitChips: this.exitChips(d.exit), hist, hasHist: hist.length > 0
    };
  }

  mini(vals, w, h) {
    const v = vals.filter(x => x != null); if (v.length < 2) return { path: '', dots: [] };
    let mn = Math.min(...v), mx = Math.max(...v); if (mn === mx) { mn -= 1; mx += 1; } const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
    const pts = v.map((x, i) => [i * w / (v.length - 1), h - (x - mn) / (mx - mn) * h]);
    return { path: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), dots: pts.map(p => ({ cx: p[0].toFixed(1), cy: p[1].toFixed(1) })) };
  }
  phase2(segBtn) {
    const s = this.state, M = this.data, r = s.route, out = {};
    const reports = s.reports || M.reports;
    /* Reports list */
    out.reportRows = reports.map(rp => { const d = this.D(rp.disk); return { ...rp, model: d ? d.model : rp.model, ...this.verdictBits(rp.verdict), pagesTxt: rp.pages ? rp.pages + ' págs.' : '—', anim: rp.fresh ? 'rise' : '',
      open: () => this.openReport(rp), finder: () => this.finderReport(rp), del: () => this.deleteReport(rp.id) }; });
    out.hasReports = reports.length > 0; out.noReports = reports.length === 0; out.newReport = () => this.report();
    /* Builder */
    const rd = this.D(s.repDisk);
    const SECS = [['summary', 'Resumen'], ['identity', 'Identidad'], ['smart', 'Salud SMART'], ['temp', 'Temperatura'], ['tests', 'Pruebas'], ['logs', 'Registros'], ['appendix', 'Apéndice técnico']];
    out.repSecs = SECS.map(([k, l]) => { const on = s.repSecs.includes(k); return { label: l, on: on ? 'true' : 'false', box: on ? 'var(--accent)' : 'transparent', boxBorder: on ? 'var(--accent)' : 'var(--border-strong)', check: on ? 1 : 0, toggle: () => this.setState(st => ({ repSecs: on ? st.repSecs.filter(x => x !== k) : st.repSecs.concat([k]), repPhase: st.repPhase === 'done' ? 'idle' : st.repPhase })) }; });
    out.repDiskOpts = s.disks.filter(x => x.phase !== 'gone').map(x => { const d = this.D(x.id); return { id: d.id, label: d.model + ' · ' + d.id }; });
    out.repDisk = s.repDisk; out.onRepDisk = e => this.setState({ repDisk: e.target.value, repPhase: 'idle' });
    out.repTech = s.repTech; out.onRepTech = e => this.setState({ repTech: e.target.value }); out.repClient = s.repClient; out.onRepClient = e => this.setState({ repClient: e.target.value }); out.repNotes = s.repNotes; out.onRepNotes = e => this.setState({ repNotes: e.target.value });
    out.swRepMask = { track: s.repMask ? 'var(--accent)' : 'var(--gray-6)', knob: s.repMask ? 'translateX(12px)' : 'none', on: s.repMask ? 'true' : 'false' }; out.toggleRepMask = () => this.setState({ repMask: !s.repMask });
    out.papers = [['letter', 'Carta'], ['a4', 'A4']].map(([k, l]) => ({ label: l, ...segBtn(s.repPaper === k), pressed: s.repPaper === k ? 'true' : 'false', pick: () => this.setState({ repPaper: k }) }));
    out.formats = ['PDF', 'HTML', 'JSON'].map(k => ({ label: k, ...segBtn(s.repFormat === k), pressed: s.repFormat === k ? 'true' : 'false', pick: () => this.setState({ repFormat: k, repPhase: 'idle' }) }));
    const q = new URLSearchParams({ disk: s.repDisk, paper: s.repPaper, s: s.repSecs.join(','), tech: s.repTech, client: s.repClient, notes: s.repNotes, mask: s.repMask ? '1' : '0' });
    out.previewSrc = 'report.html#' + q.toString();
    const pages = this.repPages(); out.repPagesTxt = pages + (pages === 1 ? ' página' : ' páginas') + ' · ' + (s.repPaper === 'a4' ? 'A4 (210 × 297 mm)' : 'Carta (8.5 × 11 in)');
    out.previewH = (pages * 1120 + 40) + 'px'; out.previewWrapH = Math.round((pages * 1120 + 40) * 0.5) + 'px';
    out.repIdle = s.repPhase === 'idle'; out.repGen = s.repPhase === 'generating'; out.repDone = s.repPhase === 'done'; out.repErr = s.repPhase === 'error';
    out.genReport = this.genReport; out.showFinder = () => this.showFinder();
    out.repSteps = ['Leyendo datos SMART actuales', 'Renderizando gráficos', 'Calculando SHA-256 de los datos crudos', 'Generando ' + s.repFormat].map((l, i) => { const done = s.repStep > i, act = s.repStep === i && s.repPhase === 'generating', err = s.repPhase === 'error' && i === 3; return { label: l, done, act, err, pend: !done && !act && !err, fg: done || act ? 'var(--text-primary)' : err ? hv('critical', 'fg') : 'var(--text-tertiary)' }; });
    out.repShowSteps = s.repPhase !== 'idle'; out.repModel = rd ? rd.model : '';
    /* History */
    const seen = s.disks.map(x => x.id).concat(M.disks.map(d => d.id)).filter((v, i, a) => a.indexOf(v) === i).map(id => this.D(id)).concat(M.pastDisks);
    const sel = seen.find(d => d.id === s.histSel) || seen[0] || { id: '', model: 'Sin discos', serial: '', verdict: 'nodata', nodata: true };
    const trend = d => { const h = M.hist[d.id] || []; if (d.nodata) return ['Sin datos SMART', '#i-circle-dashed', 'var(--text-tertiary)']; if (h.length < 2) return ['Sin tendencia', '#i-info', 'var(--text-tertiary)']; const a = h[h.length - 2], b = h[h.length - 1]; if (b[4] > a[4]) return ['Empeorando: +' + (b[4] - a[4]) + ' errores', '#i-arrow-down', hv(d.verdict === 'critical' ? 'critical' : 'warning', 'fg')]; if (b[1] < a[1]) return ['Desgaste normal', '#i-arrow-down', 'var(--text-secondary)']; return ['Estable', '#i-check', hv('optimal', 'fg')]; };
    out.seen = seen.map(d => { const h = M.hist[d.id] || [], last = h[h.length - 1], live = s.disks.some(x => x.id === d.id && x.phase !== 'gone' && x.phase !== 'disconnected'); const t = trend(d);
      return { id: d.id, model: d.model, serial: d.serial ? d.serial.slice(0, 6) + '••••••' : 'Serie no disponible', last: 'Última revisión: ' + (last ? last[0] : d.lastSeen), trend: t[0], tIcon: t[1], tFg: t[2], ...this.verdictBits(d.verdict), status: live ? 'Conectado' : 'Desconectado', statusFg: live ? hv('optimal', 'fg') : 'var(--text-tertiary)', bg: d.id === sel.id ? 'var(--surface-selected)' : 'transparent', pick: () => this.setState({ histSel: d.id, cmp: [Math.max(0, h.length - 2), h.length - 1] }) }; });
    const H = M.hist[sel.id] || [];
    out.hSel = { model: sel.model, serial: sel.serial ? sel.serial.slice(0, 6) + '••••••' : '—', ...this.verdictBits(sel.verdict), count: H.length + (H.length === 1 ? ' instantánea' : ' instantáneas'), nodata: !!sel.nodata };
    const chart = (label, idx, fmt, unit) => { const vals = H.map(x => x[idx]); const m = this.mini(vals, 240, 56); const v = vals.filter(x => x != null); return { label, path: m.path, dots: m.dots, now: v.length ? fmt(v[v.length - 1]) + unit : '—', first: v.length ? fmt(v[0]) + unit : '', range: H.length ? H[0][0] + ' → ' + H[H.length - 1][0] : '' }; };
    out.hCharts = sel.nodata ? [] : [chart('Vida útil restante', 1, x => nf(x), ' %'), chart('Datos escritos', 2, x => nf(x, x >= 1000 ? 0 : x >= 100 ? 1 : 2), ' TB'), chart('Errores de medios', 4, x => nf(x), ''), chart('Temperatura máxima', 5, x => this.tU(x, true).replace('°', ''), this.state.unit === 'F' ? ' °F' : ' °C')];
    out.hasCharts = out.hCharts.length > 0;
    const [ia, ib] = [Math.min(s.cmp[0], H.length - 1), Math.min(s.cmp[1], H.length - 1)];
    out.snaps = H.map((x, i) => ({ date: x[0], life: x[1] != null ? x[1] + ' %' : '—', w: x[2] != null ? nf(x[2], x[2] >= 1000 ? 0 : x[2] >= 100 ? 1 : 2) + ' TB' : '—', hours: x[3] != null ? nf(x[3]) + ' h' : '—', media: x[4] != null ? nf(x[4]) : '—', maxT: x[5] != null ? this.tU(x[5]) : '—',
      tag: i === ia ? 'A' : i === ib ? 'B' : '', tagBg: i === ia || i === ib ? 'var(--accent)' : 'transparent', tagFg: i === ia || i === ib ? 'var(--text-on-accent)' : 'var(--text-tertiary)', tagBorder: i === ia || i === ib ? 'var(--accent)' : 'var(--border-strong)', isLast: i === H.length - 1 ? 'Actual' : '',
      pick: () => this.setState(st => { const c = st.cmp.slice(); if (c.includes(i)) return {}; c.shift(); c.push(i); c.sort((a, b) => a - b); return { cmp: c }; }) })).reverse();
    out.canCompare = H.length >= 2 && ia !== ib; out.goCompare = () => this.nav('#/history/compare'); out.backHistory = () => this.nav('#/history');
    if (H.length >= 2) {
      const A = H[ia], B = H[ib];
      const row = (label, idx, fmt, goodUp) => { const a = A[idx], b = B[idx]; const dv = b - a; const same = Math.abs(dv) < 1e-9; const bad = !same && (goodUp ? dv < 0 : dv > 0);
        return { label, a: fmt(a), b: fmt(b), delta: same ? '= sin cambio' : (dv > 0 ? '↑ +' : '↓ −') + fmt(Math.abs(dv)).replace(/^-/, ''), fg: same ? 'var(--text-tertiary)' : idx === 2 || idx === 3 ? 'var(--text-secondary)' : bad ? hv(idx === 4 ? 'critical' : 'warning', 'fg') : hv('optimal', 'fg'), bg: bad && idx === 4 ? hv('critical', 'bg') : 'transparent' }; };
      const tb = x => nf(x, x >= 1000 ? 0 : x >= 100 ? 1 : 2) + ' TB';
      out.cmpRows = [row('Vida útil restante', 1, x => nf(x) + ' %', true), row('Datos escritos', 2, tb, true), row('Horas de encendido', 3, x => nf(x) + ' h', true), row('Errores de medios', 4, x => nf(x), false), row('Temperatura máxima', 5, x => this.tU(x), false), row('Apagados inseguros', 6, x => nf(x), false)];
      out.cmpA = A[0]; out.cmpB = B[0];
      const dW = B[2] - A[2], dH = B[3] - A[3], dM = B[4] - A[4];
      out.cmpSummary = (dW >= 0 ? '+' : '−') + nf(Math.abs(dW), 1) + ' TB escritos · +' + nf(dH) + ' h · ' + (dM > 0 ? '+' + dM + ' errores de medios' : '+0 errores de medios');
      out.cmpSummaryFg = dM > 0 ? hv(sel.verdict === 'critical' ? 'critical' : 'warning', 'fg') : 'var(--text-primary)';
    } else { out.cmpRows = []; out.cmpA = ''; out.cmpB = ''; out.cmpSummary = 'Se necesitan al menos dos instantáneas.'; out.cmpSummaryFg = 'var(--text-secondary)'; }
    out.exportHistory = () => this.exportHistory();
    out.askDelHist = () => this.setState({ dialog: { kind: 'delHist' } });
    /* Settings */
    const st = s.set, sw = on => ({ track: on ? 'var(--accent)' : 'var(--gray-6)', knob: on ? 'translateX(12px)' : 'none', on: on ? 'true' : 'false' });
    const tog = k => () => this.setSet({ [k]: !st[k] });
    out.sThemes = [['system', 'Sistema'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([k, l]) => ({ label: l, ...segBtn(s.theme === k), pressed: s.theme === k ? 'true' : 'false', pick: () => this.setTheme(k) }));
    out.sMotion = [['system', 'Sistema'], ['reduced', 'Reducido'], ['full', 'Completo']].map(([k, l]) => ({ label: l, ...segBtn(s.motion === k), pressed: s.motion === k ? 'true' : 'false', pick: () => this.persist({ motion: k }) }));
    out.sUnits = [['C', '°C'], ['F', '°F']].map(([k, l]) => ({ label: l, ...segBtn(s.unit === k), pressed: s.unit === k ? 'true' : 'false', pick: () => this.setState({ unit: k }) }));
    out.sInts = [1, 2, 5].map(k => ({ label: k + ' s', ...segBtn(s.tempInt === k), pressed: s.tempInt === k ? 'true' : 'false', pick: () => this.setState({ tempInt: k }) }));
    out.sPapers = [['letter', 'Carta'], ['a4', 'A4']].map(([k, l]) => ({ label: l, ...segBtn(s.repPaper === k), pressed: s.repPaper === k ? 'true' : 'false', pick: () => this.setState({ repPaper: k }) }));
    out.swHideInt = sw(s.hideInternal); out.toggleHideInt = () => this.setState({ hideInternal: !s.hideInternal });
    ['notifConnect', 'notifTest', 'notifCrit', 'keepAwake', 'sound', 'maskDefault'].forEach(k => { out['sw_' + k] = sw(st[k]); out['tg_' + k] = tog(k); });
    out.sCompany = st.company; out.onCompany = e => this.setSet({ company: e.target.value }); out.sTech = s.repTech; out.onTech = e => this.setState({ repTech: e.target.value });
    out.th = [['thMedia', 'Errores de medios para «Crítico»', '', 'Atención de 1 a este valor − 1'], ['thSpare', 'Margen del repuesto sobre el umbral', ' pts', 'Atención si el repuesto está a este margen o menos'], ['thWarn', 'Temperatura de advertencia estimada', ' °C', 'Para discos que no reportan umbrales'], ['thCrit', 'Temperatura crítica estimada', ' °C', 'Para discos que no reportan umbrales']]
      .map(([k, l, u, h]) => ({ label: l, help: h, val: st[k] + u, dec: () => this.setSet({ [k]: Math.max(1, st[k] - 1) }), inc: () => this.setSet({ [k]: st[k] + 1 }) }));
    out.detecting = st.detecting; out.redetect = () => this.redetect();
    out.appVersion = M.appVersion;
    return out;
  }

  renderVals() {
    const s = this.state, M = this.data;
    const r = s.route, scr = r.screen;
    const k = { 1: 1, 0.5: 2, 0.25: 4 }[s.speed] || 1;
    const base = {
      showScenarios: !this.real, theme: s.theme, motionAttr: s.motion, transpAttr: s.transp, motionK: k, wallDark: !this.real && s.wall === 'dark', wallLight: !this.real && s.wall === 'light',
      goDevices: () => this.nav('#/devices'), goReports: () => this.nav('#/reports'), goHistory: () => this.nav('#/history'), goSettings: () => this.nav('#/settings'),
      navReportsBg: scr === 'reports' ? 'var(--surface-selected)' : 'transparent', navHistoryBg: scr === 'history' ? 'var(--surface-selected)' : 'transparent', navSettingsBg: scr === 'settings' ? 'var(--surface-selected)' : 'transparent',
      navReportsCur: scr === 'reports' ? 'page' : 'false', navHistoryCur: scr === 'history' ? 'page' : 'false',
      ...this.smartctlBadge(s),
      rescan: this.rescan, toggleConsole: this.toggleConsole, consolePressed: s.consoleOpen ? 'true' : 'false', consoleBtnBg: s.consoleOpen ? 'var(--surface-pressed)' : 'transparent',
      openPalette: () => this.setState({ palette: true, pq: '', pi: 0 }, () => { const i = document.querySelector('[data-palette-input]'); if (i) i.focus(); }),
      onScroll: e => { const v = e.currentTarget.scrollTop > 8; if (v !== s.scrolled) this.setState({ scrolled: v }); }, edgeOpacity: s.scrolled ? 1 : 0, toolbarState: s.scrolled ? 'scrolled' : 'default',
      goBack: () => { if (scr === 'device') this.goBack(); else if (scr === 'reports') this.nav('#/reports'); else this.nav('#/history'); }, showBack: scr === 'device' || (scr === 'reports' && r.sub === 'new') || (scr === 'history' && r.sub === 'compare'),
      isOnboarding: scr === 'onboarding', isDevices: scr === 'devices', isDevice: scr === 'device', isReports: scr === 'reports' && r.sub !== 'new', isBuilder: scr === 'reports' && r.sub === 'new', isHistory: scr === 'history' && r.sub !== 'compare', isCompare: scr === 'history' && r.sub === 'compare', isSettings: scr === 'settings'
    };
    if (!s.ready || !M) return { ...base, sideDisks: [], sideCount: '', crumbs: [], cards: [], isDevice: false, isDevices: false, isOnboarding: false, isReports: false, isBuilder: false, isHistory: false, isCompare: false, isSettings: false };

    const liveRt = s.disks.filter(x => x.phase !== 'gone' && !(s.hideInternal && this.D(x.id).internal));
    base.sideCount = String(liveRt.length);
    base.sideDisks = liveRt.map(x => {
      const d = this.D(x.id), t = Math.round(x.temp), testing = s.test && s.test.status === 'running' && s.test.diskId === x.id, cur = scr === 'device' && r.id === x.id;
      return { id: x.id, name: d.internal ? d.model.replace('APPLE SSD ', 'Interno · ') : d.short, temp: x.phase === 'identifying' ? '…' : d.nodata ? '—' : this.tU(t, true), tempFg: d.nodata ? 'var(--text-tertiary)' : this.tempFg(this.tempState(d, t)).replace('var(--text-primary)', 'var(--text-secondary)'),
        icon: x.phase === 'identifying' ? '#i-circle-dashed' : VERD[d.verdict][1], fg: x.phase === 'identifying' ? 'var(--text-tertiary)' : hv(d.verdict, 'solid'), bg: cur ? 'var(--surface-selected)' : 'transparent', opacity: x.phase === 'disconnected' ? 0.45 : 1,
        state: x.phase === 'disconnected' ? 'disconnected' : testing ? 'testing' : cur ? 'selected' : 'default', current: cur ? 'page' : 'false', testing, testOff: testing ? (34.56 * (1 - s.test.p)).toFixed(2) : '34.56',
        aria: d.model + ', ' + VERD[d.verdict][0], open: () => this.openDisk(x.id), ctx: e => { e.preventDefault(); this.setState({ ctx: { x: e.clientX, y: e.clientY, id: x.id } }); } };
    });
    const cur = scr === 'device' ? this.D(r.id) : null;
    base.crumbs = scr === 'device' && cur ? [{ label: 'Dispositivos', go: () => this.goBack(), weight: 500, color: 'var(--text-secondary)', sep: false }, { label: cur.model, go: () => {}, weight: 600, color: 'var(--text-primary)', sep: true }]
      : (scr === 'reports' && r.sub === 'new') ? [{ label: 'Reportes', go: () => this.nav('#/reports'), weight: 500, color: 'var(--text-secondary)', sep: false }, { label: 'Nuevo reporte', go: () => {}, weight: 600, color: 'var(--text-primary)', sep: true }]
      : (scr === 'history' && r.sub === 'compare') ? [{ label: 'Historial', go: () => this.nav('#/history'), weight: 500, color: 'var(--text-secondary)', sep: false }, { label: 'Comparar instantáneas', go: () => {}, weight: 600, color: 'var(--text-primary)', sep: true }]
      : [{ label: { onboarding: 'Verificación del entorno', devices: 'Dispositivos', reports: 'Reportes', history: 'Historial', settings: 'Ajustes' }[scr] || 'NVitals Drive', go: () => {}, weight: 600, color: 'var(--text-primary)', sep: false }];

    const out = { ...base };
    /* Onboarding */
    const o = s.onb;
    const steps = this.onbStepTexts(o, liveRt);
    out.onbSteps = steps.map((st, i) => { const done = o.step > i, active = o.step === i && !o.fail && !o.warnOld, fail = o.fail && i === 0, warn = o.warnOld && i === 0;
      return { label: fail ? 'smartctl no encontrado' : warn ? 'smartctl 7.2 encontrado (versión antigua)' : st[0], sub: fail ? 'No está en /opt/homebrew/bin, /usr/local/bin ni en el PATH' : st[1], state: done ? 'done' : fail ? 'error' : warn ? 'warning' : active ? 'active' : 'pending',
        isDone: done, isActive: active, isFail: fail, isWarn: warn, isPending: !done && !active && !fail && !warn, color: done ? 'var(--text-primary)' : fail ? hv('critical', 'fg') : warn ? hv('warning', 'fg') : active ? 'var(--text-primary)' : 'var(--text-tertiary)' }; });
    out.onbFail = !!o.fail; out.onbOld = !!o.warnOld; out.onbDone = o.step >= 4; out.onbHelp = s.onbHelp; out.toggleOnbHelp = () => this.setState({ onbHelp: !s.onbHelp });
    out.recheck = this.recheck; out.continueOld = this.continueOld; out.finishOnb = () => { clearTimeout(this._onb); this.finishOnboarding(); };
    out.copyBrew = () => this.copy('brew', 'brew install smartmontools'); out.brewIcon = s.copied === 'brew' ? '#i-check' : '#i-copy';
    out.copyHb = () => this.copy('hb', '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'); out.hbIcon = s.copied === 'hb' ? '#i-check' : '#i-copy';

    /* Devices */
    const vis = this.visibleCards();
    out.cards = vis.map((x, i) => this.cardView(x, i));
    const ready = vis.filter(x => x.phase === 'ready');
    const cnt = v => ready.filter(x => x.d.verdict === v).length;
    const maxT = Math.max(...ready.filter(x => !x.d.nodata).map(x => Math.round(x.temp)), 0);
    const seg = [{ text: liveRt.length + (liveRt.length === 1 ? ' disco' : ' discos'), fg: 'var(--text-primary)', icon: '#i-ssd' }];
    if (cnt('critical')) seg.push({ text: cnt('critical') + ' crítico', fg: hv('critical', 'fg'), icon: VERD.critical[1] });
    if (cnt('warning')) seg.push({ text: cnt('warning') + ' requiere atención', fg: hv('warning', 'fg'), icon: VERD.warning[1] });
    if (cnt('nodata')) seg.push({ text: cnt('nodata') + ' sin datos', fg: hv('nodata', 'fg'), icon: VERD.nodata[1] });
    if (maxT) seg.push({ text: 'temp. máx. ' + this.tU(maxT), fg: 'var(--text-secondary)', icon: '#i-thermometer' });
    out.summary = seg;
    out.isEmpty = liveRt.length === 0 && s.scenario !== 'loading'; out.hasDisks = vis.length > 0; out.isLoading = s.scenario === 'loading' && liveRt.every(x => x.phase === 'identifying');
    out.gridView = s.view === 'grid' && !out.isEmpty; out.listView = s.view === 'list' && !out.isEmpty;
    const segBtn = (on) => ({ bg: on ? 'var(--surface-raised)' : 'transparent', shadow: on ? 'var(--shadow-1)' : 'none', fg: on ? 'var(--text-primary)' : 'var(--text-secondary)' });
    out.filters = [['all', 'Todos'], ['external', 'Externos'], ['internal', 'Internos']].map(([k2, l]) => ({ label: l, pressed: s.filter === k2 ? 'true' : 'false', ...segBtn(s.filter === k2), pick: () => this.setState({ filter: k2, sel: 0 }) }));
    out.views = [['grid', 'Tarjetas', '#i-grid'], ['list', 'Lista', '#i-list']].map(([k2, l, ic]) => ({ label: l, icon: ic, pressed: s.view === k2 ? 'true' : 'false', ...segBtn(s.view === k2), pick: () => this.setState({ view: k2 }) }));
    out.sortLabel = { health: 'Salud', name: 'Nombre', temp: 'Temperatura' }[s.sort];
    out.cycleSort = () => this.setState({ sort: { health: 'name', name: 'temp', temp: 'health' }[s.sort] });

    /* Detail */
    if (scr === 'device' && cur) {
      const d = cur, rt = this.rt(d.id) || this.mkRt(d.id), t = Math.round(rt.temp), tst = d.nodata ? 'normal' : this.tempState(d, t);
      const tabIdx = TABS.findIndex(x => x[0] === r.tab);
      out.d = { ...this.verdictBits(d.verdict), id: d.id, model: d.model, cap: this.cap(d), connIcon: CONNI[d.conn], connFull: d.connLabel + ' · ' + d.link, nodata: !!d.nodata, hasData: !d.nodata,
        ring: this.ring('H', d.nodata ? 0 : d.life), ringL: this.ring('L', d.nodata ? 0 : d.life), lifeNum: d.nodata ? '—' : String(Math.round(d.life * s.sweep)), pctSign: d.nodata ? '' : '%', lifeCaption: d.nodata ? 'sin datos' : 'vida útil',
        temp: d.nodata ? '—' : this.tU(t), tempFg: this.tempFg(tst), tempBg: tst === 'normal' ? 'var(--surface-hover)' : hv(tst, 'bg'), sentence: d.sentence, reason: d.reason || '', internal: !!d.internal,
        since: d.since ? 'Desde la última revisión (' + d.since.ago + '): ' + d.since.text : '', hasSince: !!d.since, disconnected: rt.phase === 'disconnected' || rt.phase === 'gone' };
      out.headerBg = s.scrolled ? 'var(--mat-toolbar-bg)' : 'var(--surface-content)'; out.headerFilter = s.scrolled ? 'var(--mat-toolbar-filter)' : 'none'; out.headerPad = s.scrolled ? '10px' : '18px'; out.headerSubDisplay = s.scrolled ? 'none' : 'flex';
      out.tabs = TABS.map(([k2, l], i) => ({ key: k2, label: l, active: r.tab === k2 ? 'true' : 'false', fg: r.tab === k2 ? 'var(--text-primary)' : 'var(--text-secondary)', kbd: '⌘' + (i + 1), go: () => this.nav('#/device/' + d.id + '/' + k2) }));
      out.tabX = s.tabInd.x; out.tabScale = (s.tabInd.w / 100).toFixed(3); out.tabTransition = s.tabInstant ? 'none' : 'transform var(--dur-spring) ' + this.M().spring({ bounce: 0, duration: 0.38 });
      out.refresh = this.rescan; out.report = this.report;
      out.moreOpen = s.popover === 'more'; out.toggleMore = () => this.setState({ popover: s.popover === 'more' ? null : 'more' });
      out.moreItems = [
        { label: 'Copiar resumen', icon: '#i-copy', kbd: '', run: () => { this.copy('sum', d.model + ' · ' + VERD[d.verdict][0] + ' · ' + d.sentence); this.setState({ popover: null }); } },
        { label: 'Copiar JSON', icon: '#i-braces', kbd: '', run: () => { this.copy('json', JSON.stringify(this.makeJSON(d), null, 2)); this.setState({ popover: null }); } },
        { label: 'Ver en Historial', icon: '#i-history', kbd: '', run: () => { this.setState({ histSel: d.id }); this.nav('#/history'); } },
        { label: 'Expulsar disco', icon: '#i-eject', kbd: '', danger: true, run: () => { this.setState({ popover: null }); this.disconnect(d.id, 'eject'); } }
      ].map(x => ({ danger: false, ...x, fg: x.danger ? hv('critical', 'fg') : 'var(--text-primary)' }));
      out.banner = s.banner === 'disconnected' || out.d.disconnected; out.rulesOpen = s.popover === 'rules'; out.toggleRules = () => this.setState({ popover: s.popover === 'rules' ? null : 'rules' });
      out.rules = [
        ['critical', 'El disco reporta una advertencia crítica (repuesto bajo el umbral, fiabilidad degradada, modo solo lectura o falla del respaldo), el estado SMART es fallido, el repuesto está por debajo del umbral o hay 10 o más errores de medios.'],
        ['warning', 'Hay de 1 a 9 errores de medios, el repuesto baja y está a 10 puntos o menos del umbral, o la vida útil restante es del 20 % o menos.'],
        ['optimal', 'No hay alertas y la vida útil restante es del 80 % o más.'], ['good', 'No hay alertas y la vida útil restante está entre 21 % y 79 %.'], ['nodata', 'SMART no está disponible (por ejemplo, por un puente USB).']
      ].map(([v, txt]) => ({ ...this.verdictBits(v), txt, cur: v === d.verdict ? 'var(--surface-selected)' : 'transparent' }));
      out.isOverview = r.tab === 'overview'; out.isSmart = r.tab === 'smart'; out.isTemp = r.tab === 'temperature'; out.isTests = r.tab === 'tests'; out.isLogs = r.tab === 'logs'; out.isIdentity = r.tab === 'identity'; out.isConsole = r.tab === 'console';
      out.noSmartTab = !!d.nodata && ['smart', 'temperature', 'logs'].includes(r.tab);
      out.alts = s.alts; out.toggleAlts = () => this.setState({ alts: !s.alts });
      if (!d.nodata) {
        if (r.tab === 'overview') { out.tiles = this.tilesFor(d, rt); out.alerts = this.alertsFor(d); out.hasAlerts = out.alerts.length > 0; }
        if (r.tab === 'smart') { out.groups = this.smartGroups(d, rt); out.flags = this.critFlags(d); out.raw = s.raw; out.rawOn = s.raw ? 'true' : 'false'; out.toggleRaw = () => this.setState({ raw: !s.raw }); out.rawKnob = s.raw ? 'translateX(12px)' : 'none'; out.rawTrack = s.raw ? 'var(--accent)' : 'var(--gray-6)'; out.critHex = '0x' + p2(d.critWarn.toString(16).toUpperCase()); }
        if (r.tab === 'temperature') {
          out.tv = this.tempView(d, rt);
          out.wins = [5, 15, 60].map(w => ({ label: w + ' min', ...segBtn(s.tempWin === w), pressed: s.tempWin === w ? 'true' : 'false', pick: () => this.setState({ tempWin: w }) }));
          out.ints = [1, 2, 5].map(w => ({ label: w + ' s', ...segBtn(s.tempInt === w), pressed: s.tempInt === w ? 'true' : 'false', pick: () => this.setState({ tempInt: w }) }));
          out.pauseLabel = s.tempPaused ? 'Reanudar' : 'Pausar'; out.pauseIcon = s.tempPaused ? '#i-play' : '#i-pause'; out.togglePause = () => this.setState({ tempPaused: !s.tempPaused });
          out.resetTemp = () => this.setState(st => ({ disks: st.disks.map(x => x.id === d.id ? { ...x, hist: [x.temp, x.temp] } : x) }));
          out.exportCsv = () => this.exportCsv(d, rt);
        }
        if (r.tab === 'logs') {
          out.errUnavailable = !!d.errLogUnavailable; out.errEmpty = !d.errLogUnavailable && d.errors.length === 0; out.errRows = d.errors.map(e => ({ n: e[0], count: nf(+e[1]), sqid: e[2], cmdid: e[3], status: e[4], lba: e[5], nsid: e[6] })); out.hasErr = out.errRows.length > 0;
          out.errNote = d.errLog > d.errors.length ? 'Mostrando las ' + d.errors.length + ' entradas más recientes de ' + nf(d.errLog) + '.' : '';
          out.stRows = (d.selftests || []).map((x, i) => ({ n: String(i), type: x.type, result: x.result, hours: nf(x.hours) + ' h', lba: x.lba, fg: x.ok ? hv('optimal', 'fg') : hv('critical', 'fg'), icon: x.ok ? '#i-check-circle' : '#i-alert' })); out.hasSt = out.stRows.length > 0; out.stUnsupported = !!d.selftestUnsupported;
        }
      }
      if (r.tab === 'tests') out.tests = this.testView(d);
      if (r.tab === 'identity') out.idv = this.identityView(d);
      if (r.tab === 'console') out.cv = this.consoleView(d);
      out.goTests = () => this.nav('#/device/' + d.id + '/tests'); out.goTemp = () => this.nav('#/device/' + d.id + '/temperature');
      out.quickScan = () => { this.nav('#/device/' + d.id + '/tests'); setTimeout(() => this.askScan('quick'), 30); };
      out.cancelAsk = () => this.setState({ dialog: { kind: 'cancel', id: d.id } }); out.resetTest = this.resetTest; out.addToReport = () => this.toast({ title: 'Agregado al reporte', body: 'El resultado se incluirá en el próximo reporte de ' + d.short + '.', icon: '#i-report' });
      out.bootDisk = !!d.bootDisk;
    }

    Object.assign(out, this.phase2(segBtn));
    /* Overlays */
    out.toasts = s.toasts.map(t => ({ ...t, body: t.body || '', hasBody: !!t.body, enter: () => clearTimeout((this._tt || {})[t.id]), leave: () => this.armToast(t.id, 2000), close: () => this.dismissToast(t.id), down: e => this.toastDown(t.id, e) }));
    out.hasTip = !!s.tip; out.tip = s.tip || { text: '', x: 0, y: 0 };
    out.palette = s.palette; out.pq = s.pq; out.onPq = e => this.setState({ pq: e.target.value, pi: 0 }); out.closePalette = () => this.setState({ palette: false });
    if (s.palette) { const flat = this.paletteFlat(); let idx = 0; out.pgroups = ['Discos', 'Acciones', 'Ir a'].map(g => ({ g, items: flat.filter(i => i.g === g).map(it => { const my = idx++; return { ...it, sel: my === s.pi ? 'true' : 'false', bg: my === s.pi ? 'var(--accent)' : 'transparent', fg: my === s.pi ? 'var(--text-on-accent)' : 'var(--text-primary)', subFg: my === s.pi ? 'var(--text-on-accent)' : 'var(--text-tertiary)', go: () => { this.setState({ palette: false }); it.run(); }, hover: () => { if (s.pi !== my) this.setState({ pi: my }); } }; }) })).filter(g => g.items.length); out.pEmpty = flat.length === 0; }
    else { out.pgroups = []; out.pEmpty = false; }
    out.hasCtx = !!s.ctx; if (s.ctx) { const cd = this.D(s.ctx.id); out.ctx = { x: s.ctx.x + 'px', y: s.ctx.y + 'px', title: cd.model, items: [
      { label: 'Abrir', icon: '#i-chevron-right', run: () => { this.setState({ ctx: null }); this.openDisk(cd.id); } },
      { label: 'Copiar modelo', icon: '#i-copy', run: () => { this.copy('ctx', cd.model); this.setState({ ctx: null }); } },
      { label: 'Copiar comando', icon: '#i-terminal', run: () => { this.copy('ctx', 'smartctl -x -j ' + cd.id); this.setState({ ctx: null }); } },
      { label: 'Generar reporte', icon: '#i-report', run: () => this.reportFor(cd.id) },
      { label: 'Expulsar', icon: '#i-eject', danger: true, run: () => { this.setState({ ctx: null }); this.disconnect(cd.id, 'eject'); } }
    ].map(x => ({ danger: false, ...x, fg: x.danger ? hv('critical', 'fg') : 'var(--text-primary)' })) }; }
    const dg = s.dialog; out.hasDelHist = !!dg && dg.kind === 'delHist'; out.delHist = () => this.deleteHistory();
    out.hasSheet = !!dg && dg.kind === 'scan'; out.hasAuth = !!dg && dg.kind === 'auth'; out.hasInterrupted = !!dg && dg.kind === 'interrupted'; out.hasCancel = !!dg && dg.kind === 'cancel'; out.hasOverlay = !!dg;
    if (dg && dg.id) { const dd = this.D(dg.id); const sp = this.spec(dg.id, dg.scan || 'full');
      out.dlg = { model: dd.model, title: dg.scan === 'quick' ? '¿Iniciar escaneo rápido?' : '¿Iniciar escaneo de lectura completo?', dur: dg.scan === 'quick' ? '1–2 min (~2 % de los bloques)' : '~' + Math.round(sp.durationSim / 60) + ' min para ' + this.cap(dd) + ' a ~' + nf(sp.avg / 1000, 1) + ' GB/s', pct: this.state.test ? Math.floor(this.state.test.p * 100) + ' %' : '' };
    }
    out.closeDialog = () => this.setState({ dialog: null }); out.startScan = this.startScan; out.authOk = this.authOk; out.cancelTest = this.cancelTest;
    out.viewPartial = () => { this.setState({ dialog: null }); };
    /* Console drawer */
    out.consoleOpen = s.consoleOpen; out.consoleH = s.consoleH + 'px'; out.closeConsole = this.closeConsole; out.consoleDrag = this.consoleDrag;
    out.logRows = s.consoleOpen ? s.cmdLog.slice(-80).map(e => ({ ...e, chips: this.exitChips(e.exit) })) : [];
    /* Scenario panel */
    out.scen = s.scen; out.toggleScen = () => this.setState({ scen: !s.scen });
    out.scenarios = [['empty', 'Sin discos'], ['loading', 'Cargando'], ['one', '1 disco óptimo'], ['mixed', '6 discos mixtos'], ['nosmartctl', 'smartctl no instalado'], ['oldversion', 'smartctl antiguo'], ['partial', 'Lectura parcial'], ['testRunning', 'Prueba en curso'], ['testOk', 'Prueba completada OK'], ['testErrors', 'Prueba con errores'], ['testDisconnect', 'Desconexión durante prueba'], ['reportGenerating', 'Reporte generándose']]
      .map(([k2, l]) => ({ label: l, on: s.scenario === k2 ? 'true' : 'false', bg: s.scenario === k2 ? 'var(--accent-soft)' : 'transparent', fg: s.scenario === k2 ? 'var(--accent-fg)' : 'var(--text-primary)', border: s.scenario === k2 ? 'var(--accent-border)' : 'var(--border-default)', pick: () => this.applyScenario(k2) }));
    out.connectNext = this.connectNext; out.disconnectOne = this.disconnectOne;
    out.themes = [['system', 'Sistema'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([k2, l]) => ({ label: l, ...segBtn(s.theme === k2), pressed: s.theme === k2 ? 'true' : 'false', pick: () => this.setTheme(k2) }));
    out.walls = [['dark', 'Oscuro'], ['light', 'Claro']].map(([k2, l]) => ({ label: l, ...segBtn(s.wall === k2), pressed: s.wall === k2 ? 'true' : 'false', pick: () => this.persist({ wall: k2 }) }));
    out.speeds = [[1, '1×'], [0.5, '0.5×'], [0.25, '0.25×']].map(([k2, l]) => ({ label: l, ...segBtn(s.speed === k2), pressed: s.speed === k2 ? 'true' : 'false', pick: () => this.persist({ speed: k2 }) }));
    const sw = on => ({ track: on ? 'var(--accent)' : 'var(--gray-6)', knob: on ? 'translateX(12px)' : 'none', on: on ? 'true' : 'false' });
    out.swMotion = sw(s.motion === 'reduced'); out.toggleMotion = () => this.persist({ motion: s.motion === 'reduced' ? 'system' : 'reduced' });
    out.swRepFail = sw(s.repFail); out.toggleRepFail = () => this.setState({ repFail: !s.repFail });
    out.swTransp = sw(s.transp === 'reduced'); out.toggleTransp = () => this.persist({ transp: s.transp === 'reduced' ? 'system' : 'reduced' });
    return out;
  }

  render() {
    return <AppTemplate vm={this.renderVals()} />;
  }
}
