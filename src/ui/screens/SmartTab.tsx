// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function SmartTab({ vm }: { vm: VM }) {
  return (
    <>
      {vm.d?.hasData ? (
        <>
          <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start")}>
            <div style={css("display:flex;flex-direction:column;gap:12px")}>
              <div style={css("display:flex;align-items:center;justify-content:space-between")}>
                <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
                  {"Log de salud NVMe "}
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary);font-weight:400")}>
                    0x02
                  </span>
                </h2>
                {/* @component Switch | states: off, on, focus, disabled */}
                <label data-component="Switch" style={css("display:flex;align-items:center;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  <button role="switch" aria-checked={vm.rawOn} onClick={vm.toggleRaw} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.rawTrack ?? ''};transition:background-color var(--dur-fast) var(--ease-out)`)}>
                    <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.rawKnob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
                  </button>
                  {" Mostrar valores crudos "}
                </label>
              </div>
              {/* @component Table | variants: grouped | states: default, raw */}
              <div data-component="Table" style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
                <div style={css("display:grid;grid-template-columns:minmax(0,1.6fr) 110px 50px minmax(0,1fr) 96px;gap:12px;align-items:center;height:30px;padding:0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                  <span>
                    Atributo
                  </span>
                  <span style={css("text-align:right")}>
                    Valor
                  </span>
                  <span>
                    Unidad
                  </span>
                  <span>
                    Crudo
                  </span>
                  <span>
                    Estado
                  </span>
                </div>
                {(vm.groups || []).map((g: any, i1: number) => (
                  <Fragment key={i1}>
                    <div>
                      <div style={css("padding:12px 16px 4px;font-size:var(--type-caption-size);line-height:var(--type-caption-lh);font-weight:var(--type-caption-weight);letter-spacing:var(--type-caption-track);text-transform:uppercase;color:var(--text-tertiary)")}>
                        {g?.title}
                      </div>
                      {(g?.rows || []).map((row: any, i2: number) => (
                        <Fragment key={i2}>
                          <div className={cx(pc("hover", "background:var(--surface-hover)"))} style={css("display:grid;grid-template-columns:minmax(0,1.6fr) 110px 50px minmax(0,1fr) 96px;gap:12px;align-items:center;min-height:32px;padding:0 16px")}>
                            <span style={css("display:flex;align-items:center;gap:6px;min-width:0")}>
                              <span style={css("white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                                {row?.name}
                              </span>
                              <span data-tip={row?.help} aria-label="¿Qué significa?" style={css("flex:none;display:grid;color:var(--text-tertiary)")}>
                                <svg width="13" height="13">
                                  <use href="#i-help" />
                                </svg>
                              </span>
                            </span>
                            <span data-flash="" style={css("text-align:right;font-weight:600;border-radius:4px")}>
                              {row?.val}
                            </span>
                            <span style={css("color:var(--text-secondary);font-size:var(--type-callout-size)")}>
                              {row?.unit}
                            </span>
                            <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                              {vm.raw ? (
                                <>
                                  <span>
                                    {row?.key}
                                    {" = "}
                                    {row?.raw}
                                  </span>
                                </>
                              ) : null}
                            </span>
                            <span style={css(`display:inline-flex;align-items:center;gap:4px;color:${row?.stFg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                              <svg width="13" height="13">
                                <use href={row?.stIcon} />
                              </svg>
                              {row?.stLabel}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
                <div style={css("height:8px")} />
              </div>
            </div>
            <div style={css("position:sticky;top:120px;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between")}>
                <strong style={css("font-weight:600")}>
                  Advertencia crítica
                </strong>
                <span style={css("font-family:var(--font-mono);font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  {vm.critHex}
                </span>
              </div>
              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                Banderas decodificadas del campo critical_warning.
              </span>
              {(vm.flags || []).map((fl: any, i1: number) => (
                <Fragment key={i1}>
                  <div data-state={fl?.state} style={css(`display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r-sm);background:${fl?.bg ?? ''}`)}>
                    <svg width="14" height="14" style={css(`flex:none;color:${fl?.fg ?? ''}`)} aria-label={fl?.state}>
                      <use href={fl?.icon} />
                    </svg>
                    <span style={css("flex:1;font-size:var(--type-callout-size)")}>
                      {fl?.label}
                    </span>
                    <span style={css("font-family:var(--font-mono);font-size:var(--type-caption-size);color:var(--text-tertiary)")}>
                      {fl?.bit}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
