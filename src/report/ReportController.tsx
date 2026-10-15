// Lógica de la plantilla del reporte, traducida desde el <script data-dc-script> de
// prototype-design/Report Template.dc.html. Los datos vienen de reportSource():
// el modo mock usa los datos del prototipo y la app real escribe una instantánea
// con la misma forma en localStorage antes de previsualizar o exportar.
// @ts-nocheck — objeto dinámico heredado del prototipo.
import { Component } from 'react';
import { ProReport } from './ProReport';
import { QuickReport } from './QuickReport';
import { BatchReport } from './BatchReport';
import { quickView } from '../domain/quickView';
import { ATT_MAX, batchLayout } from '../domain/batchReport';
import { DEFAULT_THRESHOLDS } from '../domain/disk';
import { reportSource, REPORT_SOURCE_KEY } from './source';

const nf = (n, d = 0) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const VER = { optimal: ['Óptimo', '#i-shield-check'], good: ['Bueno', '#i-check-circle'], warning: ['Atención', '#i-alert'], critical: ['Crítico', '#i-octagon'], nodata: ['Sin datos', '#i-circle-dashed'] };
const hv = (v, k) => 'var(--health-' + v + '-' + k + ')';
const ALL = ['summary', 'identity', 'smart', 'temp', 'tests', 'logs', 'appendix'];

export class ReportController extends Component<Record<string, never>, any> {
  [key: string]: any;
  state = { p: this.parse(), sha: 'calculando…', ready: true };
  parse() {
    const q = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    const pr = this.props || {};
    return { disk: q.get('disk') || pr.disk || 'disk4', paper: q.get('paper') || pr.paper || 'letter', s: (q.get('s') || ALL.join(',')).split(',').filter(Boolean),
      tech: q.has('tech') ? q.get('tech') : 'Andrea Castillo', client: q.has('client') ? q.get('client') : 'Inventario · lote 38', notes: q.get('notes') || '', mask: q.get('mask') !== '0', id: q.get('id') || 'HDI-20260924-0143', kind: q.get('kind') === 'quick' ? 'quick' : q.get('kind') === 'batch' ? 'batch' : 'full' };
  }
  componentDidMount() {
    this.onHash = () => { this.setState({ p: this.parse() }, () => this.hash()); };
    window.addEventListener('hashchange', this.onHash);
    this.hash();
    // La app escribe los datos del reporte en localStorage; la vista previa se actualiza sola.
    this.onStorage = (e) => { if (e.key === REPORT_SOURCE_KEY) this.setState({ p: this.parse() }, () => this.hash()); };
    window.addEventListener('storage', this.onStorage);
  }
  componentDidUpdate() { const pr = this.props || {}; const k = pr.disk + '|' + pr.paper; if (this._pk !== undefined && this._pk !== k && !location.hash) this.setState({ p: this.parse() }, () => this.hash()); this._pk = k; }
  componentWillUnmount() { window.removeEventListener('hashchange', this.onHash); window.removeEventListener('storage', this.onStorage); }
  /** View-model sin montar el componente (exportación HTML estática). */
  static vmFor(params, sha) {
    const c = new ReportController({});
    c.state = { p: { ...params, s: params.s, mask: params.mask !== false, kind: params.kind === 'quick' ? 'quick' : 'full' }, sha, ready: true };
    return c.renderVals();
  }
  async hash() {
    const pre = reportSource().sha256; if (pre) { this.setState({ sha: pre }); return; }
    try { const d = this.state.p.kind === 'batch' ? this.batch().items.map(x => x.disk) : this.disk(); const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(d))); this.setState({ sha: [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('') }); }
    catch (e) { this.setState({ sha: 'e3b7a1f09c4d2e6b58f1a0c7d93e24b6f8a1c5d7e9b3f2a4c6d8e0f1a2b3c4d5' }); }
  }
  disk() { return reportSource().disks.find(x => x.id === this.state.p.disk) || reportSource().disks[0]; }
  series(d) {
    const sc = reportSource().scans[d.id]; const out = [];
    if (sc) { for (let i = 0; i <= 120; i++) { const p = i / 120; out.push(Math.round(d.temp + (sc.maxTemp - d.temp) * (1 - Math.exp(-p * 3.2)) / (1 - Math.exp(-3.2)) + Math.sin(i * 0.9) * 0.6)); } return { pts: out, x1: sc.durationText, caption: 'Durante el escaneo de lectura completo' }; }
    for (let i = 0; i <= 120; i++) out.push(Math.round(d.temp + Math.sin(i / 9) * 1.2 + Math.sin(i * 1.7) * 0.5)); return { pts: out, x1: '15 min', caption: 'Monitoreo de 15 min' };
  }
  renderVals() {
    const P = this.state.p, has = k => P.s.includes(k);
    const S = reportSource(); const base = { paper: P.paper === 'a4' ? 'a4' : 'letter', rid: P.id, date: S.date || '24 sep 2026, 11:02', tech: P.tech, client: P.client, notes: P.notes, hasNotes: !!P.notes.trim(), sha: this.state.sha };
    if (!reportSource()) return { ...base, d: {}, v: {}, ring: {}, metrics: [], identity: [], smartRows: [], flags: [], temp: {}, scan: {}, logs: {}, recs: [], cmds: [] };
    const M = reportSource(), d = this.disk(), nd = !!d.nodata, vb = VER[d.verdict];
    const cap = nf(d.capacityTB, d.capacityTB % 1 ? 1 : 0) + ' TB';
    const r = 53, c = 2 * Math.PI * r;
    const stK = k => ({ ok: ['Normal', '#i-check-circle', 'var(--text-secondary)'], note: ['Nota', '#i-info', 'var(--text-secondary)'], warn: ['Atención', '#i-alert', 'var(--gray-12)'], crit: ['Crítico', '#i-octagon', 'var(--gray-12)'] }[k]);
    const spareK = d.spare < d.spareTh ? 'crit' : (d.spare < 100 && d.spare - d.spareTh <= 10) ? 'warn' : 'ok', medK = d.mediaErr >= 10 ? 'crit' : d.mediaErr ? 'warn' : 'ok';
    const metric = (label, value, k) => { const s = stK(k); return { label, value, st: s[0], icon: s[1], fg: s[2] }; };
    const metrics = nd ? [] : [metric('Vida útil restante', d.life + ' %', d.life <= 20 ? 'warn' : 'ok'), metric('Repuesto (umbral ' + d.spareTh + ' %)', d.spare + ' %', spareK), metric('Datos escritos', d.writtenText, 'ok'), metric('Datos leídos', d.readText, 'ok'),
      metric('Horas (≈' + nf(Math.round(d.hours / 24)) + ' días)', nf(d.hours) + ' h', 'ok'), metric('Ciclos · apagados inseguros', nf(d.cycles) + ' · ' + nf(d.unsafe), d.unsafe ? 'note' : 'ok'), metric('Errores de medios', nf(d.mediaErr), medK), metric('Temperatura', d.temp + ' °C', 'ok')];
    const serial = d.serial ? (P.mask ? d.serial.slice(0, 6) + '•'.repeat(Math.max(4, d.serial.length - 6)) : d.serial) : '—';
    const identity = [['Modelo', d.model], ['Número de serie', serial, 1], ['Firmware', d.fw || '—', 1], ['Proveedor PCI', d.pciVendor || '—'], ['Versión NVMe', d.nvme || '—'], ['Capacidad', nf(d.bytes) + ' B'], ['Bloque lógico', d.lbaSize ? nf(d.lbaSize) + ' B' : '—'], ['Namespaces', d.namespaces != null ? String(d.namespaces) : '—'], ['Conexión', d.connLabel + ' · ' + d.link], ['Puente o gabinete', d.bridge || (d.internal ? 'Integrado' : '—')], ['Identificador', d.id, 1], ['OUI IEEE', d.oui || '—', 1]]
      .map(x => ({ k: x[0], v: x[1], font: x[2] ? 'var(--font-mono)' : 'inherit' }));
    const row = (name, val, raw, k, strong) => { const s = stK(k); return { name, val, raw, st: s[0], icon: s[1], fg: s[2], w: strong || k === 'crit' || k === 'warn' ? 600 : 400, bg: k === 'crit' || k === 'warn' ? 'var(--gray-3)' : 'transparent' }; };
    const smartRows = nd ? [] : [
      row('Vida útil restante', d.life + ' %', 'percentage_used = ' + d.used, d.life <= 20 ? 'warn' : 'ok'), row('Repuesto disponible', d.spare + ' %', 'available_spare = ' + d.spare, spareK), row('Umbral de repuesto', d.spareTh + ' %', 'available_spare_threshold = ' + d.spareTh, 'ok'),
      row('Datos escritos', d.writtenText, 'data_units_written = ' + nf(d.duWritten), 'ok'), row('Datos leídos', d.readText, 'data_units_read = ' + nf(d.duRead), 'ok'), row('Comandos de escritura', nf(d.hostWrites), 'host_writes', 'ok'), row('Comandos de lectura', nf(d.hostReads), 'host_reads', 'ok'), row('Tiempo ocupado del controlador', nf(d.busy) + ' min', 'controller_busy_time', 'ok'),
      row('Estado SMART general', d.critWarn ? 'Fallido' : 'Aprobado', 'smart_status.passed = ' + !d.critWarn, d.critWarn ? 'crit' : 'ok'), row('Advertencia crítica', '0x' + d.critWarn.toString(16).padStart(2, '0').toUpperCase(), 'critical_warning = ' + d.critWarn, d.critWarn ? 'crit' : 'ok'), row('Errores de medios', nf(d.mediaErr), 'media_errors = ' + d.mediaErr, medK), row('Entradas en el log de errores', d.errLogUnavailable ? 'No disponible' : nf(d.errLog), 'num_err_log_entries', d.errLog > 0 ? 'note' : 'ok'),
      row('Temperatura', d.temp + ' °C', 'temperature = ' + (d.temp + 273) + ' K', 'ok'), ...(d.sensors || []).map((v, i) => row('Sensor ' + (i + 1), v + ' °C', 'temperature_sensors[' + i + ']', 'ok')), row('Umbral de advertencia' + (d.estThresholds ? ' (estimado)' : ''), d.warnT + ' °C', 'wctemp', d.estThresholds ? 'note' : 'ok'), row('Umbral crítico' + (d.estThresholds ? ' (estimado)' : ''), d.critT + ' °C', 'cctemp', d.estThresholds ? 'note' : 'ok'),
      row('Tiempo sobre advertencia', nf(d.warnTime) + ' min', 'warning_temp_time', d.warnTime ? 'note' : 'ok'), row('Tiempo sobre crítica', nf(d.critTime) + ' min', 'critical_comp_time', d.critTime ? 'warn' : 'ok'),
      row('Horas de encendido', nf(d.hours) + ' h', 'power_on_hours', 'ok'), row('Ciclos de encendido', nf(d.cycles), 'power_cycles', 'ok'), row('Apagados inseguros', nf(d.unsafe), 'unsafe_shutdowns', d.unsafe ? 'note' : 'ok')];
    const flags = ['Repuesto bajo el umbral', 'Temperatura fuera de rango', 'Fiabilidad degradada', 'Modo solo lectura', 'Falla del respaldo de memoria volátil', 'Memoria persistente no confiable'].map((l, i) => { const on = !nd && !!(d.critWarn & (1 << i)); return { label: l, state: on ? 'Activa' : 'Inactiva', icon: on ? '#i-x' : '#i-check', fg: 'var(--gray-12)', w: on ? 700 : 400 }; });
    // temperature
    const se = this.series(d), top = Math.ceil((d.critT || 80) / 10) * 10 + 5, bot = 20, y = v => 150 - (v - bot) / (top - bot) * 140;
    const tPath = nd ? '' : se.pts.map((v, i) => (i ? 'L' : 'M') + (40 + i * 656 / 120).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const ticks = []; for (let v = bot; v <= top; v += 20) ticks.push({ y: y(v).toFixed(1), top: (y(v) / 170 * 100).toFixed(2) + '%', label: v + ' °C' });
    const mn = Math.min(...se.pts), mx = Math.max(...se.pts), av = se.pts.reduce((a, b) => a + b, 0) / se.pts.length;
    const temp = { path: tPath, ticks, yWarn: y(d.warnT || 70).toFixed(1), yCrit: y(d.critT || 80).toFixed(1), hWarn: (y(d.warnT || 70) - y(d.critT || 80)).toFixed(1), lwTop: ((y(d.warnT || 70) - 2) / 170 * 100).toFixed(2) + '%', warnLbl: 'Advertencia ' + d.warnT + ' °C · crítica ' + d.critT + ' °C' + (d.estThresholds ? ' (estimados)' : ''), x0: '0:00', x1: se.x1, caption: se.caption,
      stats: nd ? 'Sin datos de temperatura (SMART no disponible).' : 'Mínima ' + mn + ' °C · máxima ' + mx + ' °C · promedio ' + nf(av, 1) + ' °C · historial del disco: ' + nf(d.warnTime) + ' min sobre advertencia, ' + nf(d.critTime) + ' min sobre crítica.' };
    // scan
    const sc = M.scans[d.id]; let scan = { has: false, none: true, result: 'Sin escaneo', icon: '#i-info', fg: 'var(--text-secondary)', stats: [], ticks: [], diff: [], zones: [], marks: [] };
    if (sc) {
      const ys = v => 110 - v / 3200 * 100, pts = []; for (let i = 0; i <= 300; i++) { const q = i / 300; let v = sc.avg + Math.sin(q * 37) * 70 + Math.sin(q * 113) * 45; if (d.id === 'disk5') v = 1900 + Math.sin(q * 29) * 260; if (sc.zones.some(z => Math.abs(z[0] - q) < 0.004)) v = 40; pts.push((i ? 'L' : 'M') + (40 + q * 656).toFixed(1) + ' ' + ys(Math.max(sc.min, Math.min(sc.max, v))).toFixed(1)); }
      const ok = sc.result === 'passed';
      scan = { has: true, none: false, result: ok ? 'Aprobado' : 'Con errores', icon: ok ? '#i-check-circle' : '#i-alert', fg: 'var(--gray-12)', path: pts.join(' '),
        ticks: [0, 1000, 2000, 3000].map(v => ({ y: ys(v).toFixed(1), top: (ys(v) / 130 * 100).toFixed(2) + '%', label: nf(v) })),
        stats: [['Duración', sc.durationText], ['Promedio', nf(sc.avg) + ' MB/s'], ['Mínima', nf(sc.min) + ' MB/s'], ['Máxima', nf(sc.max) + ' MB/s'], ['Temp. máxima', sc.maxTemp + ' °C'], ['Zonas ilegibles', String(sc.zones.length)]].map(x => ({ k: x[0], v: x[1] })),
        zones: sc.zones.map(z => 'LBA ' + z[1] + '–' + z[2]), hasZones: sc.zones.length > 0, marks: sc.zones.map(z => { const x = 40 + z[0] * 656; return { d: 'M' + (x - 4).toFixed(1) + ' 118 L' + (x + 4).toFixed(1) + ' 118 L' + x.toFixed(1) + ' 111 Z' }; }),
        diff: [['Datos leídos', 'read'], ['Comandos de lectura', 'hostReads'], ['Temperatura', 'temp'], ['Errores de medios', 'media'], ['Entradas en el log de errores', 'errLog'], ['Repuesto disponible', 'spare'], ['Horas de encendido', 'hours']].map(([k, key]) => { const a = sc.before[key], b = sc.after[key], ch = a !== b; return { k, a, b, ch: ch ? '↑ cambió' : '= sin cambio', w: ch ? 700 : 400 }; }) };
    }
    // logs
    const logs = { hasErr: (d.errors || []).length > 0, err: (d.errors || []).map(e => ({ n: e[0], c: nf(+e[1]), q: e[2], cmd: e[3], s: e[4], lba: e[5], ns: e[6] })),
      errNote: nd ? 'No disponible (SMART no disponible por USB).' : d.errLogUnavailable ? 'Lectura parcial: este disco no permite leer el log de errores (GetLogPage falló).' : (d.errors || []).length === 0 ? 'Sin errores registrados.' : d.errLog > d.errors.length ? 'Se muestran las ' + d.errors.length + ' entradas más recientes de ' + nf(d.errLog) + '.' : '',
      st: (d.selftests || []).map(x => ({ t: x.type + ' · ' + x.result + ' · a las ' + nf(x.hours) + ' h' + (x.lba !== '—' ? ' · LBA ' + x.lba : ''), icon: x.ok ? '#i-check-circle' : '#i-alert' })).concat(d.selftestUnsupported || nd ? [{ t: nd ? 'No disponible.' : 'Este disco no admite autopruebas.', icon: '#i-info' }] : []) };
    const recs = { optimal: ['El disco está en excelente estado. No se requiere ninguna acción.', 'Vuelve a revisarlo en 6 meses o antes de cualquier transferencia importante.'], good: ['Desgaste moderado: el disco es apto para uso general.', 'Revisa la salud cada 3 meses y mantén respaldos al día.'], warning: ['Planifica el reemplazo del disco en las próximas semanas.', 'Respalda tus datos y no lo uses como único almacenamiento.'], critical: ['Respalda tus datos lo antes posible.', 'Reemplaza el disco: el repuesto está por debajo del umbral y la fiabilidad está degradada.', 'No lo uses para datos importantes ni lo revendas como disco en buen estado.'], nodata: ['No fue posible evaluar la salud: el puente USB no transmite SMART en macOS.', 'Repite la revisión con un gabinete Thunderbolt o USB4.'] }[d.verdict].slice();
    if (!nd && d.unsafe > 50) recs.push(nf(d.unsafe) + ' apagados inseguros: expulsa el disco antes de desconectarlo.');
    if (!nd && d.warnTime > 0) recs.push(nf(d.warnTime) + ' min históricos sobre la temperatura de advertencia: considera un gabinete con disipador.');
    const cmds = (S.cmds && S.cmds.length ? S.cmds : null) || [['10:41:52', 'smartctl --scan-open -j', '0 · Sin problemas'], ['10:41:53', 'smartctl -x -j ' + d.id, (d.exit || 0) + ' · ' + (d.exit === 0 ? 'Sin problemas' : M.exitBits.filter(b => d.exit & b.bit).map(b => b.label).join(' + '))]].concat(sc ? [['10:42:10', 'hdi-scan --full /dev/r' + d.id, '0 · ' + (sc.result === 'passed' ? 'Aprobado' : 'Con errores')], ['10:54:01', 'smartctl -x -j ' + d.id, (d.exit || 0) + ' · instantánea posterior']] : []).map(x => ({ t: x[0], cmd: x[1], exit: x[2] }));
    const showSmart = has('smart'), showP3 = has('temp') || has('tests');
    const quick = P.kind === 'quick';
    const total = quick ? 1 : 2 + (showSmart ? 1 : 0) + (showP3 ? 1 : 0);
    // Reporte rápido: el mismo cálculo que la ficha del expediente (src/domain/quickView.ts).
    const qv = quickView(d, { mask: P.mask, bench: (S.bench || {})[d.id], scan: sc });
    const spareOk = spareK;
    return {
      ...base, company: S.company || '', sc: S.smartctl || M.smartctl || {}, d, cap, v: { label: vb[0], icon: vb[1], fg: 'var(--gray-12)', solid: 'var(--gray-12)', bg: 'var(--gray-2)' },
      ring: { c: c.toFixed(2), off: (c * (1 - (nd ? 0 : d.life) / 100)).toFixed(2) }, lifeText: nd ? '—' : d.life + ' %', lifeCaption: nd ? 'sin datos' : 'vida útil',
      metrics, identity, smartRows, flags, critHex: nd ? '—' : '0x' + d.critWarn.toString(16).padStart(2, '0').toUpperCase(), hasSmart: !nd, noSmart: nd,
      temp, scan, logs, recs, cmds, appVersion: M.appVersion,
      showSummary: has('summary') && !nd, showIdentity: has('identity'), showSmart, showP3, showTemp: has('temp'), showTests: has('tests'), showLogs: has('logs'), showAppendix: has('appendix'),
      p4Title: has('logs') ? 'Registros, observaciones y apéndice' : 'Observaciones y apéndice',
      pSmart: 2, pP3: showSmart ? 3 : 2, total,
      quick, qv, qChips: qv.chips, qBench: qv.bench, qScan: qv.scan, hasTests: !!(qv.bench || qv.scan), spareK: spareOk, vKey: d.verdict || 'nodata', vLabel: vb[0], vIcon: vb[1]
    };
  }

  /** Reporte de varios discos (desviación #21). Sin lote guardado (vista previa o autoprueba), los discos de ejemplo. */
  batch() {
    const S = reportSource();
    if (S.batch?.items) return S.batch;
    const at = new Date(2026, 8, 24, 11, 2).getTime();
    return { items: (S.disks || []).map(d => ({ serial: d.serial || d.id, model: d.model, takenAt: at, disk: d })), extra: false };
  }
  batchVals() {
    const P = this.state.p, S = reportSource(), b = this.batch();
    const o = { extra: !!b.extra, th: b.th || DEFAULT_THRESHOLDS, order: b.order === 'given' ? 'given' as const : 'severity' as const };
    const { sum, pages } = batchLayout(b.items, { ...o, paper: P.paper });
    return { paper: P.paper === 'a4' ? 'a4' : 'letter', rid: P.id, date: S.date || '24 sep 2026, 11:02', tech: P.tech, title: P.client.trim() || 'Discos del expediente', company: S.company || '', sha: this.state.sha,
      appVersion: S.appVersion, sc: S.smartctl || {}, extra: o.extra, sum, att: sum.attention.slice(0, ATT_MAX), attMore: Math.max(0, sum.attention.length - ATT_MAX), pages, total: pages.length };
  }

  render() {
    if (this.state.p.kind === 'batch') return <BatchReport vm={this.batchVals()} />;
    const vm = this.renderVals();
    return vm.quick ? <QuickReport vm={vm} /> : <ProReport vm={vm} />;
  }
}
