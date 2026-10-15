// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function ScenarioPanel({ vm }: { vm: VM }) {
  return (
    <>
      <button onClick={vm.toggleScen} aria-label="Escenarios del prototipo" style={css("position:fixed;right:14px;bottom:14px;z-index:var(--z-scenario);display:flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:var(--r-pill);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-2), inset 0 0 0 0.5px var(--border-default);color:var(--text-secondary);font-size:var(--type-note-size);font-weight:600")}>
        <svg width="12" height="12">
          <use href="#i-settings" />
        </svg>
        Escenarios · ⇧D
      </button>
      {vm.scen ? (
        <>
          <aside data-anim="pop" aria-label="Panel de escenarios" style={css("position:fixed;right:14px;bottom:48px;z-index:var(--z-scenario);width:300px;max-height:calc(100vh - 80px);overflow:auto;padding:14px;border-radius:var(--r-xl);background:var(--surface-raised);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);transform-origin:bottom right;display:flex;flex-direction:column;gap:14px")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between")}>
              <strong style={css("font-weight:600")}>
                Escenarios
              </strong>
              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                Solo prototipo
              </span>
            </div>
            <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
              {(vm.scenarios || []).map((sc: any, i1: number) => (
                <Fragment key={i1}>
                  <button onClick={sc?.pick} aria-pressed={sc?.on} style={css(`height:24px;padding:0 9px;border-radius:var(--r-pill);background:${sc?.bg ?? ''};color:${sc?.fg ?? ''};border:1px solid ${sc?.border ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                    {sc?.label}
                  </button>
                </Fragment>
              ))}
            </div>
            <div style={css("display:flex;gap:6px")}>
              <button onClick={vm.connectNext} style={css("flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                <svg width="13" height="13">
                  <use href="#i-plug" />
                </svg>
                Conectar disco
              </button>
              <button onClick={vm.disconnectOne} style={css("flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                <svg width="13" height="13">
                  <use href="#i-eject" />
                </svg>
                Desconectar
              </button>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:8px")}>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  Tema
                </span>
                <div style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                  {(vm.themes || []).map((o: any, i1: number) => (
                    <Fragment key={i1}>
                      <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 8px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                        {o?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  Fondo de escritorio
                </span>
                <div style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                  {(vm.walls || []).map((o: any, i1: number) => (
                    <Fragment key={i1}>
                      <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 8px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                        {o?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                  Velocidad de animación
                </span>
                <div style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                  {(vm.speeds || []).map((o: any, i1: number) => (
                    <Fragment key={i1}>
                      <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 8px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                        {o?.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <label style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                Reducir movimiento
                <button role="switch" aria-checked={vm.swMotion?.on} onClick={vm.toggleMotion} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.swMotion?.track ?? ''}`)}>
                  <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transform:${vm.swMotion?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
                </button>
              </label>
              <label style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                Simular error al exportar reporte
                <button role="switch" aria-checked={vm.swRepFail?.on} onClick={vm.toggleRepFail} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.swRepFail?.track ?? ''}`)}>
                  <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transform:${vm.swRepFail?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
                </button>
              </label>
              <label style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                Reducir transparencia
                <button role="switch" aria-checked={vm.swTransp?.on} onClick={vm.toggleTransp} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.swTransp?.track ?? ''}`)}>
                  <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transform:${vm.swTransp?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
                </button>
              </label>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
