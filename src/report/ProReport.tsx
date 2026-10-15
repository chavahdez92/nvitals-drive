/**
 * Reporte de salud de SSD — diseño profesional para impresión (Carta/A4).
 * Sustituye a la plantilla del prototipo por petición del usuario (docs/DESIGN_DEVIATIONS.md #12).
 * Usa el mismo view-model de ReportController y la paginación explícita de <doc-page>.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties, ReactNode } from 'react';
import type { VM } from '../ui/vm';

const KIND: Record<string, string> = { Normal: 'ok', Nota: 'note', Atención: 'warn', Crítico: 'crit' };
const ICON: Record<string, string> = { ok: '#i-check-circle', note: '#i-info', warn: '#i-alert', crit: '#i-octagon' };

const GROUPS: [string, RegExp][] = [
  ['Desgaste', /^(Vida útil|Repuesto|Umbral de repuesto)/],
  ['Uso', /^(Datos|Comandos|Tiempo ocupado)/],
  ['Integridad', /^(Estado SMART|Advertencia|Errores de medios|Entradas)/],
  ['Térmico', /^(Temperatura|Sensor|Umbral de advertencia|Umbral crítico|Tiempo sobre)/],
  ['Energía', /^(Horas|Ciclos|Apagados)/],
];

function Icon({ id, size = 12 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={id} />
    </svg>
  );
}

function Pill({ st }: { st: string }) {
  const k = KIND[st] || 'note';
  return (
    <span className={'rp-pill ' + k}>
      <Icon id={ICON[k]} size={10} />
      {st}
    </span>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="rp-h">
        <h2>{title}</h2>
        {aside ? <small>{aside}</small> : null}
      </div>
      {children}
    </div>
  );
}

function RunningHeader({ vm, title }: { vm: VM; title: string }) {
  return (
    <header className="rp-run">
      <span className="rp-run__l">
        <img src="assets/app-icon.svg" alt="" />
        <b>{title}</b>
        <span>· {vm.d?.model}</span>
      </span>
      <span className="mono">{vm.rid}</span>
    </header>
  );
}

function Footer({ vm, page }: { vm: VM; page: number }) {
  return (
    <footer className="rp-foot">
      <span>
        <b>NVitals Drive {vm.appVersion}</b> · smartctl {vm.sc?.version || '—'}
        {vm.company ? ` · ${vm.company}` : ''}
      </span>
      <span>
        {vm.rid} · Página {page} de {vm.total}
      </span>
    </footer>
  );
}

function groupedRows(rows: any[]) {
  const out: { title: string; rows: any[] }[] = [];
  for (const r of rows) {
    const g = GROUPS.find(([, re]) => re.test(r.name))?.[0] || 'Otros';
    let bucket = out.find((b) => b.title === g);
    if (!bucket) out.push((bucket = { title: g, rows: [] }));
    bucket.rows.push(r);
  }
  return out;
}

export function ProReport({ vm }: { vm: VM }) {
  const d = vm.d || {};
  const vk = d.verdict || 'nodata';
  const vars = {
    '--v-solid': `var(--health-${vk}-solid)`,
    '--v-bg': `var(--health-${vk}-bg)`,
    '--v-border': `var(--health-${vk}-border)`,
    '--v-fg': `var(--health-${vk}-fg)`,
  } as CSSProperties;
  const ringC = 2 * Math.PI * 50;
  const life = d.nodata ? 0 : d.life || 0;
  const facts = d.nodata
    ? [['Capacidad', vm.cap], ['Conexión', d.connLabel], ['Identificador', d.id]]
    : [['Datos escritos', d.writtenText], ['Horas de uso', `${Number(d.hours || 0).toLocaleString('es-MX')} h`], ['Temperatura', `${d.temp} °C`], ['Errores de medios', String(d.mediaErr ?? 0)]];

  return (
    <div className="rp" data-theme="light" data-component="ReportDocument" data-variant={vm.paper} style={vars}>
      <doc-page size={vm.paper}>
        {/* ── Página 1 · Veredicto, métricas e identidad ── */}
        <section className="page">
          <div className="rp-brand">
            <div className="rp-brand__id rp-brand__id--logo">
              <img className="rp-logo" src="assets/nvitals-logo.svg" alt="NVitals Drive" />
              <div className="rp-brand__org">{vm.company || 'Diagnóstico de salud de SSD'}</div>
            </div>
            <div className="rp-brand__doc">
              Reporte de salud de SSD
              <strong>{vm.rid}</strong>
            </div>
          </div>
          <div className="rp-rule" />

          <div className="rp-title">
            <h1>{d.model}</h1>
            <p>
              {vm.cap} · {d.connLabel} · {d.link}
            </p>
          </div>

          <div className="rp-meta">
            <div>
              <span>Fecha</span>
              <b>{vm.date}</b>
            </div>
            <div>
              <span>Técnico</span>
              <b>{vm.tech || '—'}</b>
            </div>
            <div>
              <span>Referencia</span>
              <b>{vm.client || '—'}</b>
            </div>
            <div>
              <span>Número de serie</span>
              <b className="mono">{vm.identity?.find((x: any) => x.k === 'Número de serie')?.v || '—'}</b>
            </div>
          </div>

          <div className="rp-verdict">
            <div className="rp-ring">
              <svg width="116" height="116" viewBox="0 0 116 116">
                <circle cx="58" cy="58" r="50" fill="none" stroke="var(--gray-4)" strokeWidth="10" />
                {!d.nodata ? (
                  <circle cx="58" cy="58" r="50" fill="none" stroke="var(--v-solid)" strokeWidth="10" strokeLinecap="round" strokeDasharray={ringC.toFixed(2)} strokeDashoffset={(ringC * (1 - life / 100)).toFixed(2)} />
                ) : null}
              </svg>
              <div className="rp-ring__val">
                <b>
                  {d.nodata ? '—' : life}
                  {d.nodata ? null : <small>%</small>}
                </b>
                <span>{vm.lifeCaption}</span>
              </div>
            </div>
            <div>
              <span className="rp-verdict__label">
                <Icon id={vm.v?.icon} size={13} />
                {vm.v?.label}
              </span>
              <p className="rp-verdict__text">{d.sentence}</p>
              <div className="rp-verdict__sub">Veredicto determinado por reglas a partir de los datos SMART; la vida útil es 100 − «Percentage Used».</div>
            </div>
            <div className="rp-facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>

          {vm.showSummary && vm.metrics?.length ? (
            <Section title="Métricas clave">
              <div className="rp-metrics">
                {vm.metrics.map((m: any) => (
                  <div className="rp-metric" key={m.label}>
                    <span>{m.label}</span>
                    <b>{m.value}</b>
                    <Pill st={m.st} />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {vm.showIdentity ? (
            <Section title="Identidad del disco">
              <div className="rp-dl">
                {(vm.identity || []).map((x: any) => (
                  <div key={x.k}>
                    <span>{x.k}</span>
                    <b className={x.font === 'var(--font-mono)' ? 'mono' : undefined}>{x.v}</b>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <Footer vm={vm} page={1} />
        </section>

        {/* ── Página 2 · Salud SMART ── */}
        {vm.showSmart ? (
          <section className="page">
            <RunningHeader vm={vm} title="Salud SMART" />
            {vm.hasSmart ? (
              <>
                <Section title="Log de salud NVMe" aside="smartctl -x · página 0x02">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Atributo</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                        <th>Campo · crudo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedRows(vm.smartRows || []).map((g) => [
                        <tr className="group" key={'g' + g.title}>
                          <td colSpan={4}>{g.title}</td>
                        </tr>,
                        ...g.rows.map((r: any) => (
                          <tr key={r.name} className={KIND[r.st] === 'crit' ? 'hl' : KIND[r.st] === 'warn' ? 'hlw' : undefined}>
                            <td>{r.name}</td>
                            <td className="num">{r.val}</td>
                            <td className="raw">{r.raw}</td>
                            <td>
                              <Pill st={r.st} />
                            </td>
                          </tr>
                        )),
                      ])}
                    </tbody>
                  </table>
                </Section>
                <Section title="Advertencia crítica decodificada" aside={`critical_warning = ${vm.critHex}`}>
                  <div className="rp-flags">
                    {(vm.flags || []).map((f: any) => (
                      <div key={f.label} className={'rp-flag' + (f.state === 'Activa' ? ' on' : '')}>
                        <Icon id={f.state === 'Activa' ? '#i-x' : '#i-check'} size={11} />
                        {f.label}
                        <small>{f.state}</small>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            ) : (
              <p className="rp-note">SMART no disponible: el puente USB no transmite datos SMART en macOS.</p>
            )}
            <Footer vm={vm} page={vm.pSmart} />
          </section>
        ) : null}

        {/* ── Página 3 · Temperatura y pruebas ── */}
        {vm.showP3 ? (
          <section className="page">
            <RunningHeader vm={vm} title="Temperatura y pruebas" />
            {vm.showTemp ? (
              <Section title="Temperatura durante la sesión" aside={vm.temp?.caption}>
                <div className="rp-chart">
                  <div className="rp-chart__legend">
                    <span><i />Advertencia</span>
                    <span><i className="crit" />Crítica</span>
                  </div>
                  <svg viewBox="0 0 700 170" width="100%" style={{ display: 'block' }}>
                    <rect x="40" y={vm.temp?.yCrit} width="656" height={vm.temp?.hWarn} fill="var(--health-warning-bg)" />
                    <rect x="40" y="0" width="656" height={vm.temp?.yCrit} fill="var(--health-critical-bg)" opacity="0.6" />
                    {(vm.temp?.ticks || []).map((t: any) => (
                      <line key={t.label} x1="40" x2="696" y1={t.y} y2={t.y} stroke="var(--gray-4)" />
                    ))}
                    <line x1="40" x2="696" y1={vm.temp?.yWarn} y2={vm.temp?.yWarn} stroke="var(--health-warning-solid)" strokeDasharray="5 4" />
                    <line x1="40" x2="696" y1={vm.temp?.yCrit} y2={vm.temp?.yCrit} stroke="var(--health-critical-solid)" strokeDasharray="5 4" />
                    <path d={vm.temp?.path} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinejoin="round" />
                    {(vm.temp?.ticks || []).map((t: any) => (
                      <text key={'l' + t.label} x="34" y={Number(t.y) + 3} textAnchor="end" fontSize="9" fill="var(--gray-9)">
                        {t.label}
                      </text>
                    ))}
                  </svg>
                  <div className="rp-chart__foot">
                    <span>{vm.temp?.x0}</span>
                    <span>{vm.temp?.warnLbl}</span>
                    <span>{vm.temp?.x1}</span>
                  </div>
                </div>
                <p className="rp-note">{vm.temp?.stats}</p>
              </Section>
            ) : null}

            {vm.showTests ? (
              <Section
                title="Escaneo de lectura de superficie"
                aside={
                  <span className="rp-result" style={{ color: vm.scan?.has ? (vm.scan.result === 'Aprobado' ? 'var(--health-optimal-fg)' : 'var(--health-critical-fg)') : 'var(--gray-10)' }}>
                    <Icon id={vm.scan?.icon} size={12} />
                    {vm.scan?.result}
                  </span>
                }
              >
                {vm.scan?.has ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="rp-stats">
                      {(vm.scan.stats || []).map((s: any) => (
                        <div key={s.k}>
                          <span>{s.k}</span>
                          <b>{s.v}</b>
                        </div>
                      ))}
                    </div>
                    <div className="rp-chart">
                      <svg viewBox="0 0 700 130" width="100%" style={{ display: 'block' }}>
                        {(vm.scan.ticks || []).map((t: any) => (
                          <line key={t.label} x1="40" x2="696" y1={t.y} y2={t.y} stroke="var(--gray-4)" />
                        ))}
                        {(vm.scan.ticks || []).map((t: any) => (
                          <text key={'l' + t.label} x="34" y={Number(t.y) + 3} textAnchor="end" fontSize="9" fill="var(--gray-9)">
                            {t.label}
                          </text>
                        ))}
                        <path d={vm.scan.path} fill="none" stroke="var(--accent)" strokeWidth="1.25" strokeLinejoin="round" />
                        {(vm.scan.marks || []).map((z: any, i: number) => (
                          <path key={i} d={z.d} fill="var(--health-critical-solid)" />
                        ))}
                      </svg>
                      <div className="rp-chart__foot">
                        <span>0 % LBA</span>
                        <span>Velocidad de lectura (MB/s) según la posición en el disco</span>
                        <span>100 % LBA</span>
                      </div>
                    </div>
                    {vm.scan.hasZones ? (
                      <div className="rp-zones">
                        {vm.scan.zones.map((z: string) => (
                          <span key={z}>▲ {z}</span>
                        ))}
                      </div>
                    ) : null}
                    <table className="rp-table">
                      <thead>
                        <tr>
                          <th>SMART antes vs. después</th>
                          <th style={{ textAlign: 'right' }}>Antes</th>
                          <th style={{ textAlign: 'right' }}>Después</th>
                          <th>Cambio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vm.scan.diff || []).map((r: any) => (
                          <tr key={r.k}>
                            <td>{r.k}</td>
                            <td className="num" style={{ fontWeight: 500 }}>{r.a}</td>
                            <td className="num">{r.b}</td>
                            <td style={{ color: r.ch.startsWith('↑') ? 'var(--accent-fg)' : 'var(--gray-9)', fontWeight: r.w }}>{r.ch}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rp-note">No se ejecutaron escaneos de lectura en esta sesión. Las autopruebas SMART no se pueden iniciar en macOS; el historial guardado en el disco se incluye en Registros.</p>
                )}
              </Section>
            ) : null}
            <Footer vm={vm} page={vm.pP3} />
          </section>
        ) : null}

        {/* ── Página final · Registros, conclusiones y apéndice ── */}
        <section className="page">
          <RunningHeader vm={vm} title={vm.p4Title} />
          {vm.showLogs ? (
            <Section title="Registros del disco">
              {vm.logs?.hasErr ? (
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ textAlign: 'right' }}>Conteo</th>
                      <th>SQID</th>
                      <th>CMDID</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>LBA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vm.logs.err.map((e: any) => (
                      <tr key={e.n}>
                        <td className="raw">{e.n}</td>
                        <td className="num">{e.c}</td>
                        <td className="raw">{e.q}</td>
                        <td className="raw">{e.cmd}</td>
                        <td>{e.s}</td>
                        <td className="num raw">{e.lba}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {vm.logs?.errNote ? <p className="rp-note">{vm.logs.errNote}</p> : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8, fontSize: 11 }}>
                {(vm.logs?.st || []).map((s: any, i: number) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon id={s.icon} size={11} />
                    Autoprueba · {s.t}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          <Section title="Conclusión y recomendaciones">
            <div className="rp-callout">
              <ol>
                {(vm.recs || []).map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
          </Section>

          {vm.hasNotes ? (
            <Section title="Observaciones del técnico">
              <div className="rp-box">{vm.notes}</div>
            </Section>
          ) : null}

          {vm.showAppendix ? (
            <Section title="Apéndice técnico">
              <div className="rp-dl rp-dl--one" style={{ marginBottom: 8 }}>
                <div>
                  <span>smartctl</span>
                  <b>
                    {vm.sc?.version} ({vm.sc?.build}) · {vm.sc?.path}
                  </b>
                </div>
                <div>
                  <span>Plataforma</span>
                  <b>{vm.sc?.platform}</b>
                </div>
              </div>
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Comando</th>
                    <th>Código de salida</th>
                  </tr>
                </thead>
                <tbody>
                  {(vm.cmds || []).map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="raw">{c.t}</td>
                      <td className="raw" style={{ color: 'var(--gray-12)' }}>{c.cmd}</td>
                      <td>{c.exit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="rp-note" style={{ marginBottom: 4 }}>SHA-256 de los datos crudos (salida JSON de smartctl -x -j):</p>
              <div className="rp-sha">{vm.sha}</div>
            </Section>
          ) : null}

          <div className="rp-sign">
            <div>
              <b>{vm.tech}</b>
              Técnico responsable
            </div>
            <div>
              <b />
              Firma
            </div>
            <div>
              <b>{String(vm.date || '').split(',')[0]}</b>
              Fecha
            </div>
          </div>
          <Footer vm={vm} page={vm.total} />
        </section>
      </doc-page>
    </div>
  );
}
