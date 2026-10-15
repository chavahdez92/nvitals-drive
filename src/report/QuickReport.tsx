/**
 * Reporte rápido: una sola hoja (Carta/A4) centrada en la salud y la vida útil del SSD,
 * con identidad, uso (lecturas, escrituras, horas, ciclos), integridad y, si existen,
 * las últimas pruebas. Desviación #18 (docs/DESIGN_DEVIATIONS.md).
 * Usa el view-model de ReportController (vm.quick) y la paginación de <doc-page>.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react';
import type { VM } from '../ui/vm';

const nf = (n: number, d = 0) => Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

function Icon({ id, size = 12 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={id} />
    </svg>
  );
}

/** Anillo grande de vida útil restante. */
function LifeRing({ life, nodata }: { life: number; nodata: boolean }) {
  const r = 76;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (nodata ? 0 : Math.max(0, Math.min(100, life))) / 100);
  return (
    <div className="rq-ring">
      <svg viewBox="0 0 184 184">
        <circle cx="92" cy="92" r={r} fill="none" stroke="var(--gray-4)" strokeWidth="16" />
        <circle cx="92" cy="92" r={r} fill="none" stroke="var(--v-solid)" strokeWidth="16" strokeLinecap="round" strokeDasharray={c.toFixed(2)} strokeDashoffset={off.toFixed(2)} />
      </svg>
      <div className="rq-ring__val">
        <b>
          {nodata ? '—' : life}
          {nodata ? null : <small>%</small>}
        </b>
        <span>vida útil restante</span>
      </div>
    </div>
  );
}

/** Barra de nivel con marca de umbral opcional. */
function Meter({ label, value, pct, tone, mark, markLabel }: { label: string; value: string; pct: number; tone: string; mark?: number; markLabel?: string }) {
  return (
    <div className="rq-meter">
      <div className="rq-meter__top">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className="rq-meter__track">
        <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: tone }} />
        {mark != null ? <i style={{ left: `${mark}%` }} title={markLabel} /> : null}
      </div>
      {markLabel ? <small>{markLabel}</small> : null}
    </div>
  );
}

export function QuickReport({ vm }: { vm: VM }) {
  const d = vm.d || {};
  const nd = !!d.nodata;
  const vk = vm.vKey || 'nodata';
  const vars = {
    '--v-solid': `var(--health-${vk}-solid)`,
    '--v-bg': `var(--health-${vk}-bg)`,
    '--v-border': `var(--health-${vk}-border)`,
    '--v-fg': `var(--health-${vk}-fg)`,
  } as CSSProperties;
  const qv = vm.qv || {};
  const identity: [string, string, boolean?][] = qv.identity || [];
  const readPct: number = qv.readPct ?? 50;
  const kpis: any[] = qv.kpis || [];
  const spareTone = vm.spareK === 'crit' ? 'var(--health-critical-solid)' : vm.spareK === 'warn' ? 'var(--health-warning-solid)' : 'var(--health-optimal-solid)';

  return (
    <div className="rp rq" data-theme="light" data-component="QuickReport" data-variant={vm.paper} style={vars}>
      <doc-page size={vm.paper}>
        <section className="page">
          {/* Encabezado */}
          <div className="rq-head">
            <div className="rq-head__id rq-head__id--logo">
              <img className="rp-logo" src="assets/nvitals-logo.svg" alt="NVitals Drive" />
              <span>{vm.company || 'Diagnóstico de salud de SSD'}</span>
            </div>
            <div className="rq-head__doc">
              <span className="rq-tag">
                <Icon id="#i-bolt" size={11} />
                Reporte rápido
              </span>
              <strong className="mono">{vm.rid}</strong>
              <span>
                {vm.date}
                {vm.tech ? ` · ${vm.tech}` : ''}
              </span>
            </div>
          </div>
          <div className="rp-rule" />

          <div className="rq-title">
            <h1>{d.model}</h1>
            <p>
              {[qv.brand && qv.brand !== '—' ? qv.brand : null, vm.cap, d.connLabel].filter(Boolean).join(' · ')}
              {vm.client ? <span className="rq-ref"> · {vm.client}</span> : null}
            </p>
          </div>

          {/* Héroe: salud y vida útil */}
          <div className="rq-hero">
            <LifeRing life={d.life || 0} nodata={nd} />
            <div className="rq-hero__body">
              <span className="rq-verdict">
                <Icon id={vm.vIcon || '#i-info'} size={13} />
                {vm.vLabel}
              </span>
              <p className="rq-sentence">{nd ? d.reason || d.sentence : d.sentence}</p>
              {nd ? null : (
                <div className="rq-meters">
                  <Meter label="Vida útil restante" value={`${d.life} %`} pct={d.life} tone="var(--v-solid)" markLabel={`Desgaste acumulado: ${d.used} %`} />
                  <Meter label="Repuesto disponible" value={`${d.spare} %`} pct={d.spare} tone={spareTone} mark={d.spareTh} markLabel={`Umbral del fabricante: ${d.spareTh} %`} />
                </div>
              )}
            </div>
            {nd ? null : (
              <div className="rq-hero__facts">
                <div>
                  <span>Estado SMART</span>
                  <b>{d.critWarn ? 'Fallido' : 'Aprobado'}</b>
                </div>
                <div>
                  <span>Temperatura</span>
                  <b>{d.temp} °C</b>
                </div>
                <div>
                  <span>Errores de medios</span>
                  <b>{nf(d.mediaErr)}</b>
                </div>
              </div>
            )}
          </div>

          {/* Uso */}
          <div>
            <div className="rp-h">
              <h2>Uso del disco</h2>
              <small>Contadores de por vida registrados por el controlador</small>
            </div>
            <div className="rq-kpis">
              {kpis.map((k) => (
                <div key={k.label} className="rq-kpi">
                  <span className="rq-kpi__ic">
                    <Icon id={k.icon} size={14} />
                  </span>
                  <span className="rq-kpi__l">{k.label}</span>
                  <b>{k.value}</b>
                  <small>{k.sub}</small>
                </div>
              ))}
            </div>
            {!qv.hasSplit ? null : (
              <div className="rq-split">
                <div className="rq-split__bar">
                  <span className="r" style={{ width: `${readPct}%` }} />
                  <span className="w" style={{ width: `${100 - readPct}%` }} />
                </div>
                <div className="rq-split__lg">
                  <span>
                    <i className="r" />
                    Lectura {nf(readPct)} %
                  </span>
                  <span>
                    <i className="w" />
                    Escritura {nf(100 - readPct)} %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Identidad + integridad */}
          <div className="rq-cols">
            <div>
              <div className="rp-h">
                <h2>Identidad</h2>
              </div>
              <div className="rq-id">
                {identity.map(([k, v, mono]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b className={mono ? 'mono' : undefined}>{v}</b>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="rp-h">
                <h2>Errores e integridad</h2>
              </div>
              {nd ? (
                <p className="rq-muted">Sin datos SMART: no es posible evaluar errores con esta conexión.</p>
              ) : (
                <div className="rq-chips">
                  {(vm.qChips || []).map((c: any) => (
                    <div key={c.label} className={'rq-chip ' + c.k}>
                      <span className="rq-chip__top">
                        <Icon id={c.icon} size={12} />
                        {c.label}
                      </span>
                      <b>{c.value}</b>
                      <small>{c.note}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pruebas recientes (solo si existen) */}
          {vm.hasTests ? (
            <div className="rq-tests">
              {vm.qBench ? (
                <div>
                  <Icon id="#i-bolt" size={13} />
                  <span>
                    <b>Benchmark</b> · lectura {vm.qBench.read} MB/s · escritura {vm.qBench.write} MB/s
                    {vm.qBench.pct != null ? ` · ${vm.qBench.pct} % del techo de la conexión (~${vm.qBench.ceiling} MB/s)` : ''}
                  </span>
                </div>
              ) : null}
              {vm.qScan ? (
                <div>
                  <Icon id={vm.qScan.ok ? '#i-check-circle' : '#i-alert'} size={13} />
                  <span>
                    <b>Escaneo de lectura</b> · {vm.qScan.label} · {vm.qScan.dur} · {vm.qScan.avg} MB/s promedio
                    {vm.qScan.zones ? ` · ${vm.qScan.zones} zonas ilegibles` : ''}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Recomendación */}
          <div className="rq-rec">
            <Icon id="#i-info" size={14} />
            <div>
              {(vm.recs || []).slice(0, 2).map((r: string) => (
                <p key={r}>{r}</p>
              ))}
            </div>
          </div>

          <footer className="rp-foot rq-foot">
            <span>
              <b>NVitals Drive {vm.appVersion}</b> · smartctl {vm.sc?.version || '—'}
              {vm.company ? ` · ${vm.company}` : ''}
            </span>
            <span className="mono">
              SHA-256 {String(vm.sha || '').slice(0, 12)}… · {vm.rid}
            </span>
          </footer>
        </section>
      </doc-page>
    </div>
  );
}
