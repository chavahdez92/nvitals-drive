// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ContextMenu({ vm }: { vm: VM }) {
  return (
    <>
      <div data-popover="" data-component="ContextMenu" role="menu" data-anim="pop" style={css(`position:fixed;left:${vm.ctx?.x ?? ''};top:${vm.ctx?.y ?? ''};min-width:200px;padding:5px;border-radius:var(--r-lg);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);transform-origin:top left;z-index:var(--z-popover)`)}>
        <div style={css("padding:4px 10px 6px;font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap")}>
          {vm.ctx?.title}
        </div>
        {(vm.ctx?.items || []).map((m: any, i1: number) => (
          <Fragment key={i1}>
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} role="menuitem" onClick={m?.run} style={css(`width:100%;display:flex;align-items:center;gap:8px;height:28px;padding:0 10px;border:0;border-radius:var(--r-sm);background:transparent;color:${m?.fg ?? ''};text-align:left`)}>
              <svg width="14" height="14">
                <use href={m?.icon} />
              </svg>
              {m?.label}
            </button>
          </Fragment>
        ))}
      </div>
    </>
  );
}
