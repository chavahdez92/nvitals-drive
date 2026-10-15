// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ReportsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Reportes" data-anim="fade" style={css("padding:14px 24px 32px;max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:16px")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px")}>
          <span style={css("color:var(--text-secondary)")}>
            {"Reportes guardados en "}
            <span style={css("font-family:var(--font-mono);font-size:var(--type-callout-size)")}>
              ~/Documents/NVitals Drive
            </span>
          </span>
          <button className={cx(pc("hover", "background:var(--accent-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.newReport} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;transition:transform var(--dur-press) var(--ease-out)")}>
            <svg width="14" height="14">
              <use href="#i-plus" />
            </svg>
            Nuevo reporte
            <span style={css("font-size:var(--type-note-size);opacity:.75")}>
              ⌘E
            </span>
          </button>
        </div>
        {vm.hasReports ? (
          <>
            <div role="table" aria-label="Reportes" style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
              <div role="row" style={css("display:grid;grid-template-columns:150px minmax(0,1.6fr) 110px 70px minmax(0,1fr) 110px;gap:12px;align-items:center;height:30px;padding:0 12px 0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                <span>
                  Fecha
                </span>
                <span>
                  Disco
                </span>
                <span>
                  Veredicto
                </span>
                <span>
                  Formato
                </span>
                <span>
                  Referencia
                </span>
                <span />
              </div>
              {(vm.reportRows || []).map((rp: any, i1: number) => (
                <Fragment key={i1}>
                  <div className={cx(pc("hover", "background:var(--surface-hover)"))} role="row" data-report-id={rp?.id} data-anim={rp?.anim} style={css("display:grid;grid-template-columns:150px minmax(0,1.6fr) 110px 70px minmax(0,1fr) 110px;gap:12px;align-items:center;min-height:48px;padding:0 12px 0 16px;border-bottom:0.5px solid var(--border-subtle)")}>
                    <span style={css("display:flex;flex-direction:column")}>
                      <span>
                        {rp?.date}
                      </span>
                      <span style={css("font-family:var(--font-mono);font-size:var(--type-caption-size);color:var(--text-tertiary)")}>
                        {rp?.id}
                      </span>
                    </span>
                    <span style={css("display:flex;flex-direction:column;min-width:0")}>
                      <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                        {rp?.model}
                      </span>
                      <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                        {rp?.disk}
                        {" · "}
                        {rp?.pagesTxt}
                      </span>
                    </span>
                    <span style={css(`justify-self:start;display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 5px;border-radius:var(--r-pill);background:${rp?.vBg ?? ''};color:${rp?.vFg ?? ''};box-shadow:inset 0 0 0 0.5px ${rp?.vBorder ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                      <svg width="12" height="12">
                        <use href={rp?.vIcon} />
                      </svg>
                      {rp?.vLabel}
                    </span>
                    <span style={css("justify-self:start;display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:var(--r-xs);background:var(--surface-hover);font-family:var(--font-mono);font-size:var(--type-note-size);font-weight:600;color:var(--text-secondary)")}>
                      {rp?.format}
                    </span>
                    <span style={css("color:var(--text-secondary);font-size:var(--type-callout-size);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                      {rp?.client}
                    </span>
                    <span style={css("display:flex;justify-content:flex-end;gap:2px")}>
                      <button className={cx(pc("hover", "background:var(--surface-pressed)"))} onClick={rp?.open} aria-label="Abrir" data-tip="Abrir" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                        <svg width="14" height="14">
                          <use href="#i-external" />
                        </svg>
                      </button>
                      <button className={cx(pc("hover", "background:var(--surface-pressed)"))} onClick={rp?.finder} aria-label="Mostrar en Finder" data-tip="Mostrar en Finder" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                        <svg width="14" height="14">
                          <use href="#i-folder" />
                        </svg>
                      </button>
                      <button className={cx(pc("hover", "background:var(--health-critical-bg)"))} onClick={rp?.del} aria-label="Eliminar" data-tip="Eliminar" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--health-critical-fg)")}>
                        <svg width="14" height="14">
                          <use href="#i-trash" />
                        </svg>
                      </button>
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.noReports ? (
          <>
            <div data-component="EmptyState" data-variant="reports" data-anim="fade" style={css("display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:72px 20px")}>
              <svg width="36" height="36" style={css("color:var(--text-tertiary)")}>
                <use href="#i-report" />
              </svg>
              <strong style={css("font-size:var(--type-title3-size);font-weight:600")}>
                Aún no hay reportes
              </strong>
              <p style={css("margin:0;max-width:380px;color:var(--text-secondary);text-wrap:pretty")}>
                Genera un reporte desde el detalle de un disco para compartir su estado con un cliente o guardarlo en tu inventario.
              </p>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.newReport} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                Generar reporte
              </button>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
