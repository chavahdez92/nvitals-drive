// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function Toolbar({ vm }: { vm: VM }) {
  return (
    <>
      <header data-component="Toolbar" data-state={vm.toolbarState} style={css("height:44px;flex:none;display:flex;align-items:center;gap:10px;padding:0 10px 0 14px;position:relative;z-index:var(--z-sticky);background:var(--surface-content)")}>
        {vm.showBack ? (
          <>
            <button className={cx(pc("hover", "background:var(--surface-hover);color:var(--text-primary)"), pc("active", "transform:scale(0.97)"))} onClick={vm.goBack} aria-label="Volver a Dispositivos" data-tip="Volver" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);transition:transform var(--dur-press) var(--ease-out)")}>
              <svg width="16" height="16">
                <use href="#i-chevron-left" />
              </svg>
            </button>
          </>
        ) : null}
        <div style={css("display:flex;align-items:center;gap:6px;min-width:0;flex:1")}>
          {(vm.crumbs || []).map((b: any, i1: number) => (
            <Fragment key={i1}>
              <span style={css("display:flex;align-items:center;gap:6px;min-width:0")}>
                {b?.sep ? (
                  <>
                    <svg width="12" height="12" style={css("color:var(--text-tertiary);flex:none")}>
                      <use href="#i-chevron-right" />
                    </svg>
                  </>
                ) : null}
                <button onClick={b?.go} style={css(`border:0;background:transparent;padding:2px 4px;border-radius:var(--r-sm);font-size:var(--type-title3-size);font-weight:${b?.weight ?? ''};letter-spacing:var(--type-title3-track);color:${b?.color ?? ''};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
                  {b?.label}
                </button>
              </span>
            </Fragment>
          ))}
        </div>
        <button className={cx(pc("hover", "background:var(--surface-hover);color:var(--text-primary)"), pc("active", "transform:scale(0.97)"))} onClick={vm.rescan} aria-label="Re-escanear" data-tip="Re-escanear  ⌘R" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-md);background:transparent;color:var(--text-secondary);transition:transform var(--dur-press) var(--ease-out)")}>
          <svg data-refresh-icon="" width="16" height="16">
            <use href="#i-refresh" />
          </svg>
        </button>
        <button className={cx(pc("hover", "background:var(--surface-hover);color:var(--text-primary)"), pc("active", "transform:scale(0.97)"))} onClick={vm.toggleConsole} aria-label="Consola" aria-pressed={vm.consolePressed} data-tip="Consola  ⌘J" style={css(`width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-md);background:${vm.consoleBtnBg ?? ''};color:var(--text-secondary);transition:transform var(--dur-press) var(--ease-out)`)}>
          <svg width="16" height="16">
            <use href="#i-terminal" />
          </svg>
        </button>
        <button className={cx(pc("hover", "border-color:var(--border-strong)"))} onClick={vm.openPalette} aria-label="Paleta de comandos" style={css("display:flex;align-items:center;gap:8px;height:28px;width:220px;padding:0 8px 0 10px;border:0.5px solid var(--border-default);border-radius:var(--r-md);background:var(--surface-sunken);color:var(--text-tertiary);font-size:var(--type-body-size)")}>
          <svg width="14" height="14">
            <use href="#i-search" />
          </svg>
          <span style={css("flex:1;text-align:left")}>
            Buscar o ejecutar…
          </span>
          <span style={css("font-size:var(--type-note-size);padding:1px 5px;border-radius:4px;border:0.5px solid var(--border-default)")}>
            ⌘K
          </span>
        </button>
        <div aria-hidden="true" style={css(`position:absolute;left:0;right:0;top:100%;height:14px;pointer-events:none;background:linear-gradient(var(--surface-content), var(--mat-edge-fade));opacity:${vm.edgeOpacity ?? ''};transition:opacity var(--dur-fast) var(--ease-out)`)} />
      </header>
    </>
  );
}
