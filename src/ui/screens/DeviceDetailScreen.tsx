// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';
import { ConsoleTab } from './ConsoleTab';
import { IdentityTab } from './IdentityTab';
import { LogsTab } from './LogsTab';
import { OverviewTab } from './OverviewTab';
import { SmartTab } from './SmartTab';
import { TemperatureTab } from './TemperatureTab';
import { TestsTab } from './TestsTab';

export function DeviceDetailScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Detalle del dispositivo" style={css("display:flex;flex-direction:column;min-height:100%")}>
        {/* @component DetailHeader | states: default, compact */}
        <div data-component="DetailHeader" style={css(`position:sticky;top:0;z-index:var(--z-sticky);background:${vm.headerBg ?? ''};-webkit-backdrop-filter:${vm.headerFilter ?? ''};backdrop-filter:${vm.headerFilter ?? ''};padding:${vm.headerPad ?? ''} 24px 0`)}>
          <div style={css("display:flex;align-items:center;gap:14px;max-width:1240px;margin:0 auto")}>
            <div data-shared="hdr-ring" style={css("position:relative;width:40px;height:40px;flex:none")}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={css("transform:rotate(-90deg);display:block")}>
                <circle cx="20" cy="20" r="18" fill="none" style={css("stroke:var(--ring-track);stroke-width:4")} />
                <circle cx="20" cy="20" r="18" fill="none" style={css(`stroke:${vm.d?.vSolid ?? ''};stroke-width:4;stroke-linecap:round;stroke-dasharray:${vm.d?.ring?.c ?? ''};stroke-dashoffset:${vm.d?.ring?.off ?? ''}`)} />
              </svg>
              <div style={css("position:absolute;inset:0;display:grid;place-items:center;font-size:11px;font-weight:650")}>
                {vm.d?.lifeNum}
              </div>
            </div>
            <div data-detail-title="" style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:5px")}>
              <div style={css("display:flex;align-items:baseline;gap:10px;min-width:0")}>
                <h1 style={css("margin:0;font-family:var(--font-display);font-size:var(--type-title2-size);line-height:var(--type-title2-lh);font-weight:var(--type-title2-weight);letter-spacing:var(--type-title2-track);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                  {vm.d?.model}
                </h1>
                <span style={css("color:var(--text-secondary);white-space:nowrap")}>
                  {vm.d?.cap}
                </span>
              </div>
              <div style={css(`display:${vm.headerSubDisplay ?? ''};align-items:center;gap:8px;flex-wrap:wrap`)}>
                <span style={css(`display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 5px;border-radius:var(--r-pill);background:${vm.d?.vBg ?? ''};color:${vm.d?.vFg ?? ''};box-shadow:inset 0 0 0 0.5px ${vm.d?.vBorder ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                  <svg width="12" height="12">
                    <use href={vm.d?.vIcon} />
                  </svg>
                  {vm.d?.vLabel}
                </span>
                <span style={css("display:inline-flex;align-items:center;gap:6px;height:20px;padding:0 8px;border-radius:var(--r-sm);background:var(--surface-hover);color:var(--text-secondary);font-size:var(--type-note-size);font-weight:500")}>
                  <svg width="12" height="12">
                    <use href={vm.d?.connIcon} />
                  </svg>
                  {vm.d?.connFull}
                </span>
                {vm.d?.hasData ? (
                  <>
                    <span data-temp-badge={vm.d?.id} data-flash="" data-tip="Temperatura en vivo" style={css(`display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 6px;border-radius:var(--r-sm);background:${vm.d?.tempBg ?? ''};color:${vm.d?.tempFg ?? ''};font-size:var(--type-note-size);font-weight:600`)}>
                      <svg width="12" height="12">
                        <use href="#i-thermometer" />
                      </svg>
                      {vm.d?.temp}
                    </span>
                  </>
                ) : null}
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-tertiary)")}>
                  {vm.d?.id}
                </span>
              </div>
            </div>
            <div style={css("display:flex;align-items:center;gap:6px;position:relative")}>
              <button className={cx(pc("hover", "background:var(--surface-raised-2)"), pc("active", "transform:scale(0.97)"))} onClick={vm.refresh} data-tip="Actualizar  ⌘R" style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);font-weight:500;transition:transform var(--dur-press) var(--ease-out)")}>
                <svg width="14" height="14">
                  <use href="#i-refresh" />
                </svg>
                Actualizar
              </button>
              <button className={cx(pc("hover", "background:var(--accent-hover)"), pc("active", "transform:scale(0.97)"))} onClick={vm.report} data-tip="Generar reporte  ⌘E" style={css("display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:var(--accent);color:var(--text-on-accent);font-weight:600;transition:transform var(--dur-press) var(--ease-out)")}>
                <svg width="14" height="14">
                  <use href="#i-report" />
                </svg>
                Generar reporte
              </button>
              <button className={cx(pc("hover", "background:var(--surface-raised-2)"), pc("active", "transform:scale(0.97)"))} data-popover-trigger="" onClick={vm.toggleMore} aria-label="Más acciones" aria-haspopup="menu" data-tip="Más" style={css("width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:var(--r-md);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-default);transition:transform var(--dur-press) var(--ease-out)")}>
                <svg width="16" height="16">
                  <use href="#i-more" />
                </svg>
              </button>
              {vm.moreOpen ? (
                <>
                  {/* @component Menu | states: default */}
                  <div data-popover="" data-component="Menu" role="menu" data-anim="pop" style={css("position:absolute;top:34px;right:0;min-width:210px;padding:5px;border-radius:var(--r-lg);background:var(--mat-popover-bg);-webkit-backdrop-filter:var(--mat-popover-filter);backdrop-filter:var(--mat-popover-filter);box-shadow:var(--shadow-3), inset 0 0 0 0.5px var(--border-default);transform-origin:top right;z-index:var(--z-popover)")}>
                    {(vm.moreItems || []).map((m: any, i1: number) => (
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
              ) : null}
            </div>
          </div>
          {/* @component Tabs | variants: underline | states: default, active, focus */}
          <div data-component="Tabs" data-tabbar="" role="tablist" aria-label="Secciones del disco" style={css("position:relative;display:flex;gap:2px;max-width:1240px;margin:12px auto 0;border-bottom:0.5px solid var(--border-subtle)")}>
            {(vm.tabs || []).map((t: any, i1: number) => (
              <Fragment key={i1}>
                <button className={cx(pc("hover", "color:var(--text-primary)"))} role="tab" aria-selected={t?.active} data-tab-active={t?.active} onClick={t?.go} data-tip={t?.kbd} style={css(`height:34px;padding:0 12px;border:0;background:transparent;color:${t?.fg ?? ''};font-weight:500;border-radius:var(--r-sm) var(--r-sm) 0 0;transition:color var(--dur-fast) var(--ease-out)`)}>
                  {t?.label}
                </button>
              </Fragment>
            ))}
            <span aria-hidden="true" style={css(`position:absolute;left:0;bottom:-0.5px;width:100px;height:2px;border-radius:1px;background:var(--accent);transform-origin:left;transform:translateX(${vm.tabX ?? ''}px) scaleX(${vm.tabScale ?? ''});transition:${vm.tabTransition ?? ''}`)} />
          </div>
        </div>
        <div data-detail-body="" style={css("flex:1;padding:20px 24px 40px")}>
          <div style={css("max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:20px")}>
            {vm.banner ? (
              <>
                {/* @component Banner | variants: info, success, warning, critical */}
                <div data-component="Banner" data-variant="warning" role="status" data-anim="rise" style={css("display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--r-lg);background:var(--health-warning-bg);box-shadow:inset 0 0 0 0.5px var(--health-warning-border)")}>
                  <svg width="16" height="16" style={css("flex:none;color:var(--health-warning-fg)")}>
                    <use href="#i-plug" />
                  </svg>
                  <span style={css("flex:1")}>
                    <strong style={css("font-weight:600")}>
                      El disco se desconectó
                    </strong>
                    {" · mostrando los últimos datos leídos"}
                  </span>
                </div>
              </>
            ) : null}
            <div data-tab-panel="" role="tabpanel">
              {vm.noSmartTab ? (
                <>
                  <div data-component="EmptyState" style={css("display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:64px 20px")}>
                    <svg width="32" height="32" style={css("color:var(--text-tertiary)")}>
                      <use href="#i-circle-dashed" />
                    </svg>
                    <strong style={css("font-size:var(--type-title3-size);font-weight:600")}>
                      SMART no disponible por USB
                    </strong>
                    <p style={css("margin:0;max-width:440px;color:var(--text-secondary);text-wrap:pretty")}>
                      {vm.d?.reason}
                      {" Esta sección necesita datos SMART. Conecta el disco con un gabinete Thunderbolt o USB4 para verla."}
                    </p>
                  </div>
                </>
              ) : null}
              {vm.isOverview ? <OverviewTab vm={vm} /> : null}
              {vm.isSmart ? <SmartTab vm={vm} /> : null}
              {vm.isTemp ? <TemperatureTab vm={vm} /> : null}
              {vm.isTests ? <TestsTab vm={vm} /> : null}
              {vm.isLogs ? <LogsTab vm={vm} /> : null}
              {vm.isIdentity ? <IdentityTab vm={vm} /> : null}
              {vm.isConsole ? <ConsoleTab vm={vm} /> : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
