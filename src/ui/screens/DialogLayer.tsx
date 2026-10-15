// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';
import { SpeedPathPanel } from './SpeedPathPanel';

export function DialogLayer({ vm }: { vm: VM }) {
  return (
    <>
      {vm.hasOverlay ? (
        <>
          <div data-anim="fade" onClick={vm.closeDialog} aria-hidden="true" style={css("position:absolute;inset:0;z-index:var(--z-dialog);background:var(--surface-overlay)")} />
        </>
      ) : null}
      {vm.hasSheet ? (
        <>
          {/* @component Sheet | states: default */}
          <div data-component="Sheet" data-anim="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" style={css("position:absolute;top:0;left:50%;margin-left:-240px;width:480px;z-index:var(--z-dialog);padding:22px 22px 18px;border-radius:0 0 var(--r-xl) var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:14px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="28" height="28" style={css("flex:none;color:var(--accent-fg)")}>
                <use href="#i-scan" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:4px")}>
                <strong id="sheet-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                  {vm.dlg?.title}
                </strong>
                <span style={css("color:var(--text-secondary)")}>
                  {vm.dlg?.model}
                </span>
              </div>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:8px")}>
              <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--text-secondary)")}>
                  <use href="#i-clock" />
                </svg>
                <span>
                  <strong style={css("font-weight:600")}>
                    Duración estimada:
                  </strong>
                  {" "}
                  {vm.dlg?.dur}
                  .
                </span>
              </div>
              <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--health-optimal-fg)")}>
                  <use href="#i-shield-check" />
                </svg>
                <span>
                  <strong style={css("font-weight:600")}>
                    Solo lectura.
                  </strong>
                  {" NVitals Drive nunca escribe en tu disco."}
                </span>
              </div>
              <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--text-secondary)")}>
                  <use href="#i-lock" />
                </svg>
                <span>
                  {vm.authText ?? "macOS te pedirá tu contraseña de administrador para leer el dispositivo sin procesar."}
                </span>
              </div>
              <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--text-secondary)")}>
                  <use href="#i-power" />
                </svg>
                <span>
                  Tu Mac se mantendrá despierta durante la prueba. Se tomará una instantánea SMART antes y otra después.
                </span>
              </div>
            </div>
            <div style={css("display:flex;justify-content:flex-end;gap:8px;padding-top:4px")}>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cancelar
              </button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.startScan} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                Continuar
              </button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasBench ? (
        <>
          {/* Benchmark con fio: misma hoja (Sheet) del escaneo, con selección de volumen y tamaño. */}
          <div data-component="Sheet" data-anim="sheet" role="dialog" aria-modal="true" aria-labelledby="bench-title" style={css("position:absolute;top:0;left:50%;margin-left:-300px;width:600px;z-index:var(--z-dialog);padding:22px 22px 18px;border-radius:0 0 var(--r-xl) var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:14px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="28" height="28" style={css("flex:none;color:var(--accent-fg)")}>
                <use href="#i-bolt" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:4px")}>
                <strong id="bench-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                  ¿Iniciar benchmark de lectura/escritura?
                </strong>
                <span style={css("color:var(--text-secondary)")}>
                  {vm.bd?.model}
                </span>
              </div>
            </div>
            {vm.bd?.loading ? (
              <span style={css("color:var(--text-secondary)")}>Buscando volúmenes del disco…</span>
            ) : null}
            {vm.bd?.error ? (
              <span style={css("color:var(--health-critical-fg)")}>{vm.bd.error}</span>
            ) : null}
            {vm.bd?.noFio ? (
              <div style={css("display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface-sunken)")}>
                <span>
                  <strong style={css("font-weight:600")}>fio no está instalado.</strong>
                  {" Es la herramienta de código abierto que mide la velocidad (la misma que usa KDiskMark). Instálala con Homebrew y vuelve a intentarlo:"}
                </span>
                <span style={css("display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:var(--type-callout-size)")}>
                  brew install fio
                  <button onClick={vm.bd.copy} aria-label="Copiar comando" style={css("display:grid;place-items:center;width:22px;height:22px;padding:0;border:0;border-radius:var(--r-xs);background:transparent;color:var(--text-secondary)")}>
                    <svg width="13" height="13">
                      <use href={vm.bd.copyIcon} />
                    </svg>
                  </button>
                </span>
              </div>
            ) : null}
            {vm.bd?.noVolumes ? (
              <div style={css("display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:var(--r-md);background:var(--health-warning-bg);box-shadow:inset 0 0 0 0.5px var(--health-warning-border)")}>
                <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--health-warning-fg)")}>
                  <use href="#i-alert" />
                </svg>
                <span style={css("text-wrap:pretty")}>
                  Este disco no tiene un volumen montado con escritura. El benchmark necesita uno (APFS, exFAT o HFS+) para crear su archivo temporal; los volúmenes NTFS se montan como solo lectura en macOS.
                </span>
              </div>
            ) : null}
            {vm.bd?.ready ? (
              <div style={css("display:flex;flex-direction:column;gap:10px")}>
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                  <span>Volumen</span>
                  <select data-component="Select" value={vm.bd.volume} onChange={vm.bd.onVolume} style={css("height:28px;max-width:360px;padding:0 8px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);color:var(--text-primary);font-size:var(--type-body-size)")}>
                    {vm.bd.volumes.map((o: any) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                  <span>Tamaño del archivo de prueba</span>
                  <div role="group" aria-label="Tamaño" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
                    {vm.bd.sizes.map((o: any, i1: number) => (
                      <button key={i1} onClick={o.pick} aria-pressed={o.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o.bg};box-shadow:${o.shadow};color:${o.fg};font-size:var(--type-callout-size);font-weight:500`)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                  <span style={css("display:flex;flex-direction:column")}>
                    Velocidad nominal del SSD
                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>Opcional · la de la ficha del fabricante, en MB/s</span>
                  </span>
                  <span style={css("display:flex;gap:8px")}>
                    <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} data-component="TextField" inputMode="numeric" placeholder="Lectura" aria-label="Lectura nominal en MB/s" value={vm.bd.ratedRead} onChange={vm.bd.onRatedRead} style={css("width:96px;height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size)")} />
                    <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} data-component="TextField" inputMode="numeric" placeholder="Escritura" aria-label="Escritura nominal en MB/s" value={vm.bd.ratedWrite} onChange={vm.bd.onRatedWrite} style={css("width:96px;height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size)")} />
                  </span>
                </div>
                <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                  <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--health-warning-fg)")}>
                    <use href="#i-info" />
                  </svg>
                  <span style={css("text-wrap:pretty")}>
                    <strong style={css("font-weight:600")}>Escribe un archivo temporal.</strong>
                    {" " + vm.bd.fio + " crea un archivo de " + vm.bd.sizeText + " en " + vm.bd.where + " y lo borra al terminar o al cancelar. No toca tus archivos ni el resto del disco."}
                  </span>
                </div>
                <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                  <svg width="14" height="14" style={css("flex:none;margin-top:2px;color:var(--text-secondary)")}>
                    <use href="#i-clock" />
                  </svg>
                  <span>
                    <strong style={css("font-weight:600")}>Duración estimada:</strong>
                    {" ~1 min (8 pruebas de 5 s). No requiere contraseña."}
                  </span>
                </div>
              </div>
            ) : null}
            {vm.bd?.path ? (
              <div style={css("display:flex;flex-direction:column;gap:6px;padding-top:10px;border-top:0.5px solid var(--border-subtle)")}>
                <span style={css("font-size:var(--type-callout-size);font-weight:600")}>Velocidad máxima posible con esta conexión</span>
                <SpeedPathPanel sp={vm.bd.path} compact />
              </div>
            ) : null}
            <div style={css("display:flex;justify-content:flex-end;gap:8px;padding-top:4px")}>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cancelar
              </button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.bd?.start} disabled={vm.bd?.startOpacity !== 1} style={css(`height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;opacity:${vm.bd?.startOpacity ?? 1}`)}>
                Iniciar benchmark
              </button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasInvSheet ? (
        <>
          {/* Expediente: misma hoja (Sheet) del escaneo y el benchmark. Enter guarda, Esc cierra. */}
          <form data-component="Sheet" data-anim="sheet" role="dialog" aria-modal="true" aria-labelledby="inv-title" onSubmit={vm.invSheet.submit} style={css("position:absolute;top:0;left:50%;margin-left:-270px;width:540px;z-index:var(--z-dialog);padding:22px 22px 18px;border-radius:0 0 var(--r-xl) var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:14px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="28" height="28" style={css("flex:none;color:var(--accent-fg)")}>
                <use href="#i-folder" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:4px;min-width:0")}>
                <strong id="inv-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>{vm.invSheet.title}</strong>
                <span style={css("color:var(--text-secondary)")}>{vm.invSheet.model}</span>
                {vm.invSheet.batch ? <span style={css("font-size:var(--type-note-size);color:var(--accent-fg);font-weight:600")}>{vm.invSheet.batch}</span> : null}
              </div>
            </div>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Número de serie{vm.invSheet.manual ? " · escríbelo desde la etiqueta del disco" : ""}</span>
              <input autoFocus={vm.invSheet.manual} readOnly={!vm.invSheet.manual} value={vm.invSheet.serial} onChange={vm.invSheet.onSerial} aria-label="Número de serie" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0;font-family:var(--font-mono);font-weight:600" + (vm.invSheet.manual ? "" : ";background:var(--surface-sunken);color:var(--text-secondary)"))} />
            </label>
            {vm.invSheet.nodata ? (
              <span style={css("font-size:var(--type-note-size);color:var(--health-warning-fg);text-wrap:pretty")}>Este disco no entrega SMART por su conexión: el expediente guardará su identidad y conexión, sin datos de salud.</span>
            ) : null}
            {vm.invSheet.exists ? <span style={css("font-size:var(--type-note-size);color:var(--text-secondary)")}>{vm.invSheet.checksTxt}</span> : null}
            <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px")}>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Estado</span>
                  <select data-component="Select" value={vm.invSheet.f.status} onChange={vm.invSheet.set("status")} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")}>
                    {vm.invSheet.statusOpts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Lote</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.lot} onChange={vm.invSheet.set("lot")} placeholder="p. ej. Lote 20 × 2 TB" autoFocus={!vm.invSheet.manual && !vm.invSheet.f.lot} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Proveedor</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.supplier} onChange={vm.invSheet.set("supplier")} placeholder="" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Destino o cliente</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.destination} onChange={vm.invSheet.set("destination")} placeholder="Equipo o comprador" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Costo (MXN)</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.cost} onChange={vm.invSheet.set("cost")} placeholder="0.00" inputMode="decimal" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Precio de venta (MXN)</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.price} onChange={vm.invSheet.set("price")} placeholder="0.00" inputMode="decimal" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px;grid-column:1 / -1")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Notas</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.invSheet.f.notes} onChange={vm.invSheet.set("notes")} placeholder="Estado físico, observaciones…" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
            </div>
            <div style={css("display:flex;gap:8px;align-items:flex-start;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              <svg width="14" height="14" style={css("flex:none;margin-top:2px")}>
                <use href="#i-info" />
              </svg>
              <span style={css("text-wrap:pretty;word-break:break-word")}>
                {"Se guardará la lectura completa del disco"}{vm.invSheet.files ? " y su " + vm.invSheet.files + " en " : " "}<span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>{vm.invSheet.files ? vm.invSheet.where : ""}</span>
              </span>
            </div>
            {vm.invSheet.error ? <span role="alert" style={css("color:var(--health-critical-fg)")}>{vm.invSheet.error}</span> : null}
            <div style={css("display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-top:4px")}>
              <span style={css("flex:1;font-size:var(--type-note-size);color:var(--text-tertiary)")}>Enter para guardar · Esc para omitir</span>
              <button type="button" className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                {vm.invSheet.batch ? "Omitir disco" : "Cancelar"}
              </button>
              <button type="submit" disabled={vm.invSheet.saving} className={cx(pc("active", "transform:scale(0.97)"))} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;opacity:" + (vm.invSheet.saving ? 0.6 : 1))}>
                {vm.invSheet.saving ? "Guardando…" : vm.invSheet.exists ? "Guardar revisión" : "Agregar al expediente"}
              </button>
            </div>
          </form>
        </>
      ) : null}
      {vm.hasBatchSheet ? (
        <>
          <form data-component="Sheet" data-anim="sheet" role="dialog" aria-modal="true" aria-labelledby="batch-title" onSubmit={vm.batchSheet.submit} style={css("position:absolute;top:0;left:50%;margin-left:-240px;width:480px;z-index:var(--z-dialog);padding:22px 22px 18px;border-radius:0 0 var(--r-xl) var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:14px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="28" height="28" style={css("flex:none;color:var(--accent-fg)")}>
                <use href="#i-plus" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:4px")}>
                <strong id="batch-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>Recibir lote</strong>
                <span style={css("color:var(--text-secondary);text-wrap:pretty")}>Cada disco que conectes abrirá su hoja de expediente ya prellenada con estos datos. Confírmala con Enter y conecta el siguiente.</span>
              </div>
            </div>
            <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px")}>
                <label style={css("display:flex;flex-direction:column;gap:4px;grid-column:1 / -1")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Nombre del lote</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.batchSheet.f.lot} onChange={vm.batchSheet.set("lot")} placeholder="p. ej. Lote 20 × 2 TB · sep 2026" autoFocus style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Proveedor</span>
                  <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={vm.batchSheet.f.supplier} onChange={vm.batchSheet.set("supplier")} placeholder="" style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")} />
                </label>
                <label style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>Estado inicial</span>
                  <select data-component="Select" value={vm.batchSheet.f.status} onChange={vm.batchSheet.set("status")} style={css("height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0")}>
                    {vm.batchSheet.statusOpts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
            </div>
            {vm.batchSheet.error ? <span role="alert" style={css("color:var(--health-critical-fg)")}>{vm.batchSheet.error}</span> : null}
            <div style={css("display:flex;justify-content:flex-end;gap:8px;padding-top:4px")}>
              <button type="button" onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>Cancelar</button>
              <button type="submit" className={cx(pc("active", "transform:scale(0.97)"))} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>Empezar a recibir</button>
            </div>
          </form>
        </>
      ) : null}
      {vm.hasInvDelete ? (
        <>
          <div data-component="Dialog" data-variant="destructive" data-anim="dialog" role="alertdialog" aria-modal="true" aria-labelledby="invdel-title" style={css("position:absolute;top:50%;left:50%;margin:-90px 0 0 -200px;width:400px;z-index:var(--z-dialog);padding:20px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;gap:4px")}>
              <strong id="invdel-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>¿Eliminar el expediente {vm.invDeleteSerial}?</strong>
              <span style={css("color:var(--text-secondary);text-wrap:pretty")}>Se borrarán su ficha y sus revisiones de la app. Su carpeta y sus PDF se conservan en el disco de tu Mac.</span>
            </div>
            <div style={css("display:flex;justify-content:flex-end;gap:8px")}>
              <button onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>Cancelar</button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.invDeleteGo} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--health-critical-solid);color:#fff;font-weight:600")}>Eliminar expediente</button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasAuth ? (
        <>
          {/* @component Dialog | variants: auth (simulación del diálogo nativo de macOS) */}
          <div data-component="Dialog" data-variant="auth" data-anim="dialog" role="dialog" aria-modal="true" aria-label="Autenticación de macOS" style={css("position:absolute;top:50%;left:50%;margin:-150px 0 0 -150px;width:300px;z-index:var(--z-dialog);padding:22px 18px 16px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center")}>
            <svg width="40" height="40" style={css("color:var(--text-secondary)")}>
              <use href="#i-lock" />
            </svg>
            <strong style={css("font-weight:600")}>
              NVitals Drive quiere leer el disco sin procesar.
            </strong>
            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
              Introduce tu contraseña para permitirlo.
            </span>
            <div style={css("width:100%;display:flex;flex-direction:column;gap:6px;padding-top:4px")}>
              <span style={css("height:26px;display:flex;align-items:center;padding:0 8px;border-radius:var(--r-sm);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default);font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                técnico
              </span>
              <span style={css("height:26px;display:flex;align-items:center;padding:0 8px;border-radius:var(--r-sm);background:var(--surface-sunken);box-shadow:var(--focus-ring);letter-spacing:2px")}>
                ••••••••
              </span>
            </div>
            <div style={css("width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:6px")}>
              <button onClick={vm.closeDialog} style={css("height:28px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cancelar
              </button>
              <button onClick={vm.authOk} style={css("height:28px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                Permitir
              </button>
            </div>
            <span style={css("font-size:var(--type-caption-size);color:var(--text-tertiary)")}>
              Simulación del diálogo nativo de macOS
            </span>
          </div>
        </>
      ) : null}
      {vm.hasInterrupted ? (
        <>
          <div data-component="Dialog" data-variant="warning" data-anim="dialog" role="alertdialog" aria-modal="true" aria-labelledby="int-title" style={css("position:absolute;top:50%;left:50%;margin:-110px 0 0 -200px;width:400px;z-index:var(--z-dialog);padding:20px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="24" height="24" style={css("flex:none;color:var(--health-warning-fg)")}>
                <use href="#i-plug" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:4px")}>
                <strong id="int-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                  El disco se desconectó durante la prueba
                </strong>
                <span style={css("color:var(--text-secondary);text-wrap:pretty")}>
                  {"El escaneo de "}
                  {vm.dlg?.model}
                  {" se interrumpió al "}
                  {vm.dlg?.pct}
                  . Los resultados parciales se conservaron. Vuelve a conectar el disco para repetir la prueba.
                </span>
              </div>
            </div>
            <div style={css("display:flex;justify-content:flex-end;gap:8px")}>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.viewPartial} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                Ver resultados parciales
              </button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasPermission ? (
        <>
          {/* Permiso de privacidad de macOS para leer el disco en bruto (misma variante que el diálogo de advertencia). */}
          <div data-component="Dialog" data-variant="warning" data-anim="dialog" role="alertdialog" aria-modal="true" aria-labelledby="perm-title" style={css("position:absolute;top:50%;left:50%;margin:-150px 0 0 -260px;width:520px;z-index:var(--z-dialog);padding:20px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;gap:12px;align-items:flex-start")}>
              <svg width="24" height="24" style={css("flex:none;color:var(--health-warning-fg)")}>
                <use href="#i-lock" />
              </svg>
              <div style={css("display:flex;flex-direction:column;gap:6px")}>
                <strong id="perm-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                  macOS bloqueó el acceso al disco
                </strong>
                <span style={css("color:var(--text-secondary);text-wrap:pretty")}>
                  {"Por privacidad, macOS exige autorizar a "}
                  <strong style={css("font-weight:600;color:var(--text-primary)")}>{vm.permApp}</strong>
                  {" para leer discos en bruto, incluso con tu contraseña de administrador."}
                </span>
                <ol style={css("margin:4px 0 0;padding-left:18px;color:var(--text-secondary);display:flex;flex-direction:column;gap:3px;font-size:var(--type-callout-size)")}>
                  <li>Abre Ajustes del Sistema › Privacidad y seguridad.</li>
                  <li>{"En «Volúmenes extraíbles» (o «Acceso total al disco») activa "}{vm.permApp}.</li>
                  <li>Vuelve y pulsa Reintentar.</li>
                </ol>
              </div>
            </div>
            <div style={css("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
              <button className={cx(pc("hover", "text-decoration:underline"))} onClick={vm.permOpenFull} style={css("height:28px;padding:0 2px;border:0;background:transparent;color:var(--accent);font-weight:500;margin-right:auto")}>
                Acceso total al disco…
              </button>
              <button onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cancelar
              </button>
              <button onClick={vm.permOpen} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Abrir Ajustes
              </button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.permRetry} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                Reintentar
              </button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasCancel ? (
        <>
          <div data-component="Dialog" data-variant="destructive" data-anim="dialog" role="alertdialog" aria-modal="true" aria-labelledby="cn-title" style={css("position:absolute;top:50%;left:50%;margin:-90px 0 0 -190px;width:380px;z-index:var(--z-dialog);padding:20px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;gap:4px")}>
              <strong id="cn-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                {vm.cancelCopy?.title ?? "¿Cancelar el escaneo?"}
              </strong>
              <span style={css("color:var(--text-secondary)")}>
                {"Va al "}
                {vm.dlg?.pct}
                {vm.cancelCopy?.body ?? ". Se conservarán los resultados parciales."}
              </span>
            </div>
            <div style={css("display:flex;justify-content:flex-end;gap:8px")}>
              <button onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                {vm.cancelCopy?.keep ?? "Seguir escaneando"}
              </button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.cancelTest} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--health-critical-solid);color:#fff;font-weight:600")}>
                {vm.cancelCopy?.confirm ?? "Cancelar escaneo"}
              </button>
            </div>
          </div>
        </>
      ) : null}
      {vm.hasDelHist ? (
        <>
          <div data-component="Dialog" data-variant="destructive" data-anim="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dh-title" style={css("position:absolute;top:50%;left:50%;margin:-90px 0 0 -190px;width:380px;z-index:var(--z-dialog);padding:20px;border-radius:var(--r-xl);background:var(--mat-sheet-bg);-webkit-backdrop-filter:var(--mat-sheet-filter);backdrop-filter:var(--mat-sheet-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;gap:4px")}>
              <strong id="dh-title" style={css("font-size:var(--type-title3-size);font-weight:600")}>
                ¿Borrar todo el historial?
              </strong>
              <span style={css("color:var(--text-secondary);text-wrap:pretty")}>
                Se eliminarán las instantáneas de 7 discos. Esta acción no se puede deshacer. Los reportes guardados no se borran.
              </span>
            </div>
            <div style={css("display:flex;justify-content:flex-end;gap:8px")}>
              <button onClick={vm.closeDialog} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                Cancelar
              </button>
              <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.delHist} style={css("height:28px;padding:0 14px;border:0;border-radius:var(--r-md);background:var(--health-critical-solid);color:#fff;font-weight:600")}>
                Borrar historial
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
