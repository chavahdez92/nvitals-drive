// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function OverviewTab({ vm }: { vm: VM }) {
  return (
    <>
      <div style={css("display:flex;flex-direction:column;gap:24px")}>
        <div style={css("display:flex;gap:32px;align-items:center;padding:24px 28px;border-radius:var(--r-2xl);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);position:relative")}>
          <div data-component="LifeRing" data-variant="L" style={css("position:relative;width:176px;height:176px;flex:none")}>
            <svg width="176" height="176" viewBox="0 0 176 176" style={css("transform:rotate(-90deg);display:block")}>
              <circle cx="88" cy="88" r="82" fill="none" style={css("stroke:var(--ring-track);stroke-width:12")} />
              <circle cx="88" cy="88" r="82" fill="none" style={css(`stroke:${vm.d?.vSolid ?? ''};stroke-width:12;stroke-linecap:round;stroke-dasharray:${vm.d?.ringL?.c ?? ''};stroke-dashoffset:${vm.d?.ringL?.off ?? ''}`)} />
            </svg>
            <div style={css("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px")}>
              <span style={css("font-family:var(--font-display);font-size:44px;line-height:48px;font-weight:700;letter-spacing:-0.03em")}>
                {vm.d?.lifeNum}
                <span style={css("font-size:20px;font-weight:600;color:var(--text-secondary);margin-left:2px")}>
                  {vm.d?.pctSign}
                </span>
              </span>
              <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                {vm.d?.lifeCaption}
              </span>
            </div>
          </div>
          <div style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;align-items:flex-start")}>
            <span data-component="HealthBadge" data-variant="lg" style={css(`display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 11px 0 8px;border-radius:var(--r-pill);background:${vm.d?.vBg ?? ''};color:${vm.d?.vFg ?? ''};box-shadow:inset 0 0 0 0.5px ${vm.d?.vBorder ?? ''};font-size:var(--type-body-size);font-weight:600`)}>
              <svg width="15" height="15">
                <use href={vm.d?.vIcon} />
              </svg>
              {vm.d?.vLabel}
            </span>
            <p style={css("margin:0;font-size:var(--type-title2-size);line-height:26px;font-weight:500;letter-spacing:-0.01em;text-wrap:pretty;max-width:680px")}>
              {vm.d?.sentence}
            </p>
            <div style={css("display:flex;align-items:center;gap:14px;flex-wrap:wrap;position:relative")}>
              <button className={cx(pc("hover", "color:var(--accent-hover)"))} data-popover-trigger="" onClick={vm.toggleRules} aria-haspopup="dialog" style={css("display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:var(--accent-fg);font-weight:500")}>
                <svg width="14" height="14">
                  <use href="#i-help" />
                </svg>
                ¿Cómo se determina?
              </button>
              {vm.d?.hasSince ? (
                <>
                  <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                    {vm.d?.since}
                  </span>
                </>
              ) : null}
              {vm.rulesOpen ? (
                <>
                  {/* @component Popover | states: default */}
                  <div data-popover="" data-component="Popover" role="dialog" aria-label="Cómo se determina el veredicto" data-anim="pop" style={css("position:absolute;top:26px;left:-8px;width:460px;padding:14px;border-radius:var(--r-lg);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);transform-origin:top left;z-index:var(--z-popover);display:flex;flex-direction:column;gap:10px")}>
                    <strong style={css("font-weight:600")}>
                      Cómo se determina el veredicto
                    </strong>
                    {(vm.rules || []).map((ru: any, i1: number) => (
                      <Fragment key={i1}>
                        <div style={css(`display:flex;gap:10px;align-items:flex-start;padding:6px;border-radius:var(--r-sm);background:${ru?.cur ?? ''}`)}>
                          <span style={css(`flex:none;width:86px;display:inline-flex;align-items:center;gap:4px;color:${ru?.vFg ?? ''};font-size:var(--type-callout-size);font-weight:600`)}>
                            <svg width="13" height="13">
                              <use href={ru?.vIcon} />
                            </svg>
                            {ru?.vLabel}
                          </span>
                          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);text-wrap:pretty")}>
                            {ru?.txt}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);text-wrap:pretty")}>
                      El anillo muestra la vida útil restante (100 − «Percentage Used»). Los apagados inseguros, las entradas del log de errores y el tiempo histórico sobre la temperatura de advertencia son notas informativas y no cambian el veredicto.
                    </span>
                  </div>
                </>
              ) : null}
            </div>
            {vm.d?.hasData ? (
              <>
                <div style={css("display:flex;gap:8px;flex-wrap:wrap;padding-top:4px")}>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.quickScan} disabled={vm.bootDisk} data-tip={vm.d?.id} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                    <svg width="14" height="14">
                      <use href="#i-sample" />
                    </svg>
                    Iniciar escaneo rápido
                  </button>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.goTemp} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                    <svg width="14" height="14">
                      <use href="#i-thermometer" />
                    </svg>
                    Monitorear temperatura
                  </button>
                  <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.report} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                    <svg width="14" height="14">
                      <use href="#i-report" />
                    </svg>
                    Generar reporte
                  </button>
                  {vm.invAction ? (
                    <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.invAction.run} style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                      <svg width="14" height="14">
                        <use href={vm.invAction.icon} />
                      </svg>
                      {vm.invAction.label}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
            {vm.d?.nodata ? (
              <>
                <div style={css("display:flex;flex-direction:column;gap:10px;width:100%")}>
                  <button className={cx(pc("active", "transform:scale(0.97)"))} onClick={vm.toggleAlts} style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600")}>
                    Ver alternativas
                  </button>
                  {vm.invAction ? (
                    <button className={cx(pc("hover", "background:var(--surface-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.invAction.run} style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised-2);box-shadow:inset 0 0 0 0.5px var(--border-default);font-weight:500")}>
                      <svg width="14" height="14">
                        <use href={vm.invAction.icon} />
                      </svg>
                      {vm.invAction.label}
                    </button>
                  ) : null}
                  {vm.alts ? (
                    <>
                      <div data-anim="rise" style={css("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%")}>
                        <div style={css("padding:12px;border-radius:var(--r-lg);background:var(--surface-sunken);display:flex;flex-direction:column;gap:4px")}>
                          <svg width="16" height="16" style={css("color:var(--accent-fg)")}>
                            <use href="#i-thunderbolt" />
                          </svg>
                          <strong style={css("font-weight:600")}>
                            Gabinete Thunderbolt o USB4
                          </strong>
                          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                            Con túnel PCIe (p. ej. ASMedia ASM2464PD) el SSD aparece como NVMe nativo con SMART completo.
                          </span>
                        </div>
                        <div style={css("padding:12px;border-radius:var(--r-lg);background:var(--surface-sunken);display:flex;flex-direction:column;gap:4px")}>
                          <svg width="16" height="16" style={css("color:var(--accent-fg)")}>
                            <use href="#i-terminal" />
                          </svg>
                          <strong style={css("font-weight:600")}>
                            Linux con smartmontools
                          </strong>
                          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                            {"En Linux, algunos puentes USB sí transmiten SMART con "}
                            <code style={css("font-family:var(--font-mono)")}>
                              -d sntrealtek
                            </code>
                            .
                          </span>
                        </div>
                        <div style={css("padding:12px;border-radius:var(--r-lg);background:var(--surface-sunken);display:flex;flex-direction:column;gap:4px")}>
                          <svg width="16" height="16" style={css("color:var(--accent-fg)")}>
                            <use href="#i-scan" />
                          </svg>
                          <strong style={css("font-weight:600")}>
                            Escaneo de lectura
                          </strong>
                          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                            Funciona por USB: detecta zonas ilegibles y mide la velocidad aunque no haya SMART.
                          </span>
                          <button onClick={vm.goTests} style={css("align-self:flex-start;margin-top:4px;padding:0;border:0;background:transparent;color:var(--accent-fg);font-weight:500")}>
                            Ir a Pruebas
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
        {vm.d?.hasData ? (
          <>
            <div style={css("display:flex;flex-direction:column;gap:24px")}>
              {vm.hasAlerts ? (
                <>
                  <div style={css("display:flex;flex-direction:column;gap:8px")}>
                    <h2 style={css("margin:0;font-size:var(--type-title3-size);font-weight:600")}>
                      Alertas y notas
                    </h2>
                    {(vm.alerts || []).map((al: any, i1: number) => (
                      <Fragment key={i1}>
                        <div role="note" style={css(`display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--r-lg);background:${al?.vBg ?? ''};box-shadow:inset 0 0 0 0.5px ${al?.vBorder ?? ''}`)}>
                          <svg width="16" height="16" style={css(`flex:none;margin-top:1px;color:${al?.vFg ?? ''}`)}>
                            <use href={al?.icon} />
                          </svg>
                          <div style={css("flex:1;display:flex;flex-direction:column;gap:2px")}>
                            <strong style={css(`font-weight:600;color:${al?.vFg ?? ''}`)}>
                              {al?.title}
                            </strong>
                            <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary);text-wrap:pretty")}>
                              {al?.body}
                            </span>
                          </div>
                          {al?.action ? (
                            <>
                              <span style={css(`flex:none;align-self:center;font-size:var(--type-callout-size);font-weight:600;color:${al?.vFg ?? ''}`)}>
                                {al?.action}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              <div style={css("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px")}>
                {(vm.tiles || []).map((ti: any, i1: number) => (
                  <Fragment key={i1}>
                    {/* @component StatTile | variants: default, meter, sparkline | states: ok, note, warning, critical */}
                    <div data-component="StatTile" data-state={ti?.stLabel} style={css(`grid-column:${ti?.span ?? ''};display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle)`)}>
                      <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                        <span style={css("display:flex;align-items:center;gap:6px;font-size:var(--type-callout-size);color:var(--text-secondary)")}>
                          <svg width="14" height="14">
                            <use href={ti?.icon} />
                          </svg>
                          {ti?.label}
                        </span>
                        {ti?.showSt ? (
                          <>
                            <span style={css(`display:inline-flex;align-items:center;gap:4px;color:${ti?.stFg ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                              <svg width="12" height="12">
                                <use href={ti?.stIcon} />
                              </svg>
                              {ti?.stLabel}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:12px")}>
                        <span data-flash="" style={css("border-radius:4px;font-size:var(--type-metric-size);line-height:var(--type-metric-lh);font-weight:var(--type-metric-weight);letter-spacing:var(--type-metric-track)")}>
                          {ti?.value}
                          <span style={css("font-size:var(--type-body-size);font-weight:500;color:var(--text-secondary);margin-left:3px")}>
                            {ti?.unit}
                          </span>
                        </span>
                        {ti?.hasSpark ? (
                          <>
                            <svg width="180" height="28" viewBox="0 0 180 28" aria-hidden="true" style={css("overflow:visible;flex:none")}>
                              <path d={ti?.spark} fill="none" style={css("stroke:var(--data-temp);stroke-width:1.5;stroke-linejoin:round")} />
                            </svg>
                          </>
                        ) : null}
                      </div>
                      {ti?.meter ? (
                        <>
                          {/* @component Meter | variants: life, spare | states: ok, warning, critical */}
                          <div data-component="Meter" style={css("position:relative;height:5px;border-radius:3px;background:var(--ring-track)")}>
                            <div style={css(`height:100%;width:${ti?.mPct ?? ''};border-radius:3px;background:${ti?.mFill ?? ''}`)} />
                            <span aria-hidden="true" style={css(`display:${ti?.mTh ?? ''};position:absolute;top:-3px;left:${ti?.mThLeft ?? ''};width:2px;height:11px;border-radius:1px;background:var(--text-primary)`)} />
                          </div>
                        </>
                      ) : null}
                      <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                        {ti?.ctx}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
