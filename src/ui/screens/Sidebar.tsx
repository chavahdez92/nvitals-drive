// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function Sidebar({ vm }: { vm: VM }) {
  return (
    <>
      <nav className={"hdi-sidebar"} data-component="Sidebar" aria-label="Barra lateral" style={css("width:var(--size-sidebar);flex:none;display:flex;flex-direction:column;min-height:0")}>
        <div style={css("height:var(--size-titlebar);flex:none;display:flex;align-items:center;gap:8px;padding-left:20px")} aria-hidden="true">
          <span style={css("width:12px;height:12px;border-radius:50%;background:var(--tl-close);box-shadow:inset 0 0 0 0.5px var(--tl-border)")} />
          <span style={css("width:12px;height:12px;border-radius:50%;background:var(--tl-min);box-shadow:inset 0 0 0 0.5px var(--tl-border)")} />
          <span style={css("width:12px;height:12px;border-radius:50%;background:var(--tl-zoom);box-shadow:inset 0 0 0 0.5px var(--tl-border)")} />
        </div>
        <div style={css("flex:1;min-height:0;overflow:auto;padding:4px 10px 10px;display:flex;flex-direction:column;gap:18px")}>
          <div style={css("display:flex;flex-direction:column;gap:1px")}>
            <button className={cx(pc("hover", "color:var(--text-secondary)"))} onClick={vm.goDevices} style={css("display:flex;align-items:center;justify-content:space-between;height:24px;padding:0 10px;border:0;background:transparent;color:var(--text-tertiary);font-size:var(--type-note-size);font-weight:600;letter-spacing:0.01em;border-radius:var(--r-sm)")}>
              <span>
                Dispositivos
              </span>
              <span style={css("font-weight:500")}>
                {vm.sideCount}
              </span>
            </button>
            {(vm.sideDisks || []).map((s: any, i1: number) => (
              <Fragment key={i1}>
                {/* @component SidebarDeviceItem | states: default, selected, testing, disconnected */}
                <button className={cx("hdi-side-item", pc("hover", "background:var(--surface-hover)"))} data-component="SidebarDeviceItem" data-state={s?.state} data-side-id={s?.id} aria-label={s?.aria} aria-current={s?.current} onClick={s?.open} onContextMenu={s?.ctx} style={css(`display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:0;border-radius:var(--r-md);background:${s?.bg ?? ''};color:var(--text-primary);text-align:left;opacity:${s?.opacity ?? ''};transition:background-color var(--dur-fast) var(--ease-out), opacity var(--dur-moderate) var(--ease-out)`)}>
                  <svg width="14" height="14" style={css(`flex:none;color:${s?.fg ?? ''}`)} aria-hidden="true">
                    <use href={s?.icon} />
                  </svg>
                  <span style={css("flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:var(--type-body-size)")}>
                    {s?.name}
                  </span>
                  {s?.testing ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" style={css("flex:none;transform:rotate(-90deg)")} aria-hidden="true">
                        <circle cx="7" cy="7" r="5.5" fill="none" style={css("stroke:var(--ring-track);stroke-width:2")} />
                        <circle cx="7" cy="7" r="5.5" fill="none" style={css(`stroke:var(--accent);stroke-width:2;stroke-dasharray:34.56;stroke-dashoffset:${s?.testOff ?? ''};transition:stroke-dashoffset 250ms linear`)} />
                      </svg>
                    </>
                  ) : null}
                  <span style={css(`flex:none;font-size:var(--type-callout-size);color:${s?.tempFg ?? ''}`)}>
                    {s?.temp}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div style={css("display:flex;flex-direction:column;gap:1px")}>
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.goReports} aria-current={vm.navReportsCur} style={css(`display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:0;border-radius:var(--r-md);background:${vm.navReportsBg ?? ''};text-align:left`)}>
              <svg width="15" height="15" style={css("color:var(--accent-fg)")} aria-hidden="true">
                <use href="#i-report" />
              </svg>
              <span>
                Reportes
              </span>
            </button>
            <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.goHistory} aria-current={vm.navHistoryCur} style={css(`display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:0;border-radius:var(--r-md);background:${vm.navHistoryBg ?? ''};text-align:left`)}>
              <svg width="15" height="15" style={css("color:var(--accent-fg)")} aria-hidden="true">
                <use href="#i-history" />
              </svg>
              <span>
                Historial
              </span>
            </button>
            {vm.navInventory ? (
              <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.goInventory} aria-current={vm.navInventoryCur} style={css(`display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:0;border-radius:var(--r-md);background:${vm.navInventoryBg ?? ''};text-align:left`)}>
                <svg width="15" height="15" style={css("color:var(--accent-fg)")} aria-hidden="true">
                  <use href="#i-folder" />
                </svg>
                <span style={css("flex:1")}>
                  Expedientes
                </span>
                {vm.navInventoryCount ? (
                  <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary);font-variant-numeric:tabular-nums")}>
                    {vm.navInventoryCount}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </div>
        <div style={css("flex:none;padding:8px 10px 12px;display:flex;flex-direction:column;gap:2px")}>
          <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.goSettings} style={css(`display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;border:0;border-radius:var(--r-md);background:${vm.navSettingsBg ?? ''};text-align:left`)}>
            <svg width="15" height="15" style={css("color:var(--text-secondary)")} aria-hidden="true">
              <use href="#i-settings" />
            </svg>
            <span style={css("flex:1")}>
              Ajustes
            </span>
            <span style={css("font-size:var(--type-note-size);color:var(--text-tertiary)")}>
              ⌘,
            </span>
          </button>
          <div data-tip={vm.smartctlTip} style={css("display:flex;align-items:center;gap:8px;height:24px;padding:0 10px;font-size:var(--type-note-size);color:var(--text-tertiary)")}>
            <span style={css(`width:6px;height:6px;border-radius:50%;background:${vm.smartctlDot ?? ''}`)} />
            <span style={css("font-family:var(--font-mono)")}>
              {vm.smartctlStatus}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
