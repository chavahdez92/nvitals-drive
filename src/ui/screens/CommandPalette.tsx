// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function CommandPalette({ vm }: { vm: VM }) {
  return (
    <>
      <div data-component="CommandPalette" role="dialog" aria-modal="true" aria-label="Paleta de comandos" style={css("position:absolute;top:64px;left:50%;margin-left:-300px;width:600px;z-index:var(--z-palette);border-radius:var(--r-xl);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);overflow:hidden;display:flex;flex-direction:column")}>
        <div style={css("display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-bottom:0.5px solid var(--border-subtle)")}>
          <svg width="16" height="16" style={css("color:var(--text-tertiary)")}>
            <use href="#i-search" />
          </svg>
          <input data-palette-input="" value={vm.pq} onChange={vm.onPq} placeholder="Busca discos y acciones…" aria-label="Buscar" role="combobox" aria-expanded="true" style={css("flex:1;border:0;background:transparent;outline:none;font-size:var(--type-title3-size);color:var(--text-primary)")} />
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);padding:1px 5px;border-radius:4px;border:0.5px solid var(--border-default)")}>
            esc
          </span>
        </div>
        <div role="listbox" style={css("max-height:400px;overflow:auto;padding:6px")}>
          {(vm.pgroups || []).map((pg: any, i1: number) => (
            <Fragment key={i1}>
              <div style={css("display:flex;flex-direction:column")}>
                <div style={css("padding:8px 10px 4px;font-size:var(--type-caption-size);font-weight:var(--type-caption-weight);letter-spacing:var(--type-caption-track);text-transform:uppercase;color:var(--text-tertiary)")}>
                  {pg?.g}
                </div>
                {(pg?.items || []).map((pi: any, i2: number) => (
                  <Fragment key={i2}>
                    {/* @component PaletteItem | states: default, selected */}
                    <div role="option" aria-selected={pi?.sel} onClick={pi?.go} onMouseMove={pi?.hover} style={css(`display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border-radius:var(--r-md);background:${pi?.bg ?? ''};color:${pi?.fg ?? ''}`)}>
                      <svg width="15" height="15" style={css("flex:none")}>
                        <use href={pi?.icon} />
                      </svg>
                      <span style={css("flex:none;font-weight:500")}>
                        {pi?.label}
                      </span>
                      <span style={css(`flex:1;min-width:0;font-size:var(--type-callout-size);color:${pi?.subFg ?? ''};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`)}>
                        {pi?.sub}
                      </span>
                      <span style={css(`font-size:var(--type-note-size);color:${pi?.subFg ?? ''}`)}>
                        {pi?.kbd}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
          {vm.pEmpty ? (
            <>
              <div style={css("padding:24px;text-align:center;color:var(--text-secondary)")}>
                Sin resultados
              </div>
            </>
          ) : null}
        </div>
        <div style={css("display:flex;gap:14px;height:30px;align-items:center;padding:0 14px;border-top:0.5px solid var(--border-subtle);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
          <span>
            ↑↓ navegar
          </span>
          <span>
            ↵ ejecutar
          </span>
          <span>
            esc cerrar
          </span>
        </div>
      </div>
    </>
  );
}
