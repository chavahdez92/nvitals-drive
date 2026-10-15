// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function HistoryScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Historial" data-anim="fade" style={css("display:grid;grid-template-columns:300px minmax(0,1fr);min-height:100%")}>
        <div role="listbox" aria-label="Discos vistos" style={css("display:flex;flex-direction:column;gap:2px;padding:12px 10px 20px;border-right:0.5px solid var(--border-subtle)")}>
          <span style={css("padding:4px 10px 6px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>
            Discos vistos
          </span>
          {(vm.seen || []).map((h: any, i1: number) => (
            <Fragment key={i1}>
              <button className={cx(pc("hover", "background:var(--surface-hover)"))} role="option" onClick={h?.pick} style={css(`display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:0;border-radius:var(--r-md);background:${h?.bg ?? ''};text-align:left`)}>
                <svg width="15" height="15" style={css(`flex:none;margin-top:2px;color:${h?.vSolid ?? ''}`)} aria-label={h?.vLabel}>
                  <use href={h?.vIcon} />
                </svg>
                <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:1px")}>
                  <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                    {h?.model}
                  </span>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                    {h?.serial}
                  </span>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-secondary)")}>
                    {h?.last}
                  </span>
                  <span style={css(`display:inline-flex;align-items:center;gap:4px;font-size:var(--type-note-size);color:${h?.tFg ?? ''}`)}>
                    <svg width="11" height="11">
                      <use href={h?.tIcon} />
                    </svg>
                    {h?.trend}
                  </span>
                </span>
                <span style={css(`font-size:var(--type-caption-size);font-weight:600;color:${h?.statusFg ?? ''}`)}>
                  {h?.status}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
        <div style={css("padding:16px 24px 32px;display:flex;flex-direction:column;gap:18px;min-width:0")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;gap:4px")}>
              <h2 style={css("margin:0;font-size:var(--type-title2-size);font-weight:650;letter-spacing:var(--type-title2-track)")}>
                {vm.hSel?.model}
              </h2>
              <span style={css("display:flex;align-items:center;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                <span style={css(`display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 5px;border-radius:var(--r-pill);background:${vm.hSel?.vBg ?? ''};color:${vm.hSel?.vFg ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                  <svg width="12" height="12">
                    <use href={vm.hSel?.vIcon} />
                  </svg>
                  {vm.hSel?.vLabel}
                </span>
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                  {vm.hSel?.serial}
                </span>
                {"· "}
                {vm.hSel?.count}
              </span>
            </div>
            <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.goCompare} disabled={vm.hSel?.nodata} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
              <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--accent-fg)")}>
                A↔B
              </span>
              Comparar instantáneas
            </button>
          </div>
          {vm.hasCharts ? (
            <>
              <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px")}>
                {(vm.hCharts || []).map((ch: any, i1: number) => (
                  <Fragment key={i1}>
                    <div style={css("display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
                      <div style={css("display:flex;justify-content:space-between;align-items:baseline")}>
                        <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                          {ch?.label}
                        </span>
                        <span style={css("font-size:var(--type-title3-size);font-weight:600")}>
                          {ch?.now}
                        </span>
                      </div>
                      <svg viewBox="-4 -4 248 64" width="100%" style={css("display:block;overflow:visible")} aria-hidden="true">
                        <path d={ch?.path} fill="none" style={css("stroke:var(--data-temp);stroke-width:1.75;stroke-linejoin:round")} />
                        {(ch?.dots || []).map((dt: any, i2: number) => (
                          <Fragment key={i2}>
                            <circle cx={dt?.cx} cy={dt?.cy} r="2.5" style={css("fill:var(--surface-raised);stroke:var(--data-temp);stroke-width:1.5")} />
                          </Fragment>
                        ))}
                      </svg>
                      <span style={css("display:flex;justify-content:space-between;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                        <span>
                          {ch?.first}
                        </span>
                        <span>
                          {ch?.range}
                        </span>
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <div style={css("display:flex;justify-content:space-between;align-items:baseline")}>
              <h3 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
                Instantáneas
              </h3>
              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                Elige dos (A y B) para compararlas
              </span>
            </div>
            <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
              <div style={css("display:grid;grid-template-columns:36px minmax(0,1.2fr) 90px 110px 100px 90px 90px;gap:12px;height:30px;align-items:center;padding:0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                <span />
                <span>
                  Fecha
                </span>
                <span style={css("text-align:right")}>
                  Vida útil
                </span>
                <span style={css("text-align:right")}>
                  Escritos
                </span>
                <span style={css("text-align:right")}>
                  Horas
                </span>
                <span style={css("text-align:right")}>
                  Errores
                </span>
                <span style={css("text-align:right")}>
                  Temp. máx.
                </span>
              </div>
              {(vm.snaps || []).map((sn: any, i1: number) => (
                <Fragment key={i1}>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={sn?.pick} style={css("width:100%;display:grid;grid-template-columns:36px minmax(0,1.2fr) 90px 110px 100px 90px 90px;gap:12px;min-height:34px;align-items:center;padding:0 16px;border:0;border-bottom:0.5px solid var(--border-subtle);background:transparent;text-align:left")}>
                    <span style={css(`width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:${sn?.tagBg ?? ''};box-shadow:inset 0 0 0 1px ${sn?.tagBorder ?? ''};color:${sn?.tagFg ?? ''};font-size:var(--type-caption-size);font-weight:700`)}>
                      {sn?.tag}
                    </span>
                    <span>
                      {sn?.date}
                      {" "}
                      <span style={css("font-size:var(--type-note-size);color:var(--accent-fg);font-weight:600;margin-left:4px")}>
                        {sn?.isLast}
                      </span>
                    </span>
                    <span style={css("text-align:right")}>
                      {sn?.life}
                    </span>
                    <span style={css("text-align:right")}>
                      {sn?.w}
                    </span>
                    <span style={css("text-align:right;color:var(--text-secondary)")}>
                      {sn?.hours}
                    </span>
                    <span style={css("text-align:right")}>
                      {sn?.media}
                    </span>
                    <span style={css("text-align:right;color:var(--text-secondary)")}>
                      {sn?.maxT}
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
