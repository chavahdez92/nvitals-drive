// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function TemperatureTab({ vm }: { vm: VM }) {
  return (
    <>
      {vm.d?.hasData ? (
        <>
          <div style={css("display:flex;flex-direction:column;gap:16px")}>
            <div style={css("display:flex;flex-direction:column;gap:14px;padding:18px 20px;border-radius:var(--r-xl);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
              <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap")}>
                <div style={css("display:flex;align-items:flex-end;gap:16px")}>
                  <span data-temp-badge={vm.d?.id} aria-live="polite" style={css(`font-family:var(--font-display);font-size:48px;line-height:50px;font-weight:700;letter-spacing:-0.03em;color:${vm.tv?.tFg ?? ''}`)}>
                    {vm.tv?.now}
                    <span style={css("font-size:22px;font-weight:600;color:var(--text-secondary);margin-left:2px")}>
                      {vm.tv?.unitLbl}
                    </span>
                  </span>
                  <div style={css("display:flex;flex-direction:column;gap:6px;padding-bottom:4px")}>
                    <span style={css(`align-self:flex-start;display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 6px;border-radius:var(--r-pill);background:${vm.tv?.stBg ?? ''};color:${vm.tv?.stColor ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                      <svg width="12" height="12">
                        <use href={vm.tv?.stIcon} />
                      </svg>
                      {vm.tv?.stLabel}
                    </span>
                    <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                      {"Mín. "}
                      {vm.tv?.min}
                      {" · Máx. "}
                      {vm.tv?.max}
                      {" · Prom. "}
                      {vm.tv?.avg}
                    </span>
                  </div>
                </div>
                <div style={css("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
                  <div role="group" aria-label="Ventana" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
                    {(vm.wins || []).map((w: any, i1: number) => (
                      <Fragment key={i1}>
                        <button onClick={w?.pick} aria-pressed={w?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${w?.bg ?? ''};box-shadow:${w?.shadow ?? ''};color:${w?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                          {w?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <div role="group" aria-label="Intervalo" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
                    {(vm.ints || []).map((w: any, i1: number) => (
                      <Fragment key={i1}>
                        <button onClick={w?.pick} aria-pressed={w?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${w?.bg ?? ''};box-shadow:${w?.shadow ?? ''};color:${w?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                          {w?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.togglePause} style={css("display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500")}>
                    <svg width="13" height="13">
                      <use href={vm.pauseIcon} />
                    </svg>
                    {vm.pauseLabel}
                  </button>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.resetTemp} style={css("display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500")}>
                    <svg width="13" height="13">
                      <use href="#i-refresh" />
                    </svg>
                    Reiniciar
                  </button>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.exportCsv} style={css("display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);font-size:var(--type-callout-size);font-weight:500")}>
                    <svg width="13" height="13">
                      <use href="#i-download" />
                    </svg>
                    Exportar CSV
                  </button>
                </div>
              </div>
              {/* @component LiveLineChart | variants: temperature | states: live, paused */}
              <div style={css("position:relative")}>
                <svg data-component="LiveLineChart" viewBox="0 0 812 256" width="100%" style={css("display:block;overflow:hidden")} role="img" aria-label="Gráfico de temperatura en vivo">
                  <defs>
                    <clipPath id="tc-plot">
                      <rect x="44" y="16" width="760" height="220" />
                    </clipPath>
                    <clipPath id="tc-norm">
                      <rect x="0" y={vm.tv?.yWarn} width="812" height={vm.tv?.hNorm} />
                    </clipPath>
                    <clipPath id="tc-warn">
                      <rect x="0" y={vm.tv?.yCrit} width="812" height={vm.tv?.hWarn} />
                    </clipPath>
                    <clipPath id="tc-crit">
                      <rect x="0" y="0" width="812" height={vm.tv?.yCrit} />
                    </clipPath>
                  </defs>
                  <rect x="44" y={vm.tv?.yCrit} width="760" height={vm.tv?.hWarn} style={css("fill:var(--band-warn)")} />
                  <rect x="44" y="16" width="760" height={vm.tv?.hCrit} style={css("fill:var(--band-crit)")} />
                  {(vm.tv?.ticks || []).map((tk: any, i1: number) => (
                    <Fragment key={i1}>
                      <line x1="44" x2="804" y1={tk?.y} y2={tk?.y} style={css("stroke:var(--chart-grid);stroke-width:1")} />
                    </Fragment>
                  ))}
                  <line x1="44" x2="804" y1={vm.tv?.yWarn} y2={vm.tv?.yWarn} style={css("stroke:var(--data-warn);stroke-width:1;stroke-dasharray:4 4")} />
                  <line x1="44" x2="804" y1={vm.tv?.yCrit} y2={vm.tv?.yCrit} style={css("stroke:var(--data-crit);stroke-width:1;stroke-dasharray:4 4")} />
                  <g style={css("clip-path:url(#tc-plot)")}>
                    <g data-live-path="" data-dx={vm.tv?.dx}>
                      <path d={vm.tv?.area} style={css("fill:var(--data-fill)")} />
                      <path d={vm.tv?.path} fill="none" style={css("clip-path:url(#tc-norm);stroke:var(--data-temp);stroke-width:1.75;stroke-linejoin:round")} />
                      <path d={vm.tv?.path} fill="none" style={css("clip-path:url(#tc-warn);stroke:var(--data-warn);stroke-width:1.75;stroke-linejoin:round")} />
                      <path d={vm.tv?.path} fill="none" style={css("clip-path:url(#tc-crit);stroke:var(--data-crit);stroke-width:1.75;stroke-linejoin:round")} />
                    </g>
                  </g>
                </svg>
                {(vm.tv?.ticks || []).map((tk: any, i1: number) => (
                  <Fragment key={i1}>
                    <span aria-hidden="true" style={css(`position:absolute;left:0;width:4.4%;top:${tk?.top ?? ''};transform:translateY(-50%);text-align:right;font-size:10px;color:var(--chart-axis)`)}>
                      {tk?.label}
                    </span>
                  </Fragment>
                ))}
                {(vm.tv?.xl || []).map((xl: any, i1: number) => (
                  <Fragment key={i1}>
                    <span aria-hidden="true" style={css(`position:absolute;bottom:0;left:${xl?.left ?? ''};transform:${xl?.tx ?? ''};font-size:10px;color:var(--chart-axis);white-space:nowrap`)}>
                      {xl?.label}
                    </span>
                  </Fragment>
                ))}
                <span aria-hidden="true" style={css(`position:absolute;right:1.2%;top:${vm.tv?.lblWarnTop ?? ''};font-size:10px;font-weight:600;color:var(--health-warning-fg)`)}>
                  {vm.tv?.warnLbl}
                </span>
                <span aria-hidden="true" style={css(`position:absolute;right:1.2%;top:${vm.tv?.lblCritTop ?? ''};transform:translateY(-100%);font-size:10px;font-weight:600;color:var(--health-critical-fg)`)}>
                  {vm.tv?.critLbl}
                </span>
              </div>
            </div>
            <div style={css("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px")}>
              <div style={css("display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
                <strong style={css("font-weight:600")}>
                  Sensores
                </strong>
                {(vm.tv?.sensors || []).map((sn: any, i1: number) => (
                  <Fragment key={i1}>
                    <div style={css("display:flex;flex-direction:column;gap:4px")}>
                      <div style={css("display:flex;justify-content:space-between;font-size:var(--type-callout-size)")}>
                        <span style={css("color:var(--text-secondary)")}>
                          {sn?.label}
                        </span>
                        <span style={css("font-weight:600")}>
                          {sn?.val}
                        </span>
                      </div>
                      <div style={css("height:4px;border-radius:2px;background:var(--ring-track);overflow:hidden")}>
                        <div style={css(`height:100%;width:100%;background:var(--data-temp);transform-origin:left;transform:scaleX(${sn?.scale ?? ''});transition:transform var(--dur-moderate) var(--ease-out)`)} />
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div style={css("display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
                <strong style={css("font-weight:600")}>
                  Historial térmico del disco
                </strong>
                <div style={css("display:flex;justify-content:space-between;font-size:var(--type-callout-size)")}>
                  <span style={css("color:var(--text-secondary)")}>
                    Sobre advertencia
                  </span>
                  <span style={css("font-weight:600")}>
                    {vm.tv?.warnTime}
                  </span>
                </div>
                <div style={css("display:flex;justify-content:space-between;font-size:var(--type-callout-size)")}>
                  <span style={css("color:var(--text-secondary)")}>
                    Sobre crítica
                  </span>
                  <span style={css("font-weight:600")}>
                    {vm.tv?.critTime}
                  </span>
                </div>
                <span style={css(`display:inline-flex;align-items:center;gap:5px;font-size:var(--type-callout-size);font-weight:500;color:${vm.tv?.throttleFg ?? ''}`)}>
                  <svg width="13" height="13">
                    <use href={vm.tv?.throttleIcon} />
                  </svg>
                  {vm.tv?.throttle}
                </span>
              </div>
              <div style={css("display:flex;gap:10px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-sunken)")}>
                <svg width="16" height="16" style={css("flex:none;color:var(--accent-fg);margin-top:1px")}>
                  <use href="#i-info" />
                </svg>
                <div style={css("display:flex;flex-direction:column;gap:4px")}>
                  <strong style={css("font-weight:600")}>
                    Consejo
                  </strong>
                  <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);text-wrap:pretty")}>
                    {vm.tv?.tip}
                  </span>
                  {vm.tv?.est ? (
                    <>
                      <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                        Este disco no reporta umbrales de temperatura: se muestran umbrales estimados de 70/80 °C.
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
