// Benchmark en vivo y resultados (desviación #17). No existe en el prototipo: usa sus
// tokens (--data-read / --data-write, --chart-*, --dur-*, --ease-out, --stagger),
// tipografía y superficies, y respeta el movimiento reducido.
import { useEffect, useRef, useState } from 'react';
import { nf } from '../../domain/format';
import { css } from '../runtime/styles';
import { SpeedPathPanel } from './SpeedPathPanel';

const READ = 'var(--data-read)';
const WRITE = 'var(--data-write)';
const colorOf = (write: boolean) => (write ? WRITE : READ);
const HINT: Record<string, string> = {
  'SEQ1M Q8T1': 'Secuencial · archivos grandes',
  'SEQ1M Q1T1': 'Secuencial sin cola',
  'RND4K Q32T1': 'Aleatorio · carga intensa',
  'RND4K Q1T1': 'Aleatorio · uso diario',
};
const SHORT: Record<string, string> = { 'SEQ1M Q8T1': 'SEQ Q8', 'SEQ1M Q1T1': 'SEQ Q1', 'RND4K Q32T1': '4K Q32', 'RND4K Q1T1': '4K Q1' };

function reducedMotion(): boolean {
  const a = document.querySelector('[data-hdi-root]')?.getAttribute('data-motion');
  if (a === 'reduced') return true;
  if (a === 'full') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Interpola un número hacia su objetivo (contador animado). */
function useTween(target: number | null, dur = 500, from = 0): number {
  const [v, setV] = useState(target == null ? 0 : from);
  const cur = useRef(v);
  useEffect(() => {
    if (target == null) return;
    if (reducedMotion()) { cur.current = target; setV(target); return; }
    const a = cur.current, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      cur.current = a + (target - a) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/** Máximo "redondo" para un eje. */
function niceMax(v: number): number {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => x * p >= v) || 10;
  return m * p;
}

/** Curva suave (Catmull-Rom → Bézier) por los puntos. */
function smooth(pts: [number, number][]): string {
  if (!pts.length) return '';
  if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/* ── Medidor radial ── */
function Gauge({ value, max, ceiling, write, label, sub }: { value: number | null; max: number; ceiling: number | null; write: boolean; label: string; sub: string }) {
  const tv = useTween(value, 480);
  const R = 92, CX = 120, CY = 116, SWEEP = 270, START = 135;
  const pt = (deg: number, r = R) => [CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180)];
  const [sx, sy] = pt(START), [ex, ey] = pt(START + SWEEP);
  const arc = `M${sx.toFixed(1)} ${sy.toFixed(1)} A${R} ${R} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  const frac = Math.max(0, Math.min(1, (value ?? 0) / max));
  const cFrac = ceiling ? Math.min(1, ceiling / max) : null;
  const color = colorOf(write);
  const gid = write ? 'hdi-g-w' : 'hdi-g-r';
  return (
    <div style={css("position:relative;width:240px;height:220px;flex:none")}>
      <svg viewBox="0 0 240 220" width="240" height="220" role="img" aria-label={`${label}: ${nf(value ?? 0)} MB/s`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={color} stopOpacity="0.55" />
            <stop offset="1" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {Array.from({ length: 28 }, (_, i) => {
          const deg = START + (SWEEP * i) / 27;
          const [x1, y1] = pt(deg, R + 14), [x2, y2] = pt(deg, R + (i % 3 === 0 ? 20 : 17));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} style={css(`stroke:${i / 27 <= frac ? color : 'var(--chart-grid)'};stroke-width:1.5;transition:stroke var(--dur-base) var(--ease-out)`)} />;
        })}
        <path d={arc} fill="none" style={css("stroke:var(--ring-track);stroke-width:14;stroke-linecap:round")} />
        <path data-bench-anim="" d={arc} fill="none" pathLength={100} stroke={`url(#${gid})`}
          style={css(`stroke-width:14;stroke-linecap:round;stroke-dasharray:100 100;stroke-dashoffset:${(100 - frac * 100).toFixed(2)};transition:stroke-dashoffset 480ms var(--ease-out);filter:drop-shadow(0 0 6px ${color})`)} />
        {cFrac != null ? (() => {
          const deg = START + SWEEP * cFrac;
          const [x1, y1] = pt(deg, R - 11), [x2, y2] = pt(deg, R + 11);
          return (
            <line x1={x1} y1={y1} x2={x2} y2={y2} style={css("stroke:var(--health-warning-solid);stroke-width:3;stroke-linecap:round")}>
              <title>Techo de la conexión</title>
            </line>
          );
        })() : null}
        <text x={sx - 4} y={sy + 18} textAnchor="middle" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>0</text>
        <text x={ex + 4} y={ey + 18} textAnchor="middle" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>{nf(max)}</text>
      </svg>
      <div style={css("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:6px;pointer-events:none")}>
        <span style={css(`display:inline-flex;align-items:center;gap:4px;font-size:var(--type-note-size);font-weight:600;color:${color}`)}>
          <svg width="11" height="11"><use href={write ? '#i-arrow-up' : '#i-arrow-down'} /></svg>
          {label}
        </span>
        <span style={css("font-family:var(--font-display);font-size:44px;line-height:48px;font-weight:700;letter-spacing:-0.03em;font-variant-numeric:tabular-nums")}>
          {value == null ? '—' : nf(tv, tv < 100 ? 1 : 0)}
        </span>
        <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);font-weight:500")}>MB/s</span>
        <span style={css("margin-top:4px;font-size:var(--type-note-size);color:var(--text-tertiary);font-variant-numeric:tabular-nums")}>{sub}</span>
      </div>
    </div>
  );
}

/* ── Gráfica de la prueba en curso ── */
function LiveChart({ series, durMs, write, ceiling, showCeiling }: { series: any[]; durMs: number; write: boolean; ceiling: number | null; showCeiling: boolean }) {
  const W = 560, H = 220, X0 = 44, X1 = W - 12, Y0 = 16, Y1 = H - 28;
  const peak = Math.max(1, ...series.map((s) => s.mbps));
  const yMax = niceMax(Math.max(peak * 1.15, showCeiling && ceiling ? ceiling * 1.08 : 0));
  const x = (ms: number) => X0 + Math.min(1, ms / durMs) * (X1 - X0);
  const y = (v: number) => Y1 - (v / yMax) * (Y1 - Y0);
  const pts: [number, number][] = series.map((s) => [x(s.ms), y(s.mbps)]);
  const line = smooth(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)} ${Y1} L${pts[0][0].toFixed(1)} ${Y1} Z` : '';
  const head = pts[pts.length - 1];
  const color = colorOf(write);
  const gid = write ? 'hdi-a-w' : 'hdi-a-r';
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * yMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={css("display:block;overflow:visible")} role="img" aria-label="Velocidad en vivo">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={X0} x2={X1} y1={y(v)} y2={y(v)} style={css("stroke:var(--chart-grid)")} />
          <text x={X0 - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans);font-variant-numeric:tabular-nums")}>
            {v >= 1000 ? nf(v / 1000, v % 1000 ? 1 : 0) + 'k' : nf(v)}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((k) => (
        <text key={k} x={X0 + k * (X1 - X0)} y={H - 8} textAnchor={k === 0 ? 'start' : k === 1 ? 'end' : 'middle'} style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>
          {nf((k * durMs) / 1000, 1)} s
        </text>
      ))}
      {showCeiling && ceiling && ceiling <= yMax ? (
        <g>
          <line x1={X0} x2={X1} y1={y(ceiling)} y2={y(ceiling)} style={css("stroke:var(--health-warning-solid);stroke-width:1.5;stroke-dasharray:5 5")} />
          <text x={X1} y={y(ceiling) - 6} textAnchor="end" style={css("fill:var(--health-warning-fg);font-size:10px;font-weight:600;font-family:var(--font-sans)")}>
            Techo de la conexión · ~{nf(ceiling)} MB/s
          </text>
        </g>
      ) : null}
      {area ? <path d={area} fill={`url(#${gid})`} /> : null}
      {line ? <path d={line} fill="none" style={css(`stroke:${color};stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round`)} /> : null}
      {head ? (
        <g transform={`translate(${head[0].toFixed(1)} ${head[1].toFixed(1)})`}>
          <circle data-bench-anim="" r="10" fill={color} style={css("opacity:.25;transform-box:fill-box;transform-origin:center;animation:hdi-listen 1.6s ease-out infinite")} />
          <circle r="4.5" fill={color} style={css("stroke:var(--surface-raised);stroke-width:2")} />
        </g>
      ) : (
        <text x={(X0 + X1) / 2} y={(Y0 + Y1) / 2} textAnchor="middle" style={css("fill:var(--text-tertiary);font-size:12px;font-family:var(--font-sans);animation:hdi-shimmer 1.4s ease-in-out infinite")}>
          Preparando el archivo de prueba…
        </text>
      )}
    </svg>
  );
}

/* ── Mini gráfica de estabilidad ── */
function Spark({ series, write, w = 96, h = 26 }: { series: any[]; write: boolean; w?: number; h?: number }) {
  if (series.length < 2) return <svg width={w} height={h} />;
  const mx = Math.max(...series.map((s) => s.mbps)) || 1;
  const last = series[series.length - 1].ms || 1;
  const pts: [number, number][] = series.map((s) => [(s.ms / last) * (w - 2) + 1, h - 2 - (s.mbps / mx) * (h - 6)]);
  const d = smooth(pts);
  return (
    <svg width={w} height={h} aria-hidden="true" style={css("flex:none;overflow:visible")}>
      <path d={`${d} L${w - 1} ${h} L1 ${h} Z`} fill={colorOf(write)} style={css("opacity:.14")} />
      <path d={d} fill="none" style={css(`stroke:${colorOf(write)};stroke-width:1.5;stroke-linejoin:round`)} />
    </svg>
  );
}

/* ── Fila de una prueba dentro de la tarjeta del perfil ── */
function JobRow({ job, live }: { job: any; live: any }) {
  const running = job.state === 'running';
  const value = running ? live?.mbps ?? null : job.mbps;
  const tv = useTween(value, running ? 450 : 900);
  const color = colorOf(job.write);
  const isRnd = job.key.startsWith('RND');
  const sub = job.state === 'done'
    ? isRnd ? `${nf(job.iops / 1000, 1)}k IOPS · ${nf(job.latUs)} µs` : `${nf(job.latUs / 1000, 2)} ms de latencia`
    : running ? (live ? (isRnd ? `${nf(live.iops)} IOPS` : 'midiendo…') : 'preparando…') : 'en espera';
  return (
    <div style={css(`position:relative;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r-md);overflow:hidden;transition:background var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out);background:${running ? `color-mix(in oklch, ${color} 14%, transparent)` : 'transparent'};opacity:${job.state === 'pending' ? 0.45 : 1}`)}>
      {running ? <span data-bench-anim="" aria-hidden="true" style={css(`position:absolute;inset:0;box-shadow:inset 0 0 0 1px ${color};border-radius:var(--r-md);animation:hdi-shimmer 1.4s ease-in-out infinite`)} /> : null}
      <span style={css(`flex:none;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:color-mix(in oklch, ${color} 18%, transparent);color:${color}`)}>
        <svg width="12" height="12"><use href={job.write ? '#i-arrow-up' : '#i-arrow-down'} /></svg>
      </span>
      <span style={css("flex:1;display:flex;flex-direction:column;min-width:0")}>
        <span style={css("display:flex;align-items:baseline;gap:5px")}>
          <span style={css("font-size:var(--type-title3-size);font-weight:650;font-variant-numeric:tabular-nums")}>{value == null ? '—' : nf(tv, tv < 100 ? 1 : 0)}</span>
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>MB/s</span>
          {job.state === 'done' ? (
            <svg data-anim="pop" width="12" height="12" style={css(`margin-left:auto;color:${color}`)}><use href="#i-check" /></svg>
          ) : null}
        </span>
        <span style={css("font-size:var(--type-caption-size);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{sub}</span>
      </span>
      <Spark series={job.series} write={job.write} w={72} h={24} />
    </div>
  );
}

/* ── Barras de resultados (crecen desde cero, escalonadas) ── */
function ResultBars({ title, unit, rows, max, ceiling, fmt }: { title: string; unit: string; rows: any[]; max: number; ceiling?: number | null; fmt: (v: number) => string }) {
  return (
    <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-subtle)")}>
      <span style={css("display:flex;justify-content:space-between;align-items:baseline")}>
        <strong style={css("font-weight:600")}>{title}</strong>
        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>{unit}</span>
      </span>
      <div style={css("position:relative;display:flex;flex-direction:column;gap:12px")}>
        {ceiling && ceiling <= max ? (
          <span aria-hidden="true" style={css(`position:absolute;top:-4px;bottom:-4px;left:calc(76px + (100% - 76px - 72px) * ${(ceiling / max).toFixed(4)});border-left:1.5px dashed var(--health-warning-solid);z-index:1`)}>
            <span style={css("position:absolute;bottom:-16px;left:4px;white-space:nowrap;font-size:9px;font-weight:600;color:var(--health-warning-fg)")}>techo</span>
          </span>
        ) : null}
        {rows.map((r, i) => (
          <div key={r.key} style={css("display:grid;grid-template-columns:68px minmax(0,1fr);gap:8px;align-items:center")}>
            <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);font-weight:600")}>{SHORT[r.key]}</span>
            <div style={css("display:flex;flex-direction:column;gap:4px")}>
              {[r.read, r.write].map((v: number | null, k: number) => (
                <BarLine key={k} v={v} max={max} write={k === 1} delay={(i * 2 + k) * 70} fmt={fmt} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarLine({ v, max, write, delay, fmt }: { v: number | null; max: number; write: boolean; delay: number; fmt: (v: number) => string }) {
  const tv = useTween(v, 1100);
  const w = v ? Math.max(0.01, Math.min(1, v / max)) : 0;
  return (
    <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 64px;gap:8px;align-items:center")}>
      <span style={css("height:10px;border-radius:5px;background:var(--ring-track);overflow:hidden")}>
        <span data-bench-anim="" style={css(`display:block;height:100%;width:${(w * 100).toFixed(2)}%;border-radius:5px;background:linear-gradient(90deg, color-mix(in oklch, ${colorOf(write)} 55%, transparent), ${colorOf(write)});transform-origin:left;animation:hdi-grow 1.1s var(--ease-out) ${delay}ms backwards;transition:width 600ms var(--ease-out)`)} />
      </span>
      <span style={css(`text-align:right;font-size:var(--type-callout-size);font-weight:600;font-variant-numeric:tabular-nums;color:${v == null ? 'var(--text-tertiary)' : 'var(--text-primary)'}`)}>
        {v == null ? '—' : fmt(tv)}
      </span>
    </div>
  );
}

export function BenchView({ b }: { b: any }) {
  if (!b) return null;
  const jobs: any[] = b.jobs || [];
  const cur = jobs[b.i] || jobs[0];
  const liveWrite = b.live ? b.live.write : !!cur?.write;
  const isSeq = cur ? cur.key.startsWith('SEQ') : true;
  const series = cur?.series || [];
  const gaugeMax = isSeq
    ? niceMax(Math.max(b.ceiling || 0, ...jobs.filter((j) => j.key.startsWith('SEQ')).map((j) => j.mbps || 0), b.live?.mbps || 0) * 1.05)
    : niceMax(Math.max(1, ...series.map((s: any) => s.mbps), b.live?.mbps || 0) * 1.3);
  const profiles = Array.from(new Set(jobs.map((j) => j.key)));
  const byKey = (k: string, w: boolean) => jobs.find((j) => j.key === k && j.write === w);
  const seqRows = profiles.filter((k) => k.startsWith('SEQ')).map((k) => ({ key: k, read: byKey(k, false)?.mbps ?? null, write: byKey(k, true)?.mbps ?? null }));
  const rndRows = profiles.filter((k) => k.startsWith('RND')).map((k) => ({ key: k, read: byKey(k, false)?.iops ?? null, write: byKey(k, true)?.iops ?? null }));
  const seqMax = niceMax(Math.max(b.ceiling || 0, ...seqRows.flatMap((r) => [r.read || 0, r.write || 0])) * 1.05);
  const rndMax = niceMax(Math.max(1, ...rndRows.flatMap((r) => [r.read || 0, r.write || 0])) * 1.05);

  return (
    <div data-component="BenchView" style={css("display:flex;flex-direction:column;gap:18px")}>
      {b.running ? (
        <>
          {/* Línea de tiempo de las 8 pruebas */}
          <div role="progressbar" aria-label="Progreso del benchmark" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((b.i + b.jobP) / b.total) * 100)} style={css("display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px")}>
            {jobs.map((j) => {
              const p = j.state === 'done' ? 1 : j.state === 'running' ? b.jobP : 0;
              return (
                <div key={j.idx} style={css("display:flex;flex-direction:column;gap:4px;min-width:0")}>
                  <span style={css("height:6px;border-radius:3px;background:var(--ring-track);overflow:hidden")}>
                    <span data-bench-anim="" style={css(`display:block;height:100%;width:100%;background:${colorOf(j.write)};transform-origin:left;transform:scaleX(${p.toFixed(3)});transition:transform 260ms linear;opacity:${j.state === 'pending' ? 0.4 : 1}`)} />
                  </span>
                  <span style={css(`display:flex;align-items:center;gap:3px;font-size:var(--type-caption-size);white-space:nowrap;overflow:hidden;color:${j.state === 'running' ? colorOf(j.write) : 'var(--text-tertiary)'};font-weight:${j.state === 'running' ? 600 : 400}`)}>
                    <svg width="9" height="9" style={css("flex:none")}><use href={j.write ? '#i-arrow-up' : '#i-arrow-down'} /></svg>
                    {SHORT[j.key]}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Medidor + gráfica en vivo */}
          <div style={css("display:flex;gap:20px;align-items:center;padding:16px 18px;border-radius:var(--r-lg);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-subtle)")}>
            <Gauge value={b.live?.mbps ?? null} max={gaugeMax} ceiling={isSeq ? b.ceiling : null} write={liveWrite}
              label={liveWrite ? 'Escritura' : 'Lectura'} sub={b.live ? (isSeq ? (b.ceiling ? `${Math.round((b.live.mbps / b.ceiling) * 100)} % del techo` : '') : `${nf(b.live.iops)} IOPS`) : cur ? HINT[cur.key] : ''} />
            <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:8px")}>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px")}>
                <span style={css("display:flex;flex-direction:column;gap:1px")}>
                  <span style={css(`font-family:var(--font-mono);font-weight:600;color:${colorOf(liveWrite)}`)}>{cur?.key} · {liveWrite ? 'escritura' : 'lectura'}</span>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>{cur ? HINT[cur.key] : ''} · prueba {b.i + 1} de {b.total}</span>
                </span>
                <span style={css("display:flex;gap:16px;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  <span>Transcurrido <strong style={css("color:var(--text-primary);font-weight:600;font-variant-numeric:tabular-nums")}>{b.elapsed}</strong></span>
                  <span>Restante <strong style={css("color:var(--text-primary);font-weight:600;font-variant-numeric:tabular-nums")}>{b.remaining}</strong></span>
                  <span>Temp. <strong style={css("color:var(--text-primary);font-weight:600")}>{b.temp}</strong></span>
                </span>
              </div>
              <LiveChart series={series} durMs={(b.secs - 1) * 1000} write={liveWrite} ceiling={b.ceiling} showCeiling={isSeq} />
            </div>
          </div>
        </>
      ) : (
        <div data-anim="rise" style={css("display:flex;gap:12px")}>
          <ResultBars title="Secuencial" unit="MB/s · bloques de 1 MB" rows={seqRows} max={seqMax} ceiling={b.ceiling} fmt={(v) => nf(v)} />
          <ResultBars title="Aleatorio 4K" unit="IOPS · bloques de 4 KB" rows={rndRows} max={rndMax} fmt={(v) => (v >= 1000 ? nf(v / 1000, 1) + 'k' : nf(v))} />
        </div>
      )}
      {/* Tarjetas por perfil */}
      <div style={css("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px")}>
        {profiles.map((k, i) => {
          const active = jobs.some((j) => j.key === k && j.state === 'running');
          return (
            <div key={k} data-anim="rise" data-anim-delay={i * 40} style={css(`display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:var(--r-lg);background:var(--surface-raised-2);box-shadow:${active ? 'var(--shadow-2), inset 0 0 0 1px var(--accent-border)' : 'inset 0 0 0 0.5px var(--border-subtle)'};transform:${active ? 'translateY(-2px)' : 'none'};transition:box-shadow var(--dur-moderate) var(--ease-out), transform var(--dur-moderate) var(--ease-out)`)}>
              <span style={css("display:flex;flex-direction:column;gap:1px;padding:0 2px")}>
                <span style={css("font-family:var(--font-mono);font-weight:600")}>{k}</span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>{HINT[k]}</span>
              </span>
              {[false, true].map((w) => {
                const j = byKey(k, w);
                return j ? <JobRow key={String(w)} job={j} live={j.state === 'running' ? b.live : null} /> : null;
              })}
            </div>
          );
        })}
      </div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
        <span style={css("display:flex;gap:14px")}>
          <span style={css("display:inline-flex;align-items:center;gap:5px")}><span style={css(`width:10px;height:3px;border-radius:2px;background:${READ}`)} />Lectura</span>
          <span style={css("display:inline-flex;align-items:center;gap:5px")}><span style={css(`width:10px;height:3px;border-radius:2px;background:${WRITE}`)} />Escritura</span>
          <span style={css("display:inline-flex;align-items:center;gap:5px")}><span style={css("width:10px;border-top:1.5px dashed var(--health-warning-solid)")} />Techo de la conexión</span>
        </span>
        <span>{b.meta}</span>
      </div>
      <div style={css("padding-top:14px;border-top:0.5px solid var(--border-subtle)")}>
        <SpeedPathPanel sp={b.path} />
      </div>
    </div>
  );
}

