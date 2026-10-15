// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function IdentityTab({ vm }: { vm: VM }) {
  return (
    <>
      <div style={css("display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:20px;align-items:start")}>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
            Identidad
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);padding:4px 0")}>
            {(vm.idv?.rows || []).map((kv: any, i1: number) => (
              <Fragment key={i1}>
                {/* @component KeyValue | states: default, masked, copied */}
                <div className={cx(pc("hover", "background:var(--surface-hover)"))} data-component="KeyValue" style={css("display:grid;grid-template-columns:170px minmax(0,1fr) auto;gap:12px;align-items:center;min-height:34px;padding:0 8px 0 16px")}>
                  <span style={css("color:var(--text-secondary);font-size:var(--type-callout-size)")}>
                    {kv?.k}
                  </span>
                  <span data-tip={kv?.tip} style={css(`font-family:${kv?.mono ?? ''};font-size:var(--type-callout-size);white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
                    {kv?.v}
                  </span>
                  <span style={css("display:flex;gap:2px")}>
                    {kv?.serial ? (
                      <>
                        <button className={cx(pc("hover", "background:var(--surface-pressed)"))} onClick={kv?.toggleSerial} aria-label={kv?.eyeLbl} data-tip={kv?.eyeLbl} style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                          <svg width="13" height="13">
                            <use href={kv?.eyeIcon} />
                          </svg>
                        </button>
                      </>
                    ) : null}
                    <button className={cx(pc("hover", "background:var(--surface-pressed)"))} onClick={kv?.copy} aria-label="Copiar" data-tip="Copiar" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                      <svg width="13" height="13">
                        <use href={kv?.copyIcon} />
                      </svg>
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:16px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
            Capacidades
          </h2>
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Comandos admin opcionales
            </span>
            <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
              {(vm.idv?.admin || []).map((ch: any, i1: number) => (
                <Fragment key={i1}>
                  {/* @component Chip | variants: filter, flag | states: on, off */}
                  <span data-component="Chip" data-variant="flag" data-state={ch?.state} aria-label={`${ch?.label ?? ''}: ${ch?.state ?? ''}`} style={css(`display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 10px 0 7px;border-radius:var(--r-pill);background:${ch?.bg ?? ''};color:${ch?.fg ?? ''};border:1px ${ch?.bstyle ?? ''} ${ch?.border ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    <svg width="12" height="12">
                      <use href={ch?.icon} />
                    </svg>
                    {ch?.label}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Comandos NVM
            </span>
            <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
              {(vm.idv?.nvm || []).map((ch: any, i1: number) => (
                <Fragment key={i1}>
                  <span data-component="Chip" data-variant="flag" data-state={ch?.state} style={css(`display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 10px 0 7px;border-radius:var(--r-pill);background:${ch?.bg ?? ''};color:${ch?.fg ?? ''};border:1px ${ch?.bstyle ?? ''} ${ch?.border ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    <svg width="12" height="12">
                      <use href={ch?.icon} />
                    </svg>
                    {ch?.label}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Umbrales de temperatura
            </span>
            <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:8px")}>
              {(vm.idv?.thresholds || []).map((th: any, i1: number) => (
                <Fragment key={i1}>
                  <div style={css("display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                      {th?.k}
                    </span>
                    <span style={css("font-weight:600")}>
                      {th?.v}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Estados de energía
            </span>
            <div style={css("border-radius:var(--r-md);box-shadow:inset 0 0 0 0.5px var(--border-subtle);overflow:hidden;font-size:var(--type-callout-size)")}>
              <div style={css("display:grid;grid-template-columns:44px 1fr 1fr 1fr 1fr;gap:8px;height:26px;align-items:center;padding:0 12px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);background:var(--surface-sunken)")}>
                <span>
                  Estado
                </span>
                <span style={css("text-align:right")}>
                  Potencia máx.
                </span>
                <span>
                  Tipo
                </span>
                <span style={css("text-align:right")}>
                  Entrada
                </span>
                <span style={css("text-align:right")}>
                  Salida
                </span>
              </div>
              {(vm.idv?.ps || []).map((ps: any, i1: number) => (
                <Fragment key={i1}>
                  <div style={css("display:grid;grid-template-columns:44px 1fr 1fr 1fr 1fr;gap:8px;height:26px;align-items:center;padding:0 12px")}>
                    <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                      {ps?.id}
                    </span>
                    <span style={css("text-align:right")}>
                      {ps?.w}
                    </span>
                    <span style={css("color:var(--text-secondary)")}>
                      {ps?.op}
                    </span>
                    <span style={css("text-align:right;color:var(--text-secondary)")}>
                      {ps?.en}
                    </span>
                    <span style={css("text-align:right;color:var(--text-secondary)")}>
                      {ps?.ex}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Formatos LBA
            </span>
            <div style={css("border-radius:var(--r-md);box-shadow:inset 0 0 0 0.5px var(--border-subtle);overflow:hidden;font-size:var(--type-callout-size)")}>
              <div style={css("display:grid;grid-template-columns:44px 1fr 1fr 1.4fr;gap:8px;height:26px;align-items:center;padding:0 12px;font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);background:var(--surface-sunken)")}>
                <span>
                  ID
                </span>
                <span>
                  Datos
                </span>
                <span>
                  Metadatos
                </span>
                <span>
                  Rendimiento
                </span>
              </div>
              {(vm.idv?.lba || []).map((lf: any, i1: number) => (
                <Fragment key={i1}>
                  <div style={css("display:grid;grid-template-columns:44px 1fr 1fr 1.4fr;gap:8px;height:26px;align-items:center;padding:0 12px")}>
                    <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
                      {lf?.id}
                    </span>
                    <span>
                      {lf?.size}
                    </span>
                    <span style={css("color:var(--text-secondary)")}>
                      {lf?.meta}
                    </span>
                    <span style={css("color:var(--text-secondary)")}>
                      {lf?.perf}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
