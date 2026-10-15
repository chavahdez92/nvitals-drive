// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';
import { CommandPalette } from './CommandPalette';
import { CompareScreen } from './CompareScreen';
import { ConsoleDrawer } from './ConsoleDrawer';
import { ContextMenu } from './ContextMenu';
import { DeviceDetailScreen } from './DeviceDetailScreen';
import { DevicesScreen } from './DevicesScreen';
import { DialogLayer } from './DialogLayer';
import { HistoryScreen } from './HistoryScreen';
import { BatchBar, InventoryScreen } from './InventoryScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { ReportBuilderScreen } from './ReportBuilderScreen';
import { ReportsScreen } from './ReportsScreen';
import { ScenarioPanel } from './ScenarioPanel';
import { SettingsScreen } from './SettingsScreen';
import { Sidebar } from './Sidebar';
import { ToastStack } from './ToastStack';
import { Toolbar } from './Toolbar';
import { Tooltip } from './Tooltip';

export function AppTemplate({ vm }: { vm: VM }) {
  return (
    <>
      <div data-hdi-root="" data-theme={vm.theme} data-motion={vm.motionAttr} data-transparency={vm.transpAttr} style={css(`position:fixed;inset:0;overflow:auto;color:var(--text-primary);font-family:var(--font-sans);font-size:var(--type-body-size);line-height:var(--type-body-lh);--motion-k:${vm.motionK ?? ''}`)}>
        {vm.wallDark ? (
          <>
            <div aria-hidden="true" style={css("position:fixed;inset:0;background:radial-gradient(60% 70% at 18% 20%, oklch(0.42 0.09 240) 0%, transparent 60%), radial-gradient(50% 60% at 85% 80%, oklch(0.38 0.08 200) 0%, transparent 65%), radial-gradient(40% 50% at 70% 15%, oklch(0.33 0.06 290) 0%, transparent 60%), oklch(0.16 0.02 250)")} />
          </>
        ) : null}
        {vm.wallLight ? (
          <>
            <div aria-hidden="true" style={css("position:fixed;inset:0;background:radial-gradient(60% 70% at 18% 20%, oklch(0.88 0.06 230) 0%, transparent 60%), radial-gradient(50% 60% at 85% 80%, oklch(0.90 0.06 180) 0%, transparent 65%), radial-gradient(40% 50% at 70% 15%, oklch(0.90 0.05 300) 0%, transparent 60%), oklch(0.95 0.01 250)")} />
          </>
        ) : null}
        <div style={css("position:relative;min-height:100%;min-width:1140px;display:grid;place-items:center;padding:20px")}>
          {/* @component Window | states: default */}
          <div data-component="Window" style={css("position:relative;width:min(1512px, calc(100vw - 40px));height:min(982px, calc(100vh - 40px));min-width:1100px;min-height:720px;border-radius:var(--r-window);overflow:hidden;background:var(--mat-window-bg);-webkit-backdrop-filter:var(--mat-window-filter);backdrop-filter:var(--mat-window-filter);box-shadow:var(--shadow-window);display:flex")}>
            {/* @component Sidebar | states: default */}
            <Sidebar vm={vm} />
            <main style={css("flex:1;min-width:0;margin:8px 8px 8px 0;border-radius:var(--r-lg);background:var(--surface-content);box-shadow:var(--shadow-1), 0 0 0 0.5px var(--border-subtle);display:flex;flex-direction:column;overflow:hidden;position:relative")}>
              {/* @component Toolbar | states: default, scrolled */}
              <Toolbar vm={vm} />
              <div data-scroller="" onScroll={vm.onScroll} style={css("flex:1;min-height:0;overflow:auto;position:relative")}>
                {vm.isOnboarding ? <OnboardingScreen vm={vm} /> : null}
                {vm.isDevices ? <DevicesScreen vm={vm} /> : null}
                {vm.isDevice ? <DeviceDetailScreen vm={vm} /> : null}
                {vm.isReports ? <ReportsScreen vm={vm} /> : null}
                {vm.isBuilder ? <ReportBuilderScreen vm={vm} /> : null}
                {vm.isHistory ? <HistoryScreen vm={vm} /> : null}
                {vm.isCompare ? <CompareScreen vm={vm} /> : null}
                {vm.isSettings ? <SettingsScreen vm={vm} /> : null}
                {vm.isInventory ? <InventoryScreen vm={vm} /> : null}
              </div>
              {/* @component ConsoleDrawer | states: open, resizing */}
              {vm.consoleOpen ? (
                <>
                  <ConsoleDrawer vm={vm} />
                </>
              ) : null}
              {/* @component Toast | states: default, hover(paused), swiping */}
              <ToastStack vm={vm} />
              {vm.batchBar ? <BatchBar vm={vm} /> : null}
              <DialogLayer vm={vm} />
              {/* @component CommandPalette | states: open, empty */}
              {vm.palette ? (
                <>
                  <div onClick={vm.closePalette} aria-hidden="true" style={css("position:absolute;inset:0;z-index:var(--z-palette)")} />
                  <CommandPalette vm={vm} />
                </>
              ) : null}
            </main>
          </div>
        </div>
        {/* @component ContextMenu | states: open */}
        {vm.hasCtx ? (
          <>
            <ContextMenu vm={vm} />
          </>
        ) : null}
        {/* @component Tooltip | states: delayed, instant */}
        {vm.hasTip ? (
          <>
            <Tooltip vm={vm} />
          </>
        ) : null}
        {vm.showScenarios ? <ScenarioPanel vm={vm} /> : null}
      </div>
    </>
  );
}
