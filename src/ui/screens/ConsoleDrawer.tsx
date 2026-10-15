// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ConsoleDrawer({ vm }: { vm: VM }) {
  return (
    <>
      <div data-console-drawer="" data-component="ConsoleDrawer" role="region" aria-label="Consola global" style={css(`flex:none;height:${vm.consoleH ?? ''};display:flex;flex-direction:column;background:var(--surface-sunken);box-shadow:0 -0.5px 0 var(--border-default);position:relative;z-index:var(--z-drawer)`)}>
        <div onPointerDown={vm.consoleDrag} aria-hidden="true" style={css("position:absolute;top:-4px;left:0;right:0;height:8px;cursor:ns-resize")} />
        <div style={css("display:flex;align-items:center;gap:8px;height:34px;padding:0 8px 0 14px;flex:none")}>
          <svg width="14" height="14" style={css("color:var(--text-secondary)")}>
            <use href="#i-terminal" />
          </svg>
          <strong style={css("font-weight:600;font-size:var(--type-callout-size)")}>
            Consola
          </strong>
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
            Comandos ejecutados en esta sesión
          </span>
          <span style={css("flex:1")} />
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
            ⌘J
          </span>
          <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.closeConsole} aria-label="Cerrar consola" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
            <svg width="13" height="13">
              <use href="#i-chevron-down" />
            </svg>
          </button>
        </div>
        <div aria-live="polite" style={css("flex:1;min-height:0;overflow:auto;padding:0 0 8px;font-family:var(--font-mono);font-size:var(--type-callout-size)")}>
          {(vm.logRows || []).map((lg: any, i1: number) => (
            <Fragment key={i1}>
              <div data-anim="line" style={css("display:grid;grid-template-columns:70px minmax(0,1fr) auto 60px;gap:12px;align-items:center;min-height:24px;padding:0 14px")}>
                <span style={css("color:var(--text-tertiary);font-size:var(--type-note-size)")}>
                  {lg?.t}
                </span>
                <span style={css("white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                  <span style={css("color:var(--accent-fg)")}>
                    {"$ "}
                  </span>
                  {lg?.cmd}
                </span>
                <span style={css("display:flex;gap:4px")}>
                  {(lg?.chips || []).map((ec: any, i2: number) => (
                    <Fragment key={i2}>
                      <span style={css(`display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:var(--r-pill);background:${ec?.bg ?? ''};color:${ec?.fg ?? ''};font-family:var(--font-sans);font-size:var(--type-caption-size);font-weight:600`)}>
                        {ec?.label}
                      </span>
                    </Fragment>
                  ))}
                </span>
                <span style={css("text-align:right;color:var(--text-tertiary);font-size:var(--type-note-size)")}>
                  {lg?.dur}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
