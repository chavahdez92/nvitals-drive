// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ConsoleTab({ vm }: { vm: VM }) {
  return (
    <>
      <div style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
          {(vm.cv?.tools || []).map((tl: any, i1: number) => (
            <Fragment key={i1}>
              <button className={cx(pc("hover", "background:var(--surface-raised-2)"), pc("active", "transform:scale(0.97)"))} onClick={tl?.run} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                {tl?.label}
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  {tl?.flag}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
        <div style={css("display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between")}>
            <strong style={css("font-weight:600")}>
              Modo experto
            </strong>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
              Solo opciones de lectura permitidas · sin texto libre
            </span>
          </div>
          <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
            {(vm.cv?.chips || []).map((ch: any, i1: number) => (
              <Fragment key={i1}>
                <button onClick={ch?.toggle} aria-pressed={ch?.on} data-tip={ch?.tip} style={css(`height:24px;padding:0 10px;border-radius:var(--r-pill);background:${ch?.bg ?? ''};color:${ch?.fg ?? ''};border:1px solid ${ch?.border ?? ''};font-family:var(--font-mono);font-size:var(--type-note-size);font-weight:500`)}>
                  {ch?.flag}
                </button>
              </Fragment>
            ))}
            <button onClick={vm.cv?.jsonToggle} aria-pressed={vm.cv?.jsonOn} data-tip="Salida JSON" style={css(`height:24px;padding:0 10px;border-radius:var(--r-pill);background:${vm.cv?.jsonBg ?? ''};color:${vm.cv?.jsonFg ?? ''};border:1px solid ${vm.cv?.jsonBorder ?? ''};font-family:var(--font-mono);font-size:var(--type-note-size);font-weight:500`)}>
              -j
            </button>
          </div>
          <div style={css("display:flex;align-items:center;gap:8px")}>
            <div data-component="CommandBlock" style={css("flex:1;display:flex;align-items:center;gap:8px;height:34px;padding:0 6px 0 12px;border-radius:var(--r-md);background:var(--surface-code);box-shadow:inset 0 0 0 0.5px var(--border-subtle);font-family:var(--font-mono);font-size:var(--type-mono-size)")}>
              <span style={css("color:var(--text-tertiary)")}>
                $
              </span>
              <span style={css("flex:1")}>
                {vm.cv?.cmd}
              </span>
              <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.cv?.copyCmd} aria-label="Copiar comando" data-tip="Copiar" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                <svg width="13" height="13">
                  <use href={vm.cv?.copyCmdIcon} />
                </svg>
              </button>
            </div>
            <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.cv?.run} style={css("display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
              <svg width="13" height="13">
                <use href="#i-play" />
              </svg>
              Ejecutar
            </button>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
          <div style={css("display:flex;align-items:center;gap:10px;height:40px;padding:0 10px 0 12px;border-bottom:0.5px solid var(--border-subtle)")}>
            <div role="tablist" aria-label="Formato de salida" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
              {(vm.cv?.views || []).map((vw: any, i1: number) => (
                <Fragment key={i1}>
                  <button role="tab" onClick={vw?.pick} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${vw?.bg ?? ''};box-shadow:${vw?.shadow ?? ''};color:${vw?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    {vw?.label}
                  </button>
                </Fragment>
              ))}
            </div>
            <div style={css("display:flex;gap:6px;flex:1")}>
              {(vm.cv?.exitChips || []).map((ec: any, i1: number) => (
                <Fragment key={i1}>
                  <span style={css(`display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:var(--r-pill);background:${ec?.bg ?? ''};color:${ec?.fg ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                    {ec?.label}
                  </span>
                </Fragment>
              ))}
            </div>
            {vm.cv?.isJson ? (
              <>
                <label style={css("display:flex;align-items:center;gap:6px;height:26px;padding:0 8px;border-radius:var(--r-md);background:var(--surface-sunken);color:var(--text-tertiary)")}>
                  <svg width="13" height="13">
                    <use href="#i-search" />
                  </svg>
                  <input value={vm.cv?.jq} onChange={vm.cv?.onJq} placeholder="Buscar en JSON" aria-label="Buscar en JSON" style={css("width:150px;border:0;background:transparent;outline:none;font-size:var(--type-callout-size);color:var(--text-primary)")} />
                </label>
              </>
            ) : null}
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.cv?.copyOut} aria-label="Copiar salida" data-tip="Copiar salida" style={css("width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
              <svg width="14" height="14">
                <use href={vm.cv?.copyOutIcon} />
              </svg>
            </button>
          </div>
          {vm.cv?.isView ? (
            <>
              <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px;padding:10px 16px")}>
                {(vm.cv?.fmtRows || []).map((fr: any, i1: number) => (
                  <Fragment key={i1}>
                    <div style={css("display:flex;justify-content:space-between;gap:12px;min-height:28px;align-items:center;border-bottom:0.5px solid var(--border-subtle);font-size:var(--type-callout-size)")}>
                      <span style={css("color:var(--text-secondary)")}>
                        {fr?.k}
                      </span>
                      <span style={css("font-weight:500;text-align:right")}>
                        {fr?.v}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}
          {vm.cv?.isJson ? (
            <>
              {/* @component JsonViewer | states: expanded, collapsed, search */}
              <div data-component="JsonViewer" style={css("max-height:520px;overflow:auto;padding:8px 0;background:var(--surface-code);font-family:var(--font-mono);font-size:var(--type-mono-size);line-height:var(--type-mono-lh)")}>
                {(vm.cv?.lines || []).map((ln: any, i1: number) => (
                  <Fragment key={i1}>
                    <div style={css(`display:flex;align-items:center;padding-left:${ln?.pad ?? ''};padding-right:12px;background:${ln?.bg ?? ''};white-space:pre`)}>
                      {ln?.tog ? (
                        <>
                          <button onClick={ln?.toggle} aria-label="Plegar o desplegar" style={css("width:16px;height:16px;margin-left:-18px;margin-right:2px;display:grid;place-items:center;padding:0;border:0;background:transparent;color:var(--text-tertiary)")}>
                            <svg width="11" height="11">
                              <use href={ln?.chev} />
                            </svg>
                          </button>
                        </>
                      ) : null}
                      <span style={css("color:var(--syn-key)")}>
                        {ln?.key}
                      </span>
                      <span style={css("color:var(--syn-punct)")}>
                        {ln?.colon}
                      </span>
                      <span style={css(`color:${ln?.color ?? ''}`)}>
                        {ln?.val}
                      </span>
                      <span style={css("color:var(--syn-punct)")}>
                        {ln?.tail}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          ) : null}
          {vm.cv?.isText ? (
            <>
              <pre style={css("margin:0;max-height:520px;overflow:auto;padding:12px 16px;background:var(--surface-code);font-family:var(--font-mono);font-size:var(--type-mono-size);line-height:var(--type-mono-lh);color:var(--text-primary)")}>
                {vm.cv?.text}
              </pre>
            </>
          ) : null}
        </div>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
            Historial de comandos
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
            {(vm.cv?.hist || []).map((ch: any, i1: number) => (
              <Fragment key={i1}>
                {/* @component ConsoleItem | states: default, copied */}
                <div data-component="ConsoleItem" data-anim="line" style={css("display:grid;grid-template-columns:70px minmax(0,1fr) auto 60px auto;gap:12px;align-items:center;min-height:36px;padding:0 8px 0 16px;border-bottom:0.5px solid var(--border-subtle)")}>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                    {ch?.t}
                  </span>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-callout-size);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                    {ch?.cmd}
                  </span>
                  <span style={css("display:flex;gap:4px")}>
                    {(ch?.chips || []).map((ec: any, i2: number) => (
                      <Fragment key={i2}>
                        <span style={css(`display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:var(--r-pill);background:${ec?.bg ?? ''};color:${ec?.fg ?? ''};font-size:var(--type-caption-size);font-weight:600`)}>
                          {ec?.label}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                  <span style={css("text-align:right;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                    {ch?.dur}
                  </span>
                  <span style={css("display:flex;gap:2px")}>
                    <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={ch?.rerun} aria-label="Volver a ejecutar" data-tip="Volver a ejecutar" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                      <svg width="13" height="13">
                        <use href="#i-refresh" />
                      </svg>
                    </button>
                    <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={ch?.copy} aria-label="Copiar" data-tip="Copiar" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                      <svg width="13" height="13">
                        <use href={ch?.copyIcon} />
                      </svg>
                    </button>
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
