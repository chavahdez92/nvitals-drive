// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function OnboardingScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Verificación del entorno" data-anim="rise" style={css("min-height:100%;display:grid;place-items:center;padding:40px 24px")}>
        <div style={css("width:min(560px,100%);display:flex;flex-direction:column;gap:28px")}>
          <div style={css("display:flex;flex-direction:column;gap:12px;align-items:flex-start")}>
            <img src="assets/app-icon.svg" width="64" height="64" alt="" style={css("display:block")} />
            <h1 style={css("margin:0;font-family:var(--font-display);font-size:var(--type-title1-size);line-height:var(--type-title1-lh);font-weight:var(--type-title1-weight);letter-spacing:var(--type-title1-track)")}>
              Verificando el entorno
            </h1>
            <p style={css("margin:0;color:var(--text-secondary);text-wrap:pretty")}>
              NVitals Drive usa smartctl para leer los datos de salud de tus discos. Comprobamos que todo esté listo.
            </p>
          </div>
          {/* @component Checklist | variants: stepper | states: pending, active, done, warning, error */}
          <ol data-component="Checklist" aria-live="polite" style={css("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px")}>
            {(vm.onbSteps || []).map((st: any, i1: number) => (
              <Fragment key={i1}>
                <li data-state={st?.state} style={css("display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:var(--r-md)")}>
                  <span style={css("width:20px;height:20px;flex:none;display:grid;place-items:center;margin-top:-1px")}>
                    {st?.isDone ? (
                      <>
                        <svg data-anim="pop" width="20" height="20" style={css("color:var(--health-optimal-solid)")}>
                          <use href="#i-check-circle" />
                        </svg>
                      </>
                    ) : null}
                    {st?.isActive ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 16 16" style={css("animation:hdi-spin 0.9s linear infinite")}>
                          <circle cx="8" cy="8" r="6.5" fill="none" style={css("stroke:var(--ring-track);stroke-width:2")} />
                          <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" style={css("stroke:var(--accent);stroke-width:2;stroke-linecap:round")} />
                        </svg>
                      </>
                    ) : null}
                    {st?.isFail ? (
                      <>
                        <svg data-anim="pop" width="20" height="20" style={css("color:var(--health-critical-solid)")}>
                          <use href="#i-octagon" />
                        </svg>
                      </>
                    ) : null}
                    {st?.isWarn ? (
                      <>
                        <svg data-anim="pop" width="20" height="20" style={css("color:var(--health-warning-solid)")}>
                          <use href="#i-alert" />
                        </svg>
                      </>
                    ) : null}
                    {st?.isPending ? (
                      <>
                        <span style={css("width:14px;height:14px;border-radius:50%;border:1.5px solid var(--border-strong)")} />
                      </>
                    ) : null}
                  </span>
                  <span style={css("display:flex;flex-direction:column;gap:2px;min-width:0")}>
                    <span style={css(`font-weight:500;color:${st?.color ?? ''};transition:color var(--dur-fast) var(--ease-out)`)}>
                      {st?.label}
                    </span>
                    <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                      {st?.sub}
                    </span>
                  </span>
                </li>
              </Fragment>
            ))}
          </ol>
          {vm.onbFail ? (
            <>
              <div data-anim="rise" role="alert" style={css("display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:var(--r-xl);background:var(--surface-raised);box-shadow:var(--shadow-2);border:0.5px solid var(--border-subtle)")}>
                <div style={css("display:flex;flex-direction:column;gap:4px")}>
                  <div style={css("font-size:var(--type-title3-size);font-weight:600")}>
                    Instala smartmontools para continuar
                  </div>
                  <div style={css("color:var(--text-secondary);text-wrap:pretty")}>
                    smartctl es la herramienta de línea de comandos que lee SMART. Instálala con Homebrew y vuelve a verificar.
                  </div>
                </div>
                {/* @component CommandBlock | states: default, copied */}
                <div data-component="CommandBlock" style={css("display:flex;align-items:center;gap:8px;padding:10px 10px 10px 14px;border-radius:var(--r-md);background:var(--surface-code);border:0.5px solid var(--border-subtle);font-family:var(--font-mono);font-size:var(--type-mono-size)")}>
                  <span style={css("color:var(--text-tertiary)")}>
                    $
                  </span>
                  <span style={css("flex:1")}>
                    brew install smartmontools
                  </span>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.copyBrew} aria-label="Copiar comando" data-tip="Copiar" style={css("width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                    <svg width="14" height="14">
                      <use href={vm.brewIcon} />
                    </svg>
                  </button>
                </div>
                <div style={css("display:flex;gap:8px;align-items:center")}>
                  <button className={cx(pc("hover", "background:var(--accent-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.recheck} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;transition:transform var(--dur-press) var(--ease-out)")}>
                    <svg width="14" height="14">
                      <use href="#i-refresh" />
                    </svg>
                    Volver a verificar
                  </button>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.toggleOnbHelp} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:transparent;color:var(--accent-fg);font-weight:500")}>
                    ¿No tienes Homebrew?
                  </button>
                </div>
                {vm.onbHelp ? (
                  <>
                    <div data-anim="fade" style={css("display:flex;flex-direction:column;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                      <span>
                        Homebrew es el gestor de paquetes más usado en macOS. Instálalo desde la Terminal:
                      </span>
                      <div style={css("display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border-radius:var(--r-md);background:var(--surface-code);font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-primary)")}>
                        <span style={css("flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>
                          /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                        </span>
                        <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.copyHb} aria-label="Copiar" style={css("width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                          <svg width="13" height="13">
                            <use href={vm.hbIcon} />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
          {vm.onbOld ? (
            <>
              <div data-anim="rise" role="alert" style={css("display:flex;gap:12px;padding:14px 16px;border-radius:var(--r-lg);background:var(--health-warning-bg);border:0.5px solid var(--health-warning-border)")}>
                <svg width="18" height="18" style={css("flex:none;color:var(--health-warning-fg);margin-top:1px")}>
                  <use href="#i-alert" />
                </svg>
                <div style={css("display:flex;flex-direction:column;gap:10px")}>
                  <div style={css("display:flex;flex-direction:column;gap:2px")}>
                    <strong style={css("font-weight:600;color:var(--health-warning-fg)")}>
                      Versión antigua de smartctl
                    </strong>
                    <span style={css("color:var(--text-primary);text-wrap:pretty")}>
                      {"Se recomienda la versión 7.4 o posterior: la 7.2 no entrega algunos campos NVMe en JSON. Actualiza con "}
                      <code style={css("font-family:var(--font-mono)")}>
                        brew upgrade smartmontools
                      </code>
                      .
                    </span>
                  </div>
                  <div style={css("display:flex;gap:8px")}>
                    <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.continueOld} style={css("height:28px;padding:0 12px;border:0.5px solid var(--border-default);border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1);font-weight:500")}>
                      Continuar de todos modos
                    </button>
                    <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.recheck} style={css("height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:transparent;color:var(--accent-fg);font-weight:500")}>
                      Volver a verificar
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {vm.onbDone ? (
            <>
              <div data-anim="rise" style={css("display:flex;align-items:center;justify-content:space-between;gap:12px")}>
                <span style={css("color:var(--text-secondary)")}>
                  Todo listo. Abriendo Dispositivos…
                </span>
                <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.finishOnb} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                  Continuar
                </button>
              </div>
            </>
          ) : null}
          <div style={css("display:flex;flex-direction:column;gap:10px;padding-top:18px;border-top:0.5px solid var(--border-subtle)")}>
            <div style={css("font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
              ¿Qué gabinetes funcionan?
            </div>
            <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
              <div style={css("display:flex;gap:10px;padding:12px;border-radius:var(--r-lg);background:var(--surface-sunken)")}>
                <svg width="18" height="18" style={css("flex:none;color:var(--health-optimal-fg)")}>
                  <use href="#i-check-circle" />
                </svg>
                <div style={css("display:flex;flex-direction:column;gap:2px")}>
                  <strong style={css("font-weight:600")}>
                    Thunderbolt / USB4
                  </strong>
                  <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                    Túnel PCIe: datos SMART completos y enlace visible.
                  </span>
                </div>
              </div>
              <div style={css("display:flex;gap:10px;padding:12px;border-radius:var(--r-lg);background:var(--surface-sunken)")}>
                <svg width="18" height="18" style={css("flex:none;color:var(--health-critical-fg)")}>
                  <use href="#i-x" />
                </svg>
                <div style={css("display:flex;flex-direction:column;gap:2px")}>
                  <strong style={css("font-weight:600")}>
                    USB 3.x
                  </strong>
                  <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                    macOS no permite leer SMART a través de puentes USB.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
