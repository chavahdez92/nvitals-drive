// Expedientes (desviación #19): discos agregados por elección, consultables por número
// de serie. No existe en el prototipo: usa sus tokens, superficies, tipografía y los
// patrones de HistoryScreen (lista + detalle) y del Resumen del disco (héroe de salud).
import { Fragment } from 'react';
import { nf } from '../../domain/format';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

const card = "border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)";
const btn2 = "display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500;white-space:nowrap";
const btnA = "display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;white-space:nowrap";
const field = "height:28px;padding:0 10px;border:0;border-radius:var(--r-md);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default);outline:none;font-size:var(--type-body-size);color:var(--text-primary);min-width:0";
const label = "font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)";
const TONE_FG: Record<string, string> = { ok: 'var(--health-optimal-fg)', note: 'var(--text-secondary)', warn: 'var(--health-warning-fg)', crit: 'var(--health-critical-fg)' };
const TONE_BG: Record<string, string> = { ok: 'var(--health-optimal-bg)', note: 'var(--surface-sunken)', warn: 'var(--health-warning-bg)', crit: 'var(--health-critical-bg)' };

function Icon({ id, size = 14, color }: { id: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} aria-hidden="true" style={css(`flex:none${color ? ';color:' + color : ''}`)}>
      <use href={id} />
    </svg>
  );
}

function StatusPill({ l, icon, fg, bg }: { l: string; icon: string; fg: string; bg: string }) {
  return (
    <span style={css(`display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 6px;border-radius:var(--r-pill);background:${bg};color:${fg};font-size:var(--type-note-size);font-weight:600;white-space:nowrap`)}>
      <Icon id={icon} size={11} />
      {l}
    </span>
  );
}

/** Casilla del prototipo (@component Checkbox de ReportBuilderScreen), decorativa: el estado va en aria-selected. */
function Checkbox({ c }: { c: any }) {
  return (
    <span aria-hidden="true" style={css(`width:14px;height:14px;flex:none;display:grid;place-items:center;border-radius:4px;background:${c.box};box-shadow:inset 0 0 0 1px ${c.boxBorder};color:var(--text-on-accent);transition:background-color var(--dur-fast) var(--ease-out)`)}>
      <svg width="10" height="10" style={css(`opacity:${c.check}`)}>
        <use href="#i-check" />
      </svg>
    </span>
  );
}

function LifeRing({ life, verdict }: { life: number | null; verdict: string }) {
  const r = 54, c = 2 * Math.PI * r;
  const off = c * (1 - (life == null ? 0 : Math.max(0, Math.min(100, life))) / 100);
  return (
    <div style={css("position:relative;width:132px;height:132px;flex:none")}>
      <svg width="132" height="132" viewBox="0 0 132 132" style={css("transform:rotate(-90deg);display:block")}>
        <circle cx="66" cy="66" r={r} fill="none" style={css("stroke:var(--ring-track);stroke-width:12")} />
        <circle cx="66" cy="66" r={r} fill="none" strokeLinecap="round" strokeDasharray={c.toFixed(2)} strokeDashoffset={off.toFixed(2)} style={css(`stroke:var(--health-${verdict}-solid);stroke-width:12;transition:stroke-dashoffset var(--dur-data) var(--ease-out)`)} />
      </svg>
      <div style={css("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center")}>
        <span style={css("font-family:var(--font-display);font-size:38px;line-height:40px;font-weight:700;letter-spacing:-0.03em")}>
          {life == null ? '—' : life}
          {life == null ? null : <span style={css("font-size:18px;color:var(--text-secondary);margin-left:1px")}>%</span>}
        </span>
        <span style={css("font-size:var(--type-note-size);color:var(--text-secondary)")}>vida útil</span>
      </div>
    </div>
  );
}

function Empty({ vm }: { vm: VM }) {
  return (
    <div data-anim="rise" style={css("margin:auto;max-width:460px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:48px 24px")}>
      <span style={css("width:56px;height:56px;display:grid;place-items:center;border-radius:16px;background:var(--accent-soft);color:var(--accent-fg)")}>
        <Icon id="#i-folder" size={26} />
      </span>
      <strong style={css("font-size:var(--type-title3-size);font-weight:600")}>Aún no hay discos en el expediente</strong>
      <span style={css("color:var(--text-secondary);text-wrap:pretty")}>
        Conecta un disco y elige «Agregar al expediente» en su Resumen, o activa «Recibir lote» para registrar varias unidades seguidas. Cada disco guarda su lectura completa, su reporte en PDF y una carpeta con su número de serie.
      </span>
      <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.invStartBatch} style={css(btnA)}>
        <Icon id="#i-plus" size={13} />
        Recibir lote
      </button>
    </div>
  );
}

function Detail({ vm }: { vm: VM }) {
  const x = vm.invDetail;
  const qv = x.qv;
  return (
    <div data-anim="fade" key={x.serial} style={css("display:flex;flex-direction:column;gap:18px;padding:18px 28px 32px;min-width:0")}>
      {/* Encabezado */}
      <div style={css("display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap")}>
        <div style={css("flex:1;min-width:260px;display:flex;flex-direction:column;gap:4px")}>
          <div style={css("display:flex;align-items:center;gap:10px;flex-wrap:wrap")}>
            <h1 style={css("margin:0;font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:650;letter-spacing:var(--type-title2-track)")}>{x.model}</h1>
            <StatusPill l={x.stLabel} icon={x.stIcon} fg={x.stFg} bg={x.stBg} />
          </div>
          <div style={css("display:flex;align-items:center;gap:8px;color:var(--text-secondary);flex-wrap:wrap")}>
            <span style={css("font-family:var(--font-mono);font-weight:600;color:var(--text-primary)")}>{x.serial}</span>
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={x.copy} aria-label="Copiar número de serie" style={css("display:grid;place-items:center;width:22px;height:22px;padding:0;border:0;border-radius:var(--r-xs);background:transparent;color:var(--text-secondary)")}>
              <Icon id={x.copyIcon} size={13} />
            </button>
            <span>· {x.sub}</span>
          </div>
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>En el expediente desde {x.created}</span>
        </div>
        <div style={css("display:flex;gap:8px;align-items:center;position:relative")}>
          {x.newCheck ? (
            <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={x.newCheck} style={css(btnA)}>
              <Icon id="#i-refresh" size={13} />
              Nueva revisión
            </button>
          ) : null}
          <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={x.reveal} style={css(btn2)}>
            <Icon id="#i-folder" size={13} />
            Mostrar carpeta
          </button>
          <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={x.toggleExport} aria-expanded={x.exportOpen} style={css(btn2)}>
            <Icon id="#i-download" size={13} />
            Exportar
            <Icon id="#i-chevron-down" size={11} />
          </button>
          <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={x.askDelete} aria-label="Eliminar expediente" data-tip="Eliminar expediente" style={css("display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:var(--r-md);background:transparent;color:var(--health-critical-fg)")}>
            <Icon id="#i-trash" size={14} />
          </button>
          {x.exportOpen ? (
            <div data-anim="pop" role="menu" style={css("position:absolute;top:34px;right:36px;z-index:var(--z-popover);min-width:230px;padding:5px;border-radius:var(--r-lg);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);display:flex;flex-direction:column")}>
              {x.exports.map((e: any, i: number) => (
                <Fragment key={i}>
                  {i === 4 ? <span style={css("height:0.5px;margin:4px 6px;background:var(--border-subtle)")} /> : null}
                  <button role="menuitem" className={cx(pc("hover", "background:var(--accent);color:var(--text-on-accent)"))} onClick={e.run} style={css("display:flex;align-items:center;gap:8px;height:28px;padding:0 10px;border:0;border-radius:var(--r-sm);background:transparent;text-align:left;color:var(--text-primary)")}>
                    <Icon id={e.icon} size={13} />
                    {e.label}
                  </button>
                </Fragment>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div style={css("display:flex;align-items:center;gap:8px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
        <Icon id="#i-clock" size={13} />
        {x.checkLabel}
        {x.showLatest ? (
          <button onClick={x.showLatest} style={css("padding:0;border:0;background:transparent;color:var(--accent-fg);font-weight:500")}>
            · Ver la más reciente
          </button>
        ) : null}
      </div>

      {/* Héroe: salud y vida útil */}
      <div style={css(`position:relative;display:grid;grid-template-columns:132px minmax(0,1fr) 170px;gap:22px;align-items:center;padding:20px 22px 20px 26px;border-radius:var(--r-xl);background:var(--health-${x.verdict}-bg);box-shadow:inset 0 0 0 0.5px var(--health-${x.verdict}-border);overflow:hidden`)}>
        <span aria-hidden="true" style={css(`position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--health-${x.verdict}-solid)`)} />
        <LifeRing life={x.life} verdict={x.verdict} />
        <div style={css("display:flex;flex-direction:column;gap:10px;min-width:0")}>
          <span style={css(`align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 11px 0 8px;border-radius:var(--r-pill);background:var(--health-${x.verdict}-solid);color:#fff;font-weight:700`)}>
            <Icon id={x.vIcon} size={13} />
            {x.vLabel}
          </span>
          <span style={css("font-size:var(--type-title3-size);line-height:1.35;font-weight:500;text-wrap:pretty")}>{x.sentence}</span>
          {x.meters.map((m: any) => (
            <div key={m.label} style={css("display:flex;flex-direction:column;gap:3px")}>
              <span style={css("display:flex;justify-content:space-between;font-size:var(--type-note-size);color:var(--text-secondary)")}>
                {m.label}
                <strong style={css("color:var(--text-primary);font-weight:600")}>{m.value}</strong>
              </span>
              <span style={css("position:relative;height:7px;border-radius:4px;background:var(--ring-track)")}>
                <span style={css(`position:absolute;left:0;top:0;bottom:0;width:${Math.max(0, Math.min(100, m.pct))}%;border-radius:4px;background:${m.tone};transition:width var(--dur-data) var(--ease-out)`)} />
                {m.mark != null ? <span style={css(`position:absolute;top:-3px;bottom:-3px;left:${m.mark}%;width:2px;margin-left:-1px;border-radius:1px;background:var(--text-primary)`)} /> : null}
              </span>
              <span style={css("font-size:var(--type-caption-size);color:var(--text-tertiary)")}>{m.note}</span>
            </div>
          ))}
        </div>
        <div style={css(`display:flex;flex-direction:column;border-left:0.5px solid var(--health-${x.verdict}-border);padding-left:16px`)}>
          {x.facts.map(([k, v]: [string, string]) => (
            <div key={k} style={css(`display:flex;flex-direction:column;gap:1px;padding:7px 0;border-bottom:0.5px dashed var(--health-${x.verdict}-border)`)}>
              <span style={css("font-size:var(--type-note-size);color:var(--text-secondary)")}>{k}</span>
              <strong style={css("font-size:var(--type-title3-size);font-weight:650")}>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Uso */}
      <div style={css("display:flex;flex-direction:column;gap:8px")}>
        <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>Uso del disco</h2>
        <div style={css("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px")}>
          {qv.kpis.map((k: any) => (
            <div key={k.label} style={css(card + ";display:flex;flex-direction:column;gap:3px;padding:12px 14px")}>
              <span style={css("display:flex;align-items:center;gap:6px;font-size:var(--type-note-size);color:var(--text-secondary)")}>
                <Icon id={k.icon} size={13} />
                {k.label}
              </span>
              <strong style={css("font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:650;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{k.value}</strong>
              <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{k.sub}</span>
            </div>
          ))}
        </div>
        {qv.hasSplit ? (
          <div style={css("display:flex;align-items:center;gap:12px")}>
            <span style={css("flex:1;display:flex;gap:2px;height:7px;border-radius:4px;overflow:hidden")}>
              <span style={css(`width:${qv.readPct}%;background:var(--data-read)`)} />
              <span style={css(`width:${100 - qv.readPct}%;background:var(--data-write)`)} />
            </span>
            <span style={css("display:flex;gap:12px;font-size:var(--type-note-size);color:var(--text-secondary);white-space:nowrap")}>
              <span style={css("display:inline-flex;align-items:center;gap:5px")}><span style={css("width:9px;height:9px;border-radius:2px;background:var(--data-read)")} />Lectura {nf(qv.readPct)} %</span>
              <span style={css("display:inline-flex;align-items:center;gap:5px")}><span style={css("width:9px;height:9px;border-radius:2px;background:var(--data-write)")} />Escritura {nf(100 - qv.readPct)} %</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Identidad + integridad */}
      <div style={css("display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px")}>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>Identidad</h2>
          <div style={css(card + ";display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:hidden")}>
            {qv.identity.map(([k, v, mono]: [string, string, boolean?], i: number) => (
              <div key={k} style={css(`padding:8px 12px;min-width:0;border-top:${i > 1 ? '0.5px solid var(--border-subtle)' : '0'};border-left:${i % 2 ? '0.5px solid var(--border-subtle)' : '0'}`)}>
                <span style={css(label)}>{k}</span>
                <div style={css(`margin-top:2px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${mono ? 'font-family:var(--font-mono)' : ''}`)} title={v}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>Errores e integridad</h2>
          {qv.nd ? (
            <span style={css("color:var(--text-secondary)")}>Sin datos SMART: no es posible evaluar errores con esta conexión.</span>
          ) : (
            <div style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px")}>
              {qv.chips.map((c: any) => (
                <div key={c.label} style={css(`display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:var(--r-lg);background:${TONE_BG[c.k]};box-shadow:inset 0 0 0 0.5px var(--border-subtle);min-width:0`)}>
                  <span style={css(`display:flex;align-items:center;gap:5px;font-size:var(--type-note-size);font-weight:600;color:${TONE_FG[c.k]}`)}>
                    <Icon id={c.icon} size={12} />
                    {c.label}
                  </span>
                  <strong style={css("font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:650")}>{c.value}</strong>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{c.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {qv.bench || qv.scan ? (
        <div style={css(card + ";display:flex;flex-direction:column;gap:6px;padding:10px 14px")}>
          {qv.bench ? (
            <span style={css("display:flex;align-items:center;gap:8px")}>
              <Icon id="#i-bolt" size={13} color="var(--accent-fg)" />
              <span><strong style={css("font-weight:600")}>Benchmark</strong> · lectura {qv.bench.read} MB/s · escritura {qv.bench.write} MB/s{qv.bench.pct != null ? ` · ${qv.bench.pct} % del techo de la conexión (~${qv.bench.ceiling} MB/s)` : ''}</span>
            </span>
          ) : null}
          {qv.scan ? (
            <span style={css("display:flex;align-items:center;gap:8px")}>
              <Icon id={qv.scan.ok ? '#i-check-circle' : '#i-alert'} size={13} color={qv.scan.ok ? 'var(--health-optimal-fg)' : 'var(--health-critical-fg)'} />
              <span><strong style={css("font-weight:600")}>Escaneo de lectura</strong> · {qv.scan.label} · {qv.scan.dur} · {qv.scan.avg} MB/s promedio{qv.scan.zones ? ` · ${qv.scan.zones} zonas ilegibles` : ''}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Datos comerciales + revisiones */}
      <div style={css("display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start")}>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>Datos del expediente</h2>
          <div style={css(card + ";display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;padding:14px")}>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Estado</span>
              <select data-component="Select" value={x.f.status} onChange={x.setF('status')} style={css(field)}>
                {x.statusOpts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Lote</span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={x.f.lot} onChange={x.setF('lot')} placeholder="p. ej. Lote 20 × 2 TB" style={css(field)} />
            </label>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Proveedor</span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={x.f.supplier} onChange={x.setF('supplier')} style={css(field)} />
            </label>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Destino o cliente</span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={x.f.destination} onChange={x.setF('destination')} placeholder="Equipo o comprador" style={css(field)} />
            </label>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Costo (MXN)</span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} inputMode="decimal" value={x.f.cost} onChange={x.setF('cost')} placeholder="0.00" style={css(field)} />
            </label>
            <label style={css("display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Precio de venta (MXN)</span>
              <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} inputMode="decimal" value={x.f.price} onChange={x.setF('price')} placeholder="0.00" style={css(field)} />
            </label>
            <label style={css("grid-column:1 / -1;display:flex;flex-direction:column;gap:4px")}>
              <span style={css(label)}>Notas</span>
              <textarea className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={x.f.notes} onChange={x.setF('notes')} rows={3} placeholder="Estado físico, observaciones…" style={css(field + ";height:auto;padding:7px 10px;resize:vertical;font-family:inherit")} />
            </label>
            <div style={css("grid-column:1 / -1;display:flex;align-items:center;gap:8px")}>
              <span style={css("flex:1;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                {x.money.margin ? `Margen: ${x.money.margin}` : 'Costo y precio son opcionales.'}
              </span>
              {x.dirty ? (
                <>
                  <button onClick={x.reset} style={css(btn2)}>Descartar</button>
                  <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={x.save} style={css(btnA)}>Guardar cambios</button>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:8px")}>
          <h2 style={css("margin:0;display:flex;justify-content:space-between;align-items:baseline;font-size:var(--type-title3-size);font-weight:600")}>
            Revisiones
            <span style={css("font-size:var(--type-note-size);font-weight:500;color:var(--text-tertiary)")}>{x.checksTxt}</span>
          </h2>
          <div role="listbox" aria-label="Revisiones" style={css(card + ";display:flex;flex-direction:column;padding:6px")}>
            {x.checks.map((c: any) => (
              <div key={c.id} role="option" aria-selected={c.sel} onClick={c.pick} className={cx(pc("hover", "background:var(--surface-hover)"))} style={css(`display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:var(--r-md);cursor:default;background:${c.sel ? 'var(--surface-selected)' : 'transparent'}`)}>
                <Icon id={c.vIcon} size={15} color={c.vFg} />
                <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                  <span style={css("display:flex;justify-content:space-between;gap:8px")}>
                    <strong style={css("font-weight:600")}>Revisión {c.n}</strong>
                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>{c.when}</span>
                  </span>
                  <span style={css("font-size:var(--type-note-size);color:var(--text-secondary)")}>
                    {c.vLabel} · {c.life} vida · {c.written} escritos · {c.hours}
                  </span>
                  {c.delta ? <span style={css(`font-size:var(--type-note-size);color:${c.deltaBad ? 'var(--health-critical-fg)' : 'var(--text-tertiary)'}`)}>{c.delta}</span> : null}
                </span>
                {c.pdf ? (
                  <button onClick={(e) => { e.stopPropagation(); c.pdf(); }} data-tip="Mostrar el PDF en Finder" className={cx(pc("hover", "background:var(--surface-hover)"))} style={css("flex:none;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 7px;border:0;border-radius:var(--r-sm);background:transparent;color:var(--accent-fg);font-size:var(--type-note-size);font-weight:600")}>
                    <Icon id="#i-report" size={12} />
                    PDF
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);word-break:break-all")}>Carpeta: {x.folder}</span>
        </div>
      </div>
    </div>
  );
}

/** Panel del modo selección: resumen de los discos elegidos y opciones del reporte rápido de varios discos (desviación #21). */
function BatchPanel({ vm }: { vm: VM }) {
  const b = vm.invBatch;
  const table = b.pane === 'table';
  return (
    <div data-anim="fade" style={css("display:flex;flex-direction:column;gap:18px;padding:18px 28px 32px;min-width:0")}>
      <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:16px")}>
        <div style={css("display:flex;flex-direction:column;gap:4px;min-width:0")}>
          <h1 style={css("margin:0;display:flex;align-items:center;gap:8px;font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:650;letter-spacing:var(--type-title2-track)")}>
            <Icon id={table ? '#i-list' : '#i-bolt'} size={17} color="var(--accent-fg)" />
            {table ? 'Discos seleccionados' : 'Reporte rápido de varios discos'}
          </h1>
          <span style={css("color:var(--text-secondary)")}>{b.title} · {table ? 'ordena por cualquier columna; el PDF sale en el mismo orden' : 'una hoja con la salud de cada disco y el resumen del grupo'}</span>
        </div>
        <div role="group" aria-label="Vista" style={css("flex:none;display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
          {b.panes.map((o: any) => (
            <button key={o.label} onClick={o.pick} aria-pressed={o.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o.bg};box-shadow:${o.shadow};color:${o.fg};font-size:var(--type-callout-size);font-weight:500;white-space:nowrap`)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {b.empty ? (
        <div style={css(card + ";display:flex;flex-direction:column;align-items:center;gap:8px;padding:36px 24px;text-align:center;color:var(--text-secondary)")}>
          <Icon id="#i-check-circle" size={26} color="var(--text-tertiary)" />
          <span>Marca en la lista los discos que quieres incluir.</span>
          <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>Filtra por lote o estado y usa «Seleccionar los N» (⌘A) para elegirlos todos. ⇧-clic marca un rango.</span>
        </div>
      ) : (
        <>
          <div style={css("display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px")}>
            {b.tiles.map((t: any) => (
              <div key={t.key} style={css(`display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:var(--r-lg);background:${t.bg};box-shadow:inset 0 0 0 0.5px var(--border-subtle);min-width:0`)}>
                <span style={css(`display:flex;align-items:center;gap:5px;font-size:var(--type-note-size);font-weight:600;color:${t.fg};white-space:nowrap`)}>
                  <Icon id={t.icon} size={12} />
                  {t.label}
                </span>
                <strong style={css(`font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:650;color:${t.count ? 'var(--text-primary)' : 'var(--text-tertiary)'}`)}>{t.count}</strong>
              </div>
            ))}
          </div>
          <div style={css("display:flex;gap:18px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
            <span>Vida útil promedio <strong style={css("color:var(--text-primary);font-weight:600")}>{b.avgTxt}</strong></span>
            <span>
              Mínima <strong style={css("color:var(--text-primary);font-weight:600")}>{b.minTxt}</strong>
              {b.minSerial ? <span style={css("margin-left:6px;font-family:var(--font-mono);font-size:var(--type-note-size)")}>{b.minSerial}</span> : null}
            </span>
          </div>
          {table ? <SelTable b={b} /> : (
          <div role="list" aria-label="Discos seleccionados, en el orden del reporte" style={css(card + ";display:flex;flex-direction:column;padding:6px;max-height:264px;overflow:auto")}>
            {b.list.map((x: any) => (
              <div key={x.serial} role="listitem" style={css("display:flex;align-items:center;gap:10px;min-height:34px;padding:0 6px 0 10px;border-radius:var(--r-md)")}>
                <span style={css("flex:none;min-width:18px;text-align:right;font-size:var(--type-note-size);color:var(--text-tertiary);font-variant-numeric:tabular-nums")}>{x.n}</span>
                <span data-tip={x.vLabel} style={css("display:flex")}><Icon id={x.vIcon} size={14} color={x.vFg} /></span>
                <span style={css("flex:1;min-width:0;display:flex;align-items:baseline;gap:8px")}>
                  <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{x.model}</span>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-secondary);white-space:nowrap")}>{x.serial}</span>
                </span>
                <span style={css("flex:none;font-size:var(--type-callout-size);color:var(--text-secondary);font-variant-numeric:tabular-nums")}>{x.hours}</span>
                <span style={css("flex:none;min-width:44px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums")}>{x.life}</span>
                <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={x.remove} aria-label={`Quitar ${x.serial}`} data-tip="Quitar del reporte" style={css("display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                  <Icon id="#i-x" size={12} />
                </button>
              </div>
            ))}
          </div>
          )}
        </>
      )}

      {table ? (
        b.empty ? null : (
          <div style={css("display:flex;align-items:center;gap:12px")}>
            <span style={css("flex:1;display:flex;gap:8px;align-items:flex-start;font-size:var(--type-note-size);color:var(--text-tertiary);text-wrap:pretty")}>
              <Icon id="#i-info" size={13} />
              Clic en un encabezado para ordenar; otro clic invierte el sentido. Los discos sin datos quedan al final.
            </span>
            <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={b.panes[1].pick} style={css(btn2)}>
              <Icon id="#i-report" size={13} />
              Reporte PDF…
            </button>
          </div>
        )
      ) : (
      <>
      <div style={css(card + ";display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px")}>
        <div style={css("grid-column:1 / -1;display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          <span style={css("display:flex;flex-direction:column;gap:1px")}>
            Orden
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>El PDF sale en el mismo orden que la tabla.</span>
          </span>
          <span style={css("display:flex;align-items:center;gap:6px")}>
            <select data-component="Select" value={b.sortSel.value} onChange={b.sortSel.onChange} aria-label="Ordenar por" style={css("height:28px;padding:0 8px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);color:var(--text-primary);font-size:var(--type-body-size)")}>
              {b.sortSel.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={b.sortDir.toggle} aria-label={`Sentido: ${b.sortDir.label}`} data-tip="Invertir el sentido" style={css(btn2)}>
              <Icon id={b.sortDir.icon} size={12} />
              {b.sortDir.label}
            </button>
          </span>
        </div>
        <label style={css("display:flex;flex-direction:column;gap:4px")}>
          <span style={css(label)}>Referencia (título del reporte)</span>
          <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={b.ref} onChange={b.onRef} placeholder="Discos del expediente" style={css(field)} />
        </label>
        <label style={css("display:flex;flex-direction:column;gap:4px")}>
          <span style={css(label)}>Técnico</span>
          <input className={cx(pc("focus", "box-shadow:var(--focus-ring)"))} value={b.tech} onChange={b.onTech} style={css(field)} />
        </label>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          <span>Papel</span>
          <div role="group" aria-label="Papel" style={css("display:flex;gap:2px;padding:2px;border-radius:var(--r-md);background:var(--surface-sunken);border:0.5px solid var(--border-subtle)")}>
            {b.papers.map((o: any) => (
              <button key={o.label} onClick={o.pick} aria-pressed={o.pressed} style={css(`height:22px;padding:0 10px;border:0;border-radius:6px;background:${o.bg};box-shadow:${o.shadow};color:${o.fg};font-size:var(--type-callout-size);font-weight:500`)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <label style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
          Incluir estado, lote y destino
          <button role="switch" aria-checked={b.swExtra.on} onClick={b.tgExtra} style={css(`position:relative;width:28px;height:16px;padding:0;border:0;border-radius:8px;background:${b.swExtra.track};transition:background-color var(--dur-fast) var(--ease-out)`)}>
            <span style={css(`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px oklch(0 0 0 / 0.3);transform:${b.swExtra.knob};transition:transform var(--dur-base) var(--ease-out)`)} />
          </button>
        </label>
      </div>

      <div style={css("display:flex;align-items:center;gap:12px")}>
        <span style={css("flex:1;display:flex;gap:8px;align-items:flex-start;font-size:var(--type-note-size);color:var(--text-tertiary);text-wrap:pretty")}>
          <Icon id="#i-info" size={13} />
          Se usa la última revisión de cada disco. El costo y el precio nunca se imprimen. El PDF se guarda con el diálogo Guardar y aparece en Reportes.
        </span>
        <button disabled={b.empty || b.busy} className={cx(pc("active", "transform:scale(0.97)"))} onClick={b.run} style={css(btnA + `;opacity:${b.empty || b.busy ? 0.5 : 1}`)}>
          <Icon id="#i-report" size={13} />
          {b.busy ? 'Generando…' : 'Generar PDF'}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

/** Tabla de los discos seleccionados (desviación #22): patrón de la vista de lista de Dispositivos, con encabezados ordenables. */
function SelTable({ b }: { b: any }) {
  // Modelo y serie comparten la columna «Disco» (dos líneas, dos botones de orden) para que quepa sin desplazamiento.
  const cols = `24px 96px minmax(140px,1fr) 48px 70px 74px 126px${b.lotCol ? ' minmax(64px,0.45fr)' : ''} 84px 24px`;
  const row = `display:grid;grid-template-columns:${cols};gap:8px;align-items:center;padding:0 8px 0 12px`;
  const sortBtn = (c: any) => (
    <button key={c.key} onClick={c.pick} data-tip={c.tip} className={cx(pc("hover", "color:var(--text-primary)"))} style={css(`display:inline-flex;align-items:center;gap:3px;max-width:100%;height:22px;padding:0;border:0;background:transparent;color:${c.fg};font:inherit;font-weight:600;${ell}`)}>
      {c.right && c.arrow ? <Icon id={c.arrow} size={11} /> : null}
      {c.label}
      {!c.right && c.arrow ? <Icon id={c.arrow} size={11} /> : null}
    </button>
  );
  const serialCol = b.cols.find((c: any) => c.key === 'serial');
  const num = "text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap";
  const ell = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
  return (
    <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1);overflow:auto;max-height:calc(100vh - 290px)")}>
      <div role="table" aria-label="Discos seleccionados" aria-rowcount={b.list.length + 1} style={css("display:flex;flex-direction:column;min-width:" + (b.lotCol ? 850 : 770) + "px")}>
        <div role="row" style={css(row + ";position:sticky;top:0;z-index:1;height:30px;background:var(--surface-raised);font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);border-bottom:0.5px solid var(--border-subtle)")}>
          <span role="columnheader" style={css("text-align:right")}>#</span>
          {b.cols.filter((c: any) => c.key !== 'serial').map((c: any) => (
            <span key={c.key} role="columnheader" aria-sort={c.key === 'model' && serialCol?.sort !== 'none' ? serialCol.sort : c.sort} style={css(`display:flex;align-items:center;gap:4px;min-width:0;justify-content:${c.right ? 'flex-end' : 'flex-start'}${c.key === 'status' ? ';padding-left:10px' : ''}`)}>
              {sortBtn(c)}
              {c.key === 'model' && serialCol ? <><span aria-hidden="true">·</span>{sortBtn(serialCol)}</> : null}
            </span>
          ))}
          <span role="columnheader" aria-label="Quitar" />
        </div>
        {b.list.map((x: any) => (
          <div key={x.serial} role="row" className={cx(pc("hover", "background:var(--surface-hover)"))} style={css(row + ";height:44px;border-bottom:0.5px solid var(--border-subtle);transition:background-color var(--dur-fast) var(--ease-out)")}>
            <span role="cell" style={css(num + ";font-size:var(--type-note-size);color:var(--text-tertiary)")}>{x.n}</span>
            <span role="cell" style={css("display:flex;align-items:center;gap:6px;min-width:0;font-size:var(--type-callout-size)")}>
              <Icon id={x.vIcon} size={14} color={x.vFg} />
              <span style={css(ell)}>{x.vLabel}</span>
            </span>
            <span role="cell" style={css("display:flex;flex-direction:column;gap:1px;min-width:0")}>
              <span style={css("font-weight:600;" + ell)} data-tip={x.model}>{x.model}</span>
              <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-secondary);" + ell)}>{x.serial}</span>
            </span>
            <span role="cell" style={css(num + ";font-weight:600")}>{x.life}</span>
            <span role="cell" style={css(num)}>{x.hours}</span>
            <span role="cell" style={css(num + ";color:var(--text-secondary)")}>{x.written}</span>
            <span role="cell" style={css("display:flex;min-width:0;padding-left:10px")}><StatusPill l={x.stLabel} icon={x.stIcon} fg={x.stFg} bg={x.stBg} /></span>
            {b.lotCol ? <span role="cell" style={css("font-size:var(--type-callout-size);color:var(--text-secondary);" + ell)}>{x.lot}</span> : null}
            <span role="cell" style={css("font-size:var(--type-callout-size);color:var(--text-secondary);white-space:nowrap")}>{x.when}</span>
            <span role="cell" style={css("display:flex;justify-content:flex-end")}>
              <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={x.remove} aria-label={`Quitar ${x.serial}`} data-tip="Quitar de la selección" style={css("display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-secondary)")}>
                <Icon id="#i-x" size={12} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoryScreen({ vm }: { vm: VM }) {
  return (
    <section data-screen-label="Expedientes" data-component="Inventory" data-anim="fade" style={css("display:grid;grid-template-columns:320px minmax(0,1fr);min-height:100%")}>
      <div style={css("position:sticky;top:0;align-self:start;max-height:calc(100vh - 56px);overflow:auto;display:flex;flex-direction:column;gap:10px;padding:14px 12px 20px;min-width:0")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px")}>
          <span style={css("display:flex;flex-direction:column")}>
            <strong style={css("font-size:var(--type-title3-size);font-weight:600")}>Expedientes</strong>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>{vm.invCountTxt}</span>
          </span>
          <span style={css("display:flex;gap:6px")}>
            {vm.invAll ? (
              <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.invPickBtn.run} aria-pressed={vm.invPick} data-tip={vm.invPick ? undefined : 'Elige varios discos para un reporte rápido'} style={css(vm.invPick ? btnA : btn2)}>
                {vm.invPick ? null : <Icon id="#i-check-circle" size={13} />}
                {vm.invPickBtn.label}
              </button>
            ) : null}
            {vm.batchBar || vm.invPick ? null : (
              <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.invStartBatch} style={css(btn2)}>
                <Icon id="#i-plus" size={13} />
                Recibir lote
              </button>
            )}
          </span>
        </div>
        <label style={css("display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border-radius:var(--r-md);background:var(--surface-sunken);box-shadow:inset 0 0 0 0.5px var(--border-default)")}>
          <Icon id="#i-search" size={13} color="var(--text-tertiary)" />
          <input data-inv-search="" value={vm.invQ} onChange={vm.onInvQ} placeholder="Buscar serie, modelo, lote o destino" aria-label="Buscar en expedientes" style={css("flex:1;min-width:0;border:0;background:transparent;outline:none;font-size:var(--type-body-size);color:var(--text-primary)")} />
        </label>
        <div role="group" aria-label="Estado" style={css("display:flex;flex-wrap:wrap;gap:4px")}>
          {(vm.invStatuses || []).map((o: any, i: number) => (
            <button key={i} onClick={o.pick} aria-pressed={o.pressed} style={css(`height:22px;padding:0 9px;border:0;border-radius:var(--r-pill);background:${o.pressed === 'true' ? 'var(--accent-soft)' : 'var(--surface-sunken)'};color:${o.pressed === 'true' ? 'var(--accent-fg)' : 'var(--text-secondary)'};box-shadow:inset 0 0 0 0.5px ${o.pressed === 'true' ? 'var(--accent-border)' : 'var(--border-subtle)'};font-size:var(--type-note-size);font-weight:600`)}>
              {o.label}
            </button>
          ))}
        </div>
        {vm.invLots?.length ? (
          <select data-component="Select" value={vm.invLot} onChange={vm.onInvLot} aria-label="Lote" style={css("height:28px;padding:0 8px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);color:var(--text-primary);font-size:var(--type-body-size)")}>
            <option value="">Todos los lotes</option>
            {vm.invLots.map((l: string) => <option key={l} value={l}>{l}</option>)}
          </select>
        ) : null}
        {vm.invSelAll ? (
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px 0 10px")}>
            <button disabled={vm.invSelAll.disabled} onClick={vm.invSelAll.toggle} style={css("display:flex;align-items:center;gap:8px;height:24px;padding:0;border:0;background:transparent;font-weight:500;text-align:left")}>
              <Checkbox c={vm.invSelAll} />
              {vm.invSelAll.label}
            </button>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);text-align:right")}>{vm.invSelAll.txt}</span>
          </div>
        ) : null}
        <div role="listbox" aria-label="Discos en el expediente" aria-multiselectable={vm.invPick || undefined} style={css("display:flex;flex-direction:column;gap:2px;margin:0 -2px")}>
          {(vm.invRows || []).map((h: any) => (
            <button key={h.serial} role="option" aria-selected={h.cur} className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={h.pick} style={css(`display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:0;border-radius:var(--r-md);background:${h.bg};text-align:left`)}>
              {vm.invPick ? <span style={css("margin-top:2px")}><Checkbox c={h} /></span> : null}
              <span data-tip={h.vLabel} style={css("margin-top:2px")}><Icon id={h.vIcon} size={15} color={h.vFg} /></span>
              <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                <span style={css("display:flex;justify-content:space-between;gap:8px")}>
                  <span style={css("font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{h.model}</span>
                  <span style={css("flex:none;font-weight:600;font-variant-numeric:tabular-nums")}>{h.life}</span>
                </span>
                <span style={css("display:flex;justify-content:space-between;align-items:baseline;gap:8px")}>
                  <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{h.serial}</span>
                  {h.hours ? <span data-tip="Horas de uso" style={css("flex:none;font-size:var(--type-note-size);color:var(--text-secondary);font-variant-numeric:tabular-nums")}>{h.hours}</span> : null}
                </span>
                <span style={css("display:flex;align-items:center;gap:6px;flex-wrap:wrap")}>
                  <StatusPill l={h.stLabel} icon={h.stIcon} fg={h.stFg} bg={h.stBg} />
                  {h.lot ? <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{h.lot}</span> : null}
                </span>
              </span>
            </button>
          ))}
          {vm.invNoMatch ? <span style={css("padding:16px 10px;color:var(--text-tertiary);text-align:center")}>Ningún disco coincide con la búsqueda.</span> : null}
        </div>
      </div>
      <div style={css("display:flex;flex-direction:column;min-width:0;min-height:calc(100vh - 56px);border-left:0.5px solid var(--border-subtle)")}>
        {vm.invBatch ? <BatchPanel vm={vm} /> : null}
        {vm.invEmpty ? <Empty vm={vm} /> : null}
        {vm.invNoSel && !vm.invBatch ? (
          <div style={css("margin:auto;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text-secondary);text-align:center;padding:40px")}>
            <Icon id="#i-search" size={28} color="var(--text-tertiary)" />
            <span>Elige un disco de la lista o escribe su número de serie en el buscador.</span>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>También puedes buscarlo desde cualquier pantalla con ⌘K.</span>
          </div>
        ) : null}
        {vm.invLoading && !vm.invBatch ? <span style={css("margin:auto;color:var(--text-tertiary);animation:hdi-shimmer 1.4s ease-in-out infinite")}>Abriendo expediente…</span> : null}
        {vm.invDetail && !vm.invBatch ? <Detail vm={vm} /> : null}
      </div>
    </section>
  );
}

/** Aviso flotante del modo «Recibir lote». */
export function BatchBar({ vm }: { vm: VM }) {
  const b = vm.batchBar;
  if (!b) return null;
  return (
    <div data-anim="toast" role="status" style={css("position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:var(--z-toast);display:flex;align-items:center;gap:12px;height:40px;padding:0 6px 0 14px;border-radius:var(--r-pill);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default)")}>
      <span style={css("width:8px;height:8px;border-radius:50%;background:var(--accent);animation:hdi-beat 1.4s ease-in-out infinite")} />
      <span style={css("white-space:nowrap")}>
        Recibiendo lote <strong style={css("font-weight:600")}>«{b.lot}»</strong> · {b.txt}
      </span>
      <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);white-space:nowrap")}>Conecta el siguiente disco</span>
      <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={b.end} style={css(btn2 + ";height:28px;border-radius:var(--r-pill)")}>
        Terminar
      </button>
    </div>
  );
}
