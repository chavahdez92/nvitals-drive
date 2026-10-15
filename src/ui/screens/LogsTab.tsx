// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function LogsTab({ vm }: { vm: VM }) {
  return (
    <>
      {vm.d?.hasData ? (
        <>
          <div style={css("display:flex;flex-direction:column;gap:24px")}>
            <div style={css("display:flex;flex-direction:column;gap:8px")}>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between")}>
                <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
                  {"Log de información de errores "}
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary);font-weight:400")}>
                    0x01
                  </span>
                </h2>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  {vm.errNote}
                </span>
              </div>
              {vm.errUnavailable ? (
                <>
                  <div data-component="Banner" data-variant="info" role="status" style={css("display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:var(--r-lg);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-subtle)")}>
                    <svg width="16" height="16" style={css("flex:none;color:var(--text-secondary);margin-top:1px")}>
                      <use href="#i-info" />
                    </svg>
                    <div style={css("display:flex;flex-direction:column;gap:4px")}>
                      <span>
                        <strong style={css("font-weight:600")}>
                          Lectura parcial.
                        </strong>
                        {" Este disco no permite leer el log de errores (GetLogPage falló)."}
                      </span>
                      <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                        Los demás datos SMART sí están disponibles. smartctl terminó con el código de salida 4.
                      </span>
                      <span style={css("align-self:flex-start;display:inline-flex;height:20px;align-items:center;padding:0 8px;border-radius:var(--r-pill);background:var(--health-warning-bg);color:var(--health-warning-fg);font-size:var(--type-note-size);font-weight:600")}>
                        4 · Lectura parcial: un comando falló
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
              {vm.errEmpty ? (
                <>
                  <div style={css("display:flex;align-items:center;gap:10px;padding:18px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);color:var(--text-secondary)")}>
                    <svg width="16" height="16" style={css("color:var(--health-optimal-fg)")}>
                      <use href="#i-check-circle" />
                    </svg>
                    Sin errores registrados
                  </div>
                </>
              ) : null}
              {vm.hasErr ? (
                <>
                  <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
                    <div style={css("display:grid;grid-template-columns:40px 70px 56px 80px minmax(0,1fr) 140px 50px;gap:12px;height:30px;align-items:center;padding:0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                      <span>
                        #
                      </span>
                      <span style={css("text-align:right")}>
                        Conteo
                      </span>
                      <span>
                        SQID
                      </span>
                      <span>
                        CMDID
                      </span>
                      <span>
                        Estado
                      </span>
                      <span style={css("text-align:right")}>
                        LBA
                      </span>
                      <span>
                        NSID
                      </span>
                    </div>
                    {(vm.errRows || []).map((er: any, i1: number) => (
                      <Fragment key={i1}>
                        <div className={cx(pc("hover", "background:var(--surface-hover)"))} style={css("display:grid;grid-template-columns:40px 70px 56px 80px minmax(0,1fr) 140px 50px;gap:12px;min-height:32px;align-items:center;padding:0 16px;font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                          <span style={css("color:var(--text-tertiary)")}>
                            {er?.n}
                          </span>
                          <span style={css("text-align:right")}>
                            {er?.count}
                          </span>
                          <span>
                            {er?.sqid}
                          </span>
                          <span>
                            {er?.cmdid}
                          </span>
                          <span style={css("font-family:var(--font-sans);font-size:var(--type-callout-size)")}>
                            {er?.status}
                          </span>
                          <span style={css("text-align:right")}>
                            {er?.lba}
                          </span>
                          <span>
                            {er?.nsid}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div style={css("display:flex;flex-direction:column;gap:8px")}>
              <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
                {"Log de autopruebas "}
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary);font-weight:400")}>
                  0x06
                </span>
              </h2>
              {vm.stUnsupported ? (
                <>
                  <div style={css("display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-sunken);color:var(--text-secondary)")}>
                    <svg width="16" height="16">
                      <use href="#i-info" />
                    </svg>
                    Este disco no admite autopruebas.
                  </div>
                </>
              ) : null}
              {vm.hasSt ? (
                <>
                  <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
                    <div style={css("display:grid;grid-template-columns:40px 120px minmax(0,1fr) 140px 160px;gap:12px;height:30px;align-items:center;padding:0 16px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
                      <span>
                        #
                      </span>
                      <span>
                        Tipo
                      </span>
                      <span>
                        Resultado
                      </span>
                      <span style={css("text-align:right")}>
                        Horas de encendido
                      </span>
                      <span style={css("text-align:right")}>
                        LBA con falla
                      </span>
                    </div>
                    {(vm.stRows || []).map((sr: any, i1: number) => (
                      <Fragment key={i1}>
                        <div className={cx(pc("hover", "background:var(--surface-hover)"))} style={css("display:grid;grid-template-columns:40px 120px minmax(0,1fr) 140px 160px;gap:12px;min-height:32px;align-items:center;padding:0 16px")}>
                          <span style={css("color:var(--text-tertiary);font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                            {sr?.n}
                          </span>
                          <span>
                            {sr?.type}
                          </span>
                          <span style={css(`display:inline-flex;align-items:center;gap:6px;color:${sr?.fg ?? ''}`)}>
                            <svg width="13" height="13">
                              <use href={sr?.icon} />
                            </svg>
                            {sr?.result}
                          </span>
                          <span style={css("text-align:right")}>
                            {sr?.hours}
                          </span>
                          <span style={css("text-align:right;font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                            {sr?.lba}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
