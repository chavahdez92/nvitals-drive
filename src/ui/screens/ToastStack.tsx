// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ToastStack({ vm }: { vm: VM }) {
  return (
    <>
      <div aria-live="polite" style={css("position:absolute;top:54px;right:14px;z-index:var(--z-toast);display:flex;flex-direction:column;gap:8px;width:320px;pointer-events:none")}>
        {(vm.toasts || []).map((to: any, i1: number) => (
          <Fragment key={i1}>
            <div data-component="Toast" data-toast-id={to?.id} data-anim="toast" role="status" onMouseEnter={to?.enter} onMouseLeave={to?.leave} onPointerDown={to?.down} style={css("pointer-events:auto;display:flex;gap:10px;align-items:flex-start;padding:12px 10px 12px 14px;border-radius:var(--r-lg);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);touch-action:pan-y;user-select:none")}>
              <svg width="16" height="16" style={css("flex:none;margin-top:1px;color:var(--accent-fg)")}>
                <use href={to?.icon} />
              </svg>
              <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                <strong style={css("font-weight:600")}>
                  {to?.title}
                </strong>
                {to?.hasBody ? (
                  <>
                    <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                      {to?.body}
                    </span>
                  </>
                ) : null}
              </div>
              <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={to?.close} aria-label="Descartar" style={css("width:20px;height:20px;display:grid;place-items:center;border:0;border-radius:var(--r-xs);background:transparent;color:var(--text-tertiary)")}>
                <svg width="12" height="12">
                  <use href="#i-x" />
                </svg>
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
