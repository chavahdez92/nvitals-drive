// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';
import { BenchView } from './BenchView';

export function TestsTab({ vm }: { vm: VM }) {
  return (
    <>
      <div style={css("display:flex;flex-direction:column;gap:24px")}>
        {vm.tests?.hasRun ? (
          <>
            {/* @component TestRun | states: running, passed, errors, cancelled, interrupted */}
            <div data-component="TestRun" style={css("display:flex;flex-direction:column;gap:16px;padding:20px 22px;border-radius:var(--r-2xl);background:var(--surface-raised);box-shadow:var(--shadow-2), inset 0 0 0 0.5px var(--border-subtle)")}>
              <div aria-live="polite" style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)")}>
                {vm.tests?.run?.live}
              </div>
              {vm.tests?.run?.running ? (
                <>
                  <div style={css("display:flex;flex-direction:column;gap:16px")}>
                    <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:16px")}>
                      <div style={css("display:flex;flex-direction:column;gap:4px")}>
                        <span style={css("display:inline-flex;align-items:center;gap:8px;font-size:var(--type-callout-size);font-weight:600;color:var(--accent-fg)")}>
                          <span style={css("width:7px;height:7px;border-radius:50%;background:var(--accent);animation:hdi-beat 1.4s ease-in-out infinite")} />
                          {"En curso · "}
                          {vm.tests?.run?.kindLabel}
                        </span>
                        <span style={css("font-family:var(--font-display);font-size:56px;line-height:60px;font-weight:700;letter-spacing:-0.03em")}>
                          {vm.tests?.run?.pct}
                          <span style={css("font-size:24px;color:var(--text-secondary);margin-left:2px")}>
                            %
                          </span>
                        </span>
                      </div>
                      <div style={css("display:flex;flex-direction:column;align-items:flex-end;gap:8px")}>
                        <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.cancelAsk} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                          <svg width="13" height="13">
                            <use href="#i-stop" />
                          </svg>
                          Cancelar
                        </button>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Tu Mac se mantendrá despierta durante la prueba
                        </span>
                      </div>
                    </div>
                    {/* @component Progress | variants: bar, ring | states: determinate, indeterminate */}
                    {vm.tests?.run?.bench ? null : (
                    <div data-component="Progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={vm.tests?.run?.pct} style={css("height:6px;border-radius:3px;background:var(--ring-track);overflow:hidden")}>
                      <div style={css(`height:100%;width:100%;background:var(--accent);transform-origin:left;transform:scaleX(${vm.tests?.run?.p ?? ''});transition:transform 250ms linear`)} />
                    </div>
                    )}
                    {vm.tests?.run?.bench ? null : (
                    <div style={css("display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px")}>
                      <div style={css("display:flex;flex-direction:column;gap:2px")}>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Transcurrido
                        </span>
                        <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                          {vm.tests?.run?.elapsed}
                        </span>
                      </div>
                      <div style={css("display:flex;flex-direction:column;gap:2px")}>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Restante
                        </span>
                        <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                          {vm.tests?.run?.remaining}
                        </span>
                      </div>
                      <div style={css("display:flex;flex-direction:column;gap:2px")}>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Velocidad
                        </span>
                        <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                          {vm.tests?.run?.speed}
                          {" "}
                          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);font-weight:500")}>
                            MB/s
                          </span>
                        </span>
                      </div>
                      <div style={css("display:flex;flex-direction:column;gap:2px")}>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Temperatura
                        </span>
                        <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                          {vm.tests?.run?.temp}
                        </span>
                      </div>
                      <div style={css("display:flex;flex-direction:column;gap:2px")}>
                        <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                          Errores
                        </span>
                        <span style={css(`font-size:var(--type-title3-size);font-weight:600;color:${vm.tests?.run?.errFg ?? ''}`)}>
                          {vm.tests?.run?.errors}
                        </span>
                      </div>
                    </div>
                    )}
                  </div>
                </>
              ) : null}
              {vm.tests?.run?.done ? (
                <>
                  <div style={css("display:flex;align-items:center;gap:16px")}>
                    <div data-test-result-icon="" style={css(`width:56px;height:56px;flex:none;display:grid;place-items:center;border-radius:50%;background:${vm.tests?.run?.rBg ?? ''};box-shadow:inset 0 0 0 1px ${vm.tests?.run?.rBorder ?? ''};color:${vm.tests?.run?.rFg ?? ''}`)}>
                      <svg data-anim="pop" width="28" height="28">
                        <use href={vm.tests?.run?.rIcon} />
                      </svg>
                    </div>
                    <div style={css("flex:1;display:flex;flex-direction:column;gap:2px")}>
                      <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                        {vm.tests?.run?.kindLabel}
                      </span>
                      <span style={css(`font-size:var(--type-title1-size);line-height:var(--type-title1-lh);font-weight:650;letter-spacing:var(--type-title1-track);color:${vm.tests?.run?.rFg ?? ''}`)}>
                        {vm.tests?.run?.rTitle}
                      </span>
                      <span style={css("color:var(--text-secondary)")}>
                        {vm.tests?.run?.rBody}
                      </span>
                    </div>
                    <div style={css("display:flex;gap:8px")}>
                      <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.resetTest} style={css("height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                        Nueva prueba
                      </button>
                      <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.addToReport} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                        <svg width="14" height="14">
                          <use href="#i-plus" />
                        </svg>
                        Agregar al reporte
                      </button>
                    </div>
                  </div>
                  <div style={css("display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;padding:14px 0 0;border-top:0.5px solid var(--border-subtle)")}>
                    {(vm.tests?.run?.stats || []).map((stt: any, i1: number) => (
                      <Fragment key={i1}>
                        <div style={css("display:flex;flex-direction:column;gap:2px")}>
                          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                            {stt?.label}
                          </span>
                          <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                            {stt?.val}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {vm.tests?.run?.bench ? <BenchView b={vm.tests.run.bench} /> : null}
              {/* @component SpeedChart | variants: position | states: live, final */}
              {vm.tests?.run?.noChart ? null : (
              <div style={css("display:flex;flex-direction:column;gap:6px")}>
                <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  {vm.tests?.run?.chartTitle ?? "Velocidad de lectura según la posición en el disco (LBA)"}
                </span>
                <div style={css("position:relative")}>
                  {(vm.tests?.run?.yTicks || []).map((yt: any, i1: number) => (
                    <Fragment key={i1}>
                      <span aria-hidden="true" style={css(`position:absolute;left:0;width:4.4%;top:${yt?.top ?? ''};transform:translateY(-50%);text-align:right;font-size:10px;color:var(--chart-axis)`)}>
                        {yt?.label}
                      </span>
                    </Fragment>
                  ))}
                  <svg data-component="SpeedChart" viewBox="0 0 812 176" width="100%" style={css("display:block")} role="img" aria-label="Velocidad por posición">
                    {(vm.tests?.run?.yTicks || []).map((yt: any, i1: number) => (
                      <Fragment key={i1}>
                        <line x1="44" x2="804" y1={yt?.y} y2={yt?.y} style={css("stroke:var(--chart-grid)")} />
                      </Fragment>
                    ))}
                    <path d={vm.tests?.run?.area} style={css("fill:var(--data-fill)")} />
                    <path d={vm.tests?.run?.path} fill="none" style={css("stroke:var(--data-speed);stroke-width:1.5;stroke-linejoin:round")} />
                    {(vm.tests?.run?.zones || []).map((z: any, i1: number) => (
                      <Fragment key={i1}>
                        <line x1={z?.x} x2={z?.x} y1="10" y2="150" style={css("stroke:var(--data-crit);stroke-width:1.5;opacity:.8")} />
                      </Fragment>
                    ))}
                    <text x="44" y="170" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>
                      0 %
                    </text>
                    <text x="424" y="170" textAnchor="middle" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>
                      {vm.tests?.run?.axisMid ?? "50 % de los LBA"}
                    </text>
                    <text x="804" y="170" textAnchor="end" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>
                      100 %
                    </text>
                    <text x="48" y="22" style={css("fill:var(--chart-axis);font-size:10px;font-family:var(--font-sans)")}>
                      MB/s
                    </text>
                  </svg>
                </div>
              </div>
              )}
              {vm.tests?.run?.hasZones ? (
                <>
                  <div style={css("display:flex;flex-direction:column;gap:6px")}>
                    <strong style={css("font-weight:600;color:var(--health-critical-fg);display:flex;align-items:center;gap:6px")}>
                      <svg width="14" height="14">
                        <use href="#i-alert" />
                      </svg>
                      Zonas ilegibles
                    </strong>
                    <div style={css("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 16px;font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                      {(vm.tests?.run?.zonesList || []).map((z: any, i1: number) => (
                        <Fragment key={i1}>
                          <span style={css("display:flex;justify-content:space-between;gap:8px;padding:4px 8px;border-radius:var(--r-xs);background:var(--health-critical-bg)")}>
                            <span>
                              {"LBA "}
                              {z?.lba}
                            </span>
                            <span style={css("color:var(--text-tertiary)")}>
                              {z?.pos}
                            </span>
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              {vm.tests?.run?.hasDiff ? (
                <>
                  <div style={css("display:flex;flex-direction:column;gap:6px")}>
                    <strong style={css("font-weight:600")}>
                      SMART antes vs. después
                    </strong>
                    <div style={css("border-radius:var(--r-md);box-shadow:inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
                      <div style={css("display:grid;grid-template-columns:minmax(0,1.5fr) 1fr 24px 1fr;gap:12px;height:28px;align-items:center;padding:0 12px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);background:var(--surface-sunken)")}>
                        <span>
                          Atributo
                        </span>
                        <span style={css("text-align:right")}>
                          Antes
                        </span>
                        <span />
                        <span>
                          Después
                        </span>
                      </div>
                      {(vm.tests?.run?.diff || []).map((df: any, i1: number) => (
                        <Fragment key={i1}>
                          <div style={css(`display:grid;grid-template-columns:minmax(0,1.5fr) 1fr 24px 1fr;gap:12px;min-height:28px;align-items:center;padding:0 12px;background:${df?.bg ?? ''}`)}>
                            <span>
                              {df?.label}
                            </span>
                            <span style={css("text-align:right;color:var(--text-secondary)")}>
                              {df?.a}
                            </span>
                            <span style={css(`text-align:center;color:${df?.fg ?? ''};font-weight:600`)}>
                              {df?.mark}
                            </span>
                            <span style={css(`font-weight:${df?.weight ?? ''};color:${df?.fg ?? ''}`)}>
                              {df?.b}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px")}>
          {(vm.tests?.cards || []).map((tc: any, i1: number) => (
            <Fragment key={i1}>
              {/* @component TestCard | states: available, locked, disabled */}
              <div data-component="TestCard" data-state={tc?.key} style={css("display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
                <div style={css("display:flex;align-items:flex-start;gap:10px")}>
                  <svg width="18" height="18" style={css("flex:none;color:var(--text-secondary);margin-top:1px")}>
                    <use href={tc?.icon} />
                  </svg>
                  <div style={css("flex:1;display:flex;flex-direction:column;gap:3px;min-width:0")}>
                    <strong style={css("font-weight:600")}>
                      {tc?.title}
                    </strong>
                    <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                      {tc?.cmd}
                    </span>
                  </div>
                  {tc?.locked ? (
                    <>
                      <span style={css("display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 6px;border-radius:var(--r-pill);background:var(--surface-hover);color:var(--text-secondary);font-size:var(--type-note-size);font-weight:600")}>
                        <svg width="11" height="11">
                          <use href="#i-lock" />
                        </svg>
                        Bloqueada en macOS
                      </span>
                    </>
                  ) : null}
                </div>
                <span style={css("color:var(--text-secondary);font-size:var(--type-callout-size);text-wrap:pretty")}>
                  {tc?.desc}
                </span>
                <div style={css("display:flex;gap:16px;font-size:var(--type-callout-size)")}>
                  <span style={css("display:inline-flex;align-items:center;gap:5px;color:var(--text-secondary)")}>
                    <svg width="13" height="13">
                      <use href="#i-clock" />
                    </svg>
                    {tc?.dur}
                  </span>
                  <span style={css("display:inline-flex;align-items:center;gap:5px;color:var(--text-secondary)")}>
                    <svg width="13" height="13">
                      <use href="#i-lock" />
                    </svg>
                    {tc?.req}
                  </span>
                </div>
                {tc?.locked ? (
                  <>
                    <div style={css("display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                      <span style={css("font-size:var(--type-callout-size);text-wrap:pretty")}>
                        {tc?.lockTxt}
                      </span>
                      <button onClick={tc?.toggleInfo} style={css("align-self:flex-start;padding:0;border:0;background:transparent;color:var(--accent-fg);font-size:var(--type-callout-size);font-weight:500")}>
                        Más información
                      </button>
                      {tc?.infoOpen ? (
                        <>
                          <span data-anim="fade" style={css("font-size:var(--type-note-size);color:var(--text-secondary);text-wrap:pretty")}>
                            El controlador NVMe de macOS solo expone comandos de lectura (Identify y Get Log Page) a procesos de usuario. El historial de autopruebas guardado en el disco sí se puede leer y aparece abajo.
                          </span>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {tc?.disTxt ? (
                  <>
                    <span style={css("display:inline-flex;align-items:center;gap:5px;font-size:var(--type-callout-size);color:var(--text-tertiary)")}>
                      <svg width="13" height="13">
                        <use href="#i-info" />
                      </svg>
                      {tc?.disTxt}
                    </span>
                  </>
                ) : null}
                <div style={css("display:flex;justify-content:flex-end;margin-top:auto")}>
                  <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={tc?.start} disabled={tc?.disabled} aria-disabled={tc?.disabled} style={css(`display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;opacity:${tc?.btnOpacity ?? ''};transition:transform var(--dur-press) var(--ease-out)`)}>
                    {tc?.locked ? (
                      <>
                        <svg width="13" height="13">
                          <use href="#i-lock" />
                        </svg>
                      </>
                    ) : null}
                    {tc?.btnLabel ? " " + tc.btnLabel + " " : " Iniciar "}
                  </button>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
            Historial de pruebas del disco
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
            {(vm.tests?.hist || []).map((h: any, i1: number) => (
              <Fragment key={i1}>
                <div style={css("display:flex;align-items:center;gap:10px;min-height:40px;padding:0 16px;border-bottom:0.5px solid var(--border-subtle)")}>
                  <svg width="15" height="15" style={css(`flex:none;color:${h?.fg ?? ''}`)}>
                    <use href={h?.icon} />
                  </svg>
                  <span style={css("flex:1")}>
                    {h?.label}
                  </span>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                    {h?.lba}
                  </span>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                    {h?.src}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
