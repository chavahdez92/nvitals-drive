// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function SettingsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Ajustes" data-anim="fade" style={css("padding:16px 24px 40px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:22px")}>
        {/* @component SettingsGroup | states: default */}
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            General
          </h2>
          <div data-component="SettingsGroup" style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Tema
              </span>
              <div role="group" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                {(vm.sThemes || []).map((o: any, i1: number) => (
                  <Fragment key={i1}>
                    <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                      {o?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span style={css("display:flex;flex-direction:column")}>
                <span>
                  Movimiento
                </span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  «Reducido» usa fundidos de 150 ms en lugar de desplazamientos
                </span>
              </span>
              <div role="group" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                {(vm.sMotion || []).map((o: any, i1: number) => (
                  <Fragment key={i1}>
                    <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                      {o?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Unidades de temperatura
              </span>
              <div role="group" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                {(vm.sUnits || []).map((o: any, i1: number) => (
                  <Fragment key={i1}>
                    <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                      {o?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span>
                Ocultar el disco interno
              </span>
              <button role="switch" aria-checked={vm.swHideInt?.on} onClick={vm.toggleHideInt} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.swHideInt?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.swHideInt?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            smartctl
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Ruta detectada
              </span>
              <span style={css("font-family:var(--font-mono);font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                /opt/homebrew/bin/smartctl
              </span>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span>
                Versión
              </span>
              <span style={css("display:flex;align-items:center;gap:10px")}>
                <span style={css("color:var(--text-secondary)")}>
                  smartmontools 7.5 · salida JSON
                </span>
                <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.redetect} disabled={vm.detecting} style={css("display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                  <svg width="13" height="13">
                    <use href="#i-refresh" />
                  </svg>
                  Volver a detectar
                </button>
              </span>
            </div>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Monitoreo
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Intervalo de lectura de temperatura
              </span>
              <div role="group" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                {(vm.sInts || []).map((o: any, i1: number) => (
                  <Fragment key={i1}>
                    <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                      {o?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Notificar al conectar un disco
              </span>
              <button role="switch" aria-checked={vm.sw_notifConnect?.on} onClick={vm.tg_notifConnect} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_notifConnect?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_notifConnect?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Notificar al terminar una prueba
              </span>
              <button role="switch" aria-checked={vm.sw_notifTest?.on} onClick={vm.tg_notifTest} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_notifTest?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_notifTest?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span>
                Notificar al detectar un estado crítico
              </span>
              <button role="switch" aria-checked={vm.sw_notifCrit?.on} onClick={vm.tg_notifCrit} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_notifCrit?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_notifCrit?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Reportes
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Nombre del técnico
              </span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.sTech} onChange={vm.onTech} style={css("width:240px;height:26px;padding:0 8px;border:0;border-radius:var(--r-sm);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;text-align:right")} />
            </label>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Empresa
              </span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.sCompany} onChange={vm.onCompany} style={css("width:240px;height:26px;padding:0 8px;border:0;border-radius:var(--r-sm);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;text-align:right")} />
            </label>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span style={css("display:flex;flex-direction:column")}>
                <span>
                  Logo
                </span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  PNG o SVG · se muestra en el encabezado del reporte
                </span>
              </span>
              <span style={css("display:flex;align-items:center;gap:10px")}>
                <img src="assets/app-icon.svg" width="28" height="28" alt="" />
                <button style={css("height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                  Elegir…
                </button>
              </span>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Papel
              </span>
              <div role="group" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                {(vm.sPapers || []).map((o: any, i1: number) => (
                  <Fragment key={i1}>
                    <button onClick={o?.pick} aria-pressed={o?.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o?.bg ?? ''};box-shadow:${o?.shadow ?? ''};color:${o?.fg ?? ''};font-size:var(--type-callout-size);font-weight:500`)}>
                      {o?.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span>
                Enmascarar el número de serie por defecto
              </span>
              <button role="switch" aria-checked={vm.sw_maskDefault?.on} onClick={vm.tg_maskDefault} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_maskDefault?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_maskDefault?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Pruebas
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Mantener la Mac despierta durante las pruebas
              </span>
              <button role="switch" aria-checked={vm.sw_keepAwake?.on} onClick={vm.tg_keepAwake} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_keepAwake?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_keepAwake?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
            <label style={css(`display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:${vm.authRow ? "0.5px solid var(--border-subtle)" : "0"}`)}>
              <span>
                Sonido al terminar
              </span>
              <button role="switch" aria-checked={vm.sw_sound?.on} onClick={vm.tg_sound} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.sw_sound?.track ?? ''}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.sw_sound?.knob ?? ''};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
            {vm.authRow ? (
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:8px 14px")}>
                <span style={css("display:flex;flex-direction:column;gap:2px;min-width:0")}>
                  <span>
                    Autorización para escanear
                  </span>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);text-wrap:pretty")}>
                    {vm.authRow.help}
                  </span>
                </span>
                {vm.authRow.on ? (
                  <span style={css("flex:none;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px 0 7px;border-radius:var(--r-pill);background:var(--health-optimal-bg);color:var(--health-optimal-fg);font-size:var(--type-note-size);font-weight:600")}>
                    <svg width="12" height="12">
                      <use href="#i-check-circle" />
                    </svg>
                    Touch ID activado
                  </span>
                ) : (
                  <button onClick={vm.authRow.copy} style={css("flex:none;display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                    <svg width="13" height="13">
                      <use href={vm.authRow.copyIcon} />
                    </svg>
                    Copiar comando
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {vm.invSettings ? (
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Expedientes
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:8px 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span style={css("display:flex;flex-direction:column;gap:2px;min-width:0")}>
                <span>Carpeta de expedientes</span>
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary);word-break:break-all")}>{vm.invSettings.root || "…"}</span>
              </span>
              <button onClick={vm.invSettings.pick} style={css("flex:none;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cambiar…
              </button>
            </div>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span style={css("display:flex;flex-direction:column")}>
                <span>Guardar el reporte rápido en PDF al agregar</span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>Una hoja por revisión, en la carpeta con el número de serie</span>
              </span>
              <button role="switch" aria-checked={vm.invSettings.swPdf.on} onClick={vm.invSettings.tgPdf} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.invSettings.swPdf.track}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.invSettings.swPdf.knob};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
            <label style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span style={css("display:flex;flex-direction:column")}>
                <span>Guardar el JSON de smartctl</span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>La salida cruda completa, para consultarla o reprocesarla después</span>
              </span>
              <button role="switch" aria-checked={vm.invSettings.swJson.on} onClick={vm.invSettings.tgJson} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${vm.invSettings.swJson.track}`)}>
                <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${vm.invSettings.swJson.knob};transition:transform var(--dur-base) var(--ease-out)`)} />
              </button>
            </label>
          </div>
        </div>
        ) : null}
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Umbrales avanzados
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            {(vm.th || []).map((t: any, i1: number) => (
              <Fragment key={i1}>
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
                  <span style={css("display:flex;flex-direction:column")}>
                    <span>
                      {t?.label}
                    </span>
                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                      {t?.help}
                    </span>
                  </span>
                  {/* @component Stepper | states: default, min */}
                  <span data-component="Stepper" style={css("display:flex;align-items:center;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default)")}>
                    <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={t?.dec} aria-label="Disminuir" style={css("width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--text-secondary);font-weight:600")}>
                      −
                    </button>
                    <span style={css("min-width:56px;text-align:center;font-weight:600")}>
                      {t?.val}
                    </span>
                    <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={t?.inc} aria-label="Aumentar" style={css("width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--text-secondary);font-weight:600")}>
                      +
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:6px")}>
          <h2 style={css("margin:0 0 2px 4px;font-size:var(--type-callout-size);font-weight:600;color:var(--text-secondary)")}>
            Datos
          </h2>
          <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border-bottom:0.5px solid var(--border-subtle)")}>
              <span>
                Exportar historial
              </span>
              <button onClick={vm.exportHistory} style={css("display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                <svg width="13" height="13">
                  <use href="#i-download" />
                </svg>
                Exportar JSON
              </button>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px")}>
              <span style={css("display:flex;flex-direction:column")}>
                <span>
                  Borrar historial
                </span>
                <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  Elimina todas las instantáneas guardadas. Los reportes no se borran.
                </span>
              </span>
              <button onClick={vm.askDelHist} style={css("height:26px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--health-critical-bg);box-shadow:inset 0 0 0 0.5px var(--health-critical-border);color:var(--health-critical-fg);font-weight:600")}>
                Borrar…
              </button>
            </div>
          </div>
        </div>
        <div style={css("display:flex;align-items:center;gap:14px;padding:16px;border-radius:var(--r-lg);background:var(--surface-sunken)")}>
          <img src="assets/app-icon.svg" width="56" height="56" alt="" />
          <div style={css("display:flex;flex-direction:column;gap:2px")}>
            <strong style={css("font-weight:600")}>
              NVitals Drive
            </strong>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              {"Versión "}
              {vm.appVersion}
              {" · smartmontools 7.5 · macOS 27 (Apple Silicon)"}
            </span>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
              Lee datos SMART en modo solo lectura. Nunca escribe en tus discos.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
