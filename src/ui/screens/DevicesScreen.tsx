// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function DevicesScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Dispositivos" data-devices-body="" style={css("padding:14px 24px 32px;display:flex;flex-direction:column;gap:18px;max-width:1440px;margin:0 auto")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
          <div aria-live="polite" style={css("display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:var(--type-body-size)")}>
            {(vm.summary || []).map((sg: any, i1: number) => (
              <Fragment key={i1}>
                <span style={css(`display:inline-flex;align-items:center;gap:6px;color:${sg?.fg ?? ''};font-weight:500`)}>
                  <svg width="14" height="14">
                    <use href={sg?.icon} />
                  </svg>
                  {sg?.text}
                </span>
              </Fragment>
            ))}
          </div>
          <div style={css("display:flex;align-items:center;gap:8px")}>
            {/* @component SegmentedControl | variants: text, icon | states: default, selected */}
            <div data-component="SegmentedControl" role="group" aria-label="Filtro" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
              {(vm.filters || []).map((f: any, i1: number) => (
                <Fragment key={i1}>
                  <button onClick={f?.pick} aria-pressed={f?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${f?.bg ?? ''};box-shadow:${f?.shadow ?? ''};color:${f?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500;transition:background-color var(--dur-fast) var(--ease-out)`)}>
                    {f?.label}
                  </button>
                </Fragment>
              ))}
            </div>
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.cycleSort} data-tip="Cambiar orden" style={css("display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500")}>
              <svg width="14" height="14">
                <use href="#i-sort" />
              </svg>
              {"Orden: "}
              {vm.sortLabel}
            </button>
            <div role="group" aria-label="Vista" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
              {(vm.views || []).map((v: any, i1: number) => (
                <Fragment key={i1}>
                  <button onClick={v?.pick} aria-pressed={v?.pressed} aria-label={v?.label} data-tip={v?.label} style={css(`width:28px;height:22px;display:grid;place-items:center;border:0;border-radius:6px;background:${v?.bg ?? ''};box-shadow:${v?.shadow ?? ''};color:${v?.fg ?? ''}`)}>
                    <svg width="14" height="14">
                      <use href={v?.icon} />
                    </svg>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        {/* @component EmptyState | variants: devices | states: listening */}
        {vm.isEmpty ? (
          <>
            <div data-component="EmptyState" data-anim="fade" style={css("display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:80px 20px")}>
              <div style={css("position:relative;width:220px;height:130px;display:grid;place-items:center")}>
                <span aria-hidden="true" style={css("position:absolute;left:50%;top:50%;width:180px;height:180px;margin:-90px 0 0 -90px;border-radius:50%;border:1px solid var(--accent-border);animation:hdi-listen 3.6s var(--ease-out) infinite")} />
                <span aria-hidden="true" style={css("position:absolute;left:50%;top:50%;width:180px;height:180px;margin:-90px 0 0 -90px;border-radius:50%;border:1px solid var(--accent-border);animation:hdi-listen 3.6s var(--ease-out) 1.8s infinite")} />
                <svg width="200" height="90" viewBox="0 0 200 90" fill="none" aria-hidden="true" style={css("position:relative;color:var(--text-tertiary)")}>
                  <rect x="6" y="30" width="112" height="34" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 40h7M6 46h7M6 52h7" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="28" y="38" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="58" y="38" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="104" cy="47" r="4" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="134" y="22" width="60" height="50" rx="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M146 60h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="182" cy="60" r="1.6" fill="currentColor" />
                  <path d="M122 47h8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
                </svg>
              </div>
              <h2 style={css("margin:0;font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:var(--type-title2-weight);letter-spacing:var(--type-title2-track)")}>
                Conecta un SSD NVMe para empezar
              </h2>
              <p style={css("margin:0;max-width:420px;color:var(--text-secondary);text-wrap:pretty")}>
                Los discos aparecen aquí en cuanto se conectan. Usa un gabinete Thunderbolt o USB4 para ver datos SMART completos; los puentes USB 3.x no los transmiten en macOS.
              </p>
              <span style={css("display:inline-flex;align-items:center;gap:6px;font-size:var(--type-callout-size);color:var(--text-tertiary)")}>
                <span style={css("width:6px;height:6px;border-radius:50%;background:var(--accent);animation:hdi-beat 2.4s ease-in-out infinite")} />
                Escuchando conexiones
              </span>
            </div>
          </>
        ) : null}
        {vm.gridView ? (
          <>
            <div role="list" style={css("display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:14px")}>
              {(vm.cards || []).map((c: any, i1: number) => (
                <Fragment key={i1}>
                  {/* @component DeviceCard | variants: grid, list | states: identifying, optimal, good, warning, critical, nodata, disconnected, selected */}
                  <div className={cx("hdi-device-card", pc("hover", "transform:translateY(-2px)"), pc("active", "transform:scale(0.97)"))} role="listitem" data-component="DeviceCard" data-variant="grid" data-state={c?.state} data-flip={c?.id} data-card-id={c?.id} data-anim={c?.anim} data-anim-delay={c?.delay} tabIndex={0} aria-label={c?.aria} onClick={c?.open} onContextMenu={c?.ctx} style={css(`position:relative;display:flex;flex-direction:column;min-height:196px;padding:16px;border-radius:var(--r-xl);background:var(--surface-raised);box-shadow:${c?.shadow ?? ''};outline:0.5px solid var(--border-subtle);outline-offset:-0.5px;filter:${c?.filter ?? ''};opacity:${c?.opacity ?? ''};transition:transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), filter var(--dur-moderate) var(--ease-out), opacity var(--dur-moderate) var(--ease-out)`)}>
                    {c?.identifying ? (
                      <>
                        <div data-component="Skeleton" style={css("display:flex;flex-direction:column;gap:16px;flex:1")}>
                          <div style={css("display:flex;gap:14px;align-items:center")}>
                            <div style={css("width:64px;height:64px;border-radius:50%;border:6px solid var(--ring-track);animation:hdi-shimmer 1.6s ease-in-out infinite")} />
                            <div style={css("flex:1;display:flex;flex-direction:column;gap:8px")}>
                              <div style={css("height:10px;width:40%;border-radius:4px;background:var(--surface-hover);animation:hdi-shimmer 1.6s ease-in-out infinite")} />
                              <div style={css("height:14px;width:80%;border-radius:4px;background:var(--surface-hover);animation:hdi-shimmer 1.6s ease-in-out .1s infinite")} />
                              <div style={css("height:10px;width:55%;border-radius:4px;background:var(--surface-hover);animation:hdi-shimmer 1.6s ease-in-out .2s infinite")} />
                            </div>
                          </div>
                          <div style={css("height:22px;width:60%;border-radius:var(--r-pill);background:var(--surface-hover);animation:hdi-shimmer 1.6s ease-in-out .15s infinite")} />
                          <div style={css("margin-top:auto;display:flex;align-items:center;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                            <svg width="12" height="12" viewBox="0 0 16 16" style={css("animation:hdi-spin 0.9s linear infinite")}>
                              <circle cx="8" cy="8" r="6.5" fill="none" style={css("stroke:var(--ring-track);stroke-width:2.5")} />
                              <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" style={css("stroke:var(--accent);stroke-width:2.5;stroke-linecap:round")} />
                            </svg>
                            Leyendo datos SMART…
                          </div>
                        </div>
                      </>
                    ) : null}
                    {c?.ready ? (
                      <>
                        <div data-anim={c?.contentAnim} style={css("display:flex;flex-direction:column;gap:14px;flex:1")}>
                          <div style={css("display:flex;gap:14px;align-items:flex-start")}>
                            {/* @component LifeRing | variants: S, M, L | states: optimal, good, warning, critical, nodata */}
                            <div data-component="LifeRing" data-variant="M" data-ring-for={c?.id} style={css("position:relative;width:64px;height:64px;flex:none")}>
                              <svg width="64" height="64" viewBox="0 0 64 64" style={css("transform:rotate(-90deg);display:block")}>
                                <circle cx="32" cy="32" r="29" fill="none" style={css("stroke:var(--ring-track);stroke-width:6")} />
                                <circle cx="32" cy="32" r="29" fill="none" style={css(`stroke:${c?.vSolid ?? ''};stroke-width:6;stroke-linecap:round;stroke-dasharray:${c?.ring?.c ?? ''};stroke-dashoffset:${c?.ring?.off ?? ''}`)} />
                              </svg>
                              <div style={css("position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:650;letter-spacing:-0.02em")}>
                                {c?.lifeNum}
                                <span style={css("font-size:10px;font-weight:500;color:var(--text-secondary);margin-left:1px")}>
                                  {c?.pctSign}
                                </span>
                              </div>
                            </div>
                            <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:6px")}>
                              <div style={css("display:flex;align-items:center;gap:6px")}>
                                {/* @component HealthBadge | variants: sm, md, lg | states: optimal, good, warning, critical, nodata */}
                                <span data-component="HealthBadge" data-variant="sm" style={css(`display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 5px;border-radius:var(--r-pill);background:${c?.vBg ?? ''};color:${c?.vFg ?? ''};box-shadow:inset 0 0 0 0.5px ${c?.vBorder ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                                  <svg width="12" height="12">
                                    <use href={c?.vIcon} />
                                  </svg>
                                  {c?.vLabel}
                                </span>
                                {c?.internal ? (
                                  <>
                                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);font-weight:500")}>
                                      Interno
                                    </span>
                                  </>
                                ) : null}
                              </div>
                              <div style={css("font-size:var(--type-title3-size);line-height:var(--type-title3-lh);font-weight:600;letter-spacing:var(--type-title3-track);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                                {c?.model}
                              </div>
                              <div style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                                {c?.cap}
                                {" · "}
                                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                                  {c?.diskId}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* @component ConnectionBadge | variants: thunderbolt, usb4, usb, internal */}
                          <span data-component="ConnectionBadge" style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 8px;border-radius:var(--r-sm);background:var(--surface-hover);color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500;max-width:100%")}>
                            <svg width="13" height="13" style={css("flex:none")}>
                              <use href={c?.connIcon} />
                            </svg>
                            <span style={css("white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                              {c?.conn}
                              {" · "}
                              {c?.link}
                            </span>
                          </span>
                          <div style={css("margin-top:auto;display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:10px")}>
                            <div style={css("display:flex;flex-direction:column;gap:2px;min-width:0")}>
                              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                                Temperatura
                              </span>
                              <span style={css("display:flex;align-items:center;gap:6px")}>
                                <span data-temp-badge={c?.id} style={css(`font-weight:600;color:${c?.tempFg ?? ''}`)}>
                                  {c?.temp}
                                </span>
                                <svg width="56" height="16" viewBox="0 0 56 16" aria-hidden="true" style={css("overflow:visible")}>
                                  <path d={c?.spark} fill="none" style={css("stroke:var(--data-temp);stroke-width:1.25;stroke-linejoin:round")} />
                                </svg>
                              </span>
                            </div>
                            <div style={css("display:flex;flex-direction:column;gap:2px")}>
                              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                                Escritos
                              </span>
                              <span style={css("font-weight:600")}>
                                {c?.written}
                              </span>
                            </div>
                            <div style={css("display:flex;flex-direction:column;gap:2px")}>
                              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                                Uso
                              </span>
                              <span style={css("font-weight:600")}>
                                {c?.hours}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                    {c?.nodata ? (
                      <>
                        <div style={css("display:flex;flex-direction:column;gap:14px;flex:1")}>
                          <div style={css("display:flex;gap:14px;align-items:flex-start")}>
                            <div data-ring-for={c?.id} style={css("position:relative;width:64px;height:64px;flex:none")}>
                              <svg width="64" height="64" viewBox="0 0 64 64" style={css("display:block")}>
                                <circle cx="32" cy="32" r="29" fill="none" style={css("stroke:var(--health-nodata-border);stroke-width:2;stroke-dasharray:3 5")} />
                              </svg>
                              <div style={css("position:absolute;inset:0;display:grid;place-items:center;color:var(--text-tertiary);font-size:16px;font-weight:600")}>
                                —
                              </div>
                            </div>
                            <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:6px")}>
                              <span style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 5px;border-radius:var(--r-pill);background:var(--health-nodata-bg);color:var(--health-nodata-fg);box-shadow:inset 0 0 0 0.5px var(--health-nodata-border);font-size:var(--type-note-size);font-weight:600")}>
                                <svg width="12" height="12">
                                  <use href="#i-circle-dashed" />
                                </svg>
                                Sin datos
                              </span>
                              <div style={css("font-size:var(--type-title3-size);line-height:var(--type-title3-lh);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                                {c?.model}
                              </div>
                              <div style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                                {c?.cap}
                                {" · "}
                                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                                  {c?.diskId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 8px;border-radius:var(--r-sm);background:var(--surface-hover);color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500")}>
                            <svg width="13" height="13" style={css("flex:none")}>
                              <use href="#i-usb" />
                            </svg>
                            <span style={css("white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                              {c?.conn}
                              {" · "}
                              {c?.link}
                            </span>
                          </span>
                          <div style={css("margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:10px")}>
                            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);text-wrap:pretty")}>
                              {c?.reason}
                            </span>
                            <button className={cx(pc("hover", "background:var(--accent-border)"))} onClick={c?.alts} style={css("flex:none;height:24px;padding:0 10px;border:0;border-radius:var(--r-sm);background:var(--accent-soft);color:var(--accent-fg);font-size:var(--type-callout-size);font-weight:600")}>
                              Ver alternativas
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                    {c?.testing ? (
                      <>
                        <div style={css("position:absolute;left:16px;right:16px;bottom:8px;height:3px;border-radius:2px;background:var(--ring-track);overflow:hidden")} role="progressbar" aria-label="Prueba en curso">
                          <div style={css(`height:100%;width:100%;background:var(--accent);transform-origin:left;transform:scaleX(${c?.testScale ?? ''});transition:transform 250ms linear`)} />
                        </div>
                      </>
                    ) : null}
                    {c?.disconnected ? (
                      <>
                        <div style={css("position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:var(--r-pill);background:var(--surface-raised-2);font-size:var(--type-note-size);font-weight:600;color:var(--text-secondary)")}>
                          <svg width="11" height="11">
                            <use href="#i-plug" />
                          </svg>
                          {c?.discText}
                        </div>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.listView ? (
          <>
            <div role="table" aria-label="Discos" style={css("display:flex;flex-direction:column;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1);overflow:hidden")}>
              <div role="row" style={css("display:grid;grid-template-columns:minmax(220px,2.2fr) 1.6fr 1fr 70px 80px 90px 90px;gap:12px;align-items:center;height:30px;padding:0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                <span>
                  Disco
                </span>
                <span>
                  Conexión
                </span>
                <span>
                  Veredicto
                </span>
                <span style={css("text-align:right")}>
                  Vida
                </span>
                <span style={css("text-align:right")}>
                  Temp.
                </span>
                <span style={css("text-align:right")}>
                  Escritos
                </span>
                <span style={css("text-align:right")}>
                  Uso
                </span>
              </div>
              {(vm.cards || []).map((c: any, i1: number) => (
                <Fragment key={i1}>
                  <div className={cx(pc("hover", "background:var(--surface-hover)"))} role="row" data-component="DeviceCard" data-variant="list" data-state={c?.state} data-flip={c?.id} data-card-id={c?.id} tabIndex={0} onClick={c?.open} onContextMenu={c?.ctx} style={css(`display:grid;grid-template-columns:minmax(220px,2.2fr) 1.6fr 1fr 70px 80px 90px 90px;gap:12px;align-items:center;height:44px;padding:0 16px;box-shadow:${c?.shadow ?? ''};filter:${c?.filter ?? ''};opacity:${c?.opacity ?? ''};border-bottom:0.5px solid var(--border-subtle);transition:background-color var(--dur-fast) var(--ease-out)`)}>
                    <span style={css("display:flex;align-items:center;gap:10px;min-width:0")}>
                      <span data-ring-for={c?.id} style={css("display:grid;place-items:center;width:18px;height:18px;flex:none")}>
                        <svg width="16" height="16" style={css(`color:${c?.vSolid ?? ''}`)}>
                          <use href={c?.vIcon} />
                        </svg>
                      </span>
                      <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                        {c?.model}
                      </span>
                      <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                        {c?.diskId}
                      </span>
                    </span>
                    <span style={css("display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:var(--type-callout-size);min-width:0")}>
                      <svg width="13" height="13" style={css("flex:none")}>
                        <use href={c?.connIcon} />
                      </svg>
                      <span style={css("white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                        {c?.conn}
                        {" · "}
                        {c?.link}
                      </span>
                    </span>
                    <span style={css(`color:${c?.vFg ?? ''};font-weight:600;font-size:var(--type-callout-size)`)}>
                      {c?.vLabel}
                    </span>
                    <span style={css("text-align:right;font-weight:600")}>
                      {c?.lifeNum}
                      {" "}
                      {c?.pctSign}
                    </span>
                    <span style={css(`text-align:right;color:${c?.tempFg ?? ''}`)}>
                      {c?.temp}
                    </span>
                    <span style={css("text-align:right")}>
                      {c?.written}
                    </span>
                    <span style={css("text-align:right;color:var(--text-secondary)")}>
                      {c?.hours}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
