// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ReportBuilderScreen({ vm }: { vm: VM }) {
  return (
    <>
      {/* @component ReportBuilder | states: idle, generating, done, error */}
      <section data-screen-label="Constructor de reporte" data-component="ReportBuilder" style={css("display:grid;grid-template-columns:320px minmax(0,1fr);height:100%;min-height:0;overflow:hidden")}>
        <div style={css("display:flex;flex-direction:column;gap:18px;padding:16px 20px 24px;border-right:0.5px solid var(--border-subtle);min-height:0;overflow:auto")}>
          <label style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              Disco
            </span>
            {/* @component Select | states: default, focus, disabled */}
            <select data-component="Select" value={vm.repDisk} onChange={vm.onRepDisk} style={css("height:28px;padding:0 8px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);color:var(--text-primary);font-size:var(--type-body-size)")}>
              {(vm.repDiskOpts || []).map((o: any, i1: number) => (
                <Fragment key={i1}>
                  <option value={o?.id}>
                    {o?.label}
                  </option>
                </Fragment>
              ))}
            </select>
          </label>
          {vm.repKinds ? (
            <div style={css("display:flex;flex-direction:column;gap:6px")}>
              <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
                Tipo de reporte
              </span>
              <div role="group" aria-label="Tipo de reporte" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
                {vm.repKinds.map((o: any, i1: number) => (
                  <button key={i1} onClick={o?.pick} aria-pressed={o?.pressed} style={css(`flex:1;height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500;transition:background-color var(--dur-fast) var(--ease-out)`)}>
                    {o?.label}
                  </button>
                ))}
              </div>
              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);text-wrap:pretty")}>
                {vm.quickMode ? "Una hoja con salud, vida útil, uso, errores e identidad." : "Reporte técnico completo, de 2 a 4 hojas."}
              </span>
            </div>
          ) : null}
          <div aria-disabled={vm.quickMode ? true : undefined} style={css(`display:flex;flex-direction:column;gap:6px;opacity:${vm.quickMode ? 0.4 : 1};pointer-events:${vm.quickMode ? "none" : "auto"};transition:opacity var(--dur-base) var(--ease-out)`)}>
            <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              Secciones{vm.quickMode ? " · no aplican en el reporte rápido" : ""}
            </span>
            {(vm.repSecs || []).map((sc: any, i1: number) => (
              <Fragment key={i1}>
                {/* @component Checkbox | states: off, on, focus, disabled */}
                <button role="checkbox" data-component="Checkbox" aria-checked={sc?.on} onClick={sc?.toggle} style={css("display:flex;align-items:center;gap:8px;height:24px;padding:0;border:0;background:transparent;text-align:left")}>
                  <span style={css(`width:14px;height:14px;flex:none;display:grid;place-items:center;border-radius:4px;background:${sc?.box ?? ''};box-shadow:inset 0 0 0 1px ${sc?.boxBorder ?? ''};color:var(--text-on-accent);transition:background-color var(--dur-fast) var(--ease-out)`)}>
                    <svg width="10" height="10" style={css(`opacity:${sc?.check ?? ''}`)}>
                      <use href="#i-check" />
                    </svg>
                  </span>
                  {sc?.label}
                  {" "}
                </button>
              </Fragment>
            ))}
          </div>
          <label style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              Técnico
            </span>
            {/* @component TextField | states: default, focus, disabled, error */}
            <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} data-component="TextField" value={vm.repTech} onChange={vm.onRepTech} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size)")} />
          </label>
          <label style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              Cliente o referencia
            </span>
            <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.repClient} onChange={vm.onRepClient} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size)")} />
          </label>
          <label style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              Notas
            </span>
            {/* @component Textarea | states: default, focus */}
            <textarea className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} data-component="Textarea" value={vm.repNotes} onChange={vm.onRepNotes} rows={3} placeholder="Se incluyen en Observaciones" style={css("padding:8px 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;resize:vertical;font-size:var(--type-body-size);line-height:var(--type-body-lh)")} />
          </label>
          <label style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
            {"Enmascarar número de serie "}
            <button role="switch" aria-checked={vm.swRepMask?.on} onClick={vm.toggleRepMask} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.swRepMask?.track ?? ''};transition:background-color var(--dur-fast) var(--ease-out)`)}>
              <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.swRepMask?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
            </button>
          </label>
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
            <span>
              Papel
            </span>
            <div role="group" aria-label="Papel" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
              {(vm.papers || []).map((o: any, i1: number) => (
                <Fragment key={i1}>
                  <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    {o?.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
            <span>
              Formato
            </span>
            <div role="group" aria-label="Formato" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
              {(vm.formats || []).map((o: any, i1: number) => (
                <Fragment key={i1}>
                  <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    {o?.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("margin-top:auto;display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:0.5px solid var(--border-subtle)")}>
            {vm.repShowSteps ? (
              <>
                <ol aria-live="polite" style={css("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px")}>
                  {(vm.repSteps || []).map((st: any, i1: number) => (
                    <Fragment key={i1}>
                      <li style={css(`display:flex;align-items:center;gap:8px;font-size:var(--type-callout-size);color:${st?.fg ?? ''}`)}>
                        <span style={css("width:14px;height:14px;display:grid;place-items:center;flex:none")}>
                          {st?.done ? (
                            <>
                              <svg data-anim="pop" width="14" height="14" style={css("color:var(--health-optimal-solid)")}>
                                <use href="#i-check-circle" />
                              </svg>
                            </>
                          ) : null}
                          {st?.act ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 16 16" style={css("animation:hdi-spin 0.9s linear infinite")}>
                                <circle cx="8" cy="8" r="6.5" fill="none" style={css("stroke:var(--ring-track);stroke-width:2.5")} />
                                <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" style={css("stroke:var(--accent);stroke-width:2.5;stroke-linecap:round")} />
                              </svg>
                            </>
                          ) : null}
                          {st?.err ? (
                            <>
                              <svg data-anim="pop" width="14" height="14" style={css("color:var(--health-critical-solid)")}>
                                <use href="#i-octagon" />
                              </svg>
                            </>
                          ) : null}
                          {st?.pend ? (
                            <>
                              <span style={css("width:10px;height:10px;border-radius:50%;border:1.5px solid var(--border-strong)")} />
                            </>
                          ) : null}
                        </span>
                        {st?.label}
                        {" "}
                      </li>
                    </Fragment>
                  ))}
                </ol>
              </>
            ) : null}
            {vm.repErr ? (
              <>
                <div data-component="Banner" data-variant="critical" role="alert" data-anim="rise" style={css("display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:var(--r-md);background:var(--health-critical-bg);box-shadow:inset 0 0 0 0.5px var(--health-critical-border);font-size:var(--type-callout-size)")}>
                  <svg width="14" height="14" style={css("flex:none;margin-top:1px;color:var(--health-critical-fg)")}>
                    <use href="#i-octagon" />
                  </svg>
                  <span>
                    <strong style={css("font-weight:600;color:var(--health-critical-fg)")}>
                      No se pudo guardar el archivo.
                    </strong>
                    {" El disco de destino no tiene espacio suficiente (quedan 12 MB). Libera espacio o elige otra carpeta."}
                  </span>
                </div>
              </>
            ) : null}
            {vm.repIdle ? (
              <>
                <button className={cx(pc("hover", "background:var(--accent-hover)"), pc("active", "transform:scale(0.97)"))} data-anim="fade" onClick={vm.genReport} style={css("display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;transition:transform var(--dur-press) var(--ease-out)")}>
                  <svg width="14" height="14">
                    <use href="#i-download" />
                  </svg>
                  Exportar reporte
                </button>
              </>
            ) : null}
            {vm.repGen ? (
              <>
                <button disabled={vm.true} style={css("display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border:0;border-radius:var(--r-md);background:var(--accent-soft);color:var(--accent-fg);font-weight:600")}>
                  Generando…
                </button>
              </>
            ) : null}
            {vm.repDone ? (
              <>
                <button className={cx(pc("active", "transform:scale(0.97)"))} data-anim="pop" onClick={vm.showFinder} style={css("display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border:0;border-radius:var(--r-md);background:var(--health-optimal-bg);box-shadow:inset 0 0 0 0.5px var(--health-optimal-border);color:var(--health-optimal-fg);font-weight:600")}>
                  <svg width="14" height="14">
                    <use href="#i-check" />
                  </svg>
                  Guardado · Mostrar en Finder
                </button>
              </>
            ) : null}
            {vm.repErr ? (
              <>
                <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.genReport} style={css("display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                  <svg width="14" height="14">
                    <use href="#i-refresh" />
                  </svg>
                  Reintentar
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--surface-sunken)")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;height:40px;padding:0 20px;flex:none")}>
            <span style={css("font-weight:600")}>
              Vista previa
            </span>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              {vm.repPagesTxt}
            </span>
          </div>
          {/* @component SheetPreviewFrame | states: default, rising */}
          <div style={css("flex:1;min-height:0;overflow:auto;padding:0 20px 24px;display:flex;justify-content:center")}>
            <div data-paper="" data-component="SheetPreviewFrame" style={css(`width:440px;height:${vm.previewWrapH ?? ''};flex:none;overflow:hidden;border-radius:var(--r-md)`)}>
              <iframe title="Vista previa del reporte" src={vm.previewSrc} style={css(`width:880px;height:${vm.previewH ?? ''};border:0;transform:scale(0.5);transform-origin:top left;display:block;background:transparent`)} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
