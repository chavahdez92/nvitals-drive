// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { Fragment } from 'react';
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function CompareScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section data-screen-label="Comparar instantáneas" data-anim="fade" style={css("padding:16px 24px 32px;max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:18px")}>
        <div style={css("display:flex;flex-direction:column;gap:4px")}>
          <h2 style={css("margin:0;font-size:var(--type-title2-size);font-weight:650")}>
            {vm.hSel?.model}
          </h2>
          <span style={css("font-size:var(--type-callout-size);color:var(--text-secondary)")}>
            {"Comparación de instantáneas · "}
            <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size)")}>
              {vm.hSel?.serial}
            </span>
          </span>
        </div>
        <div style={css(`padding:16px 18px;border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);font-size:var(--type-title3-size);font-weight:600;color:${vm.cmpSummaryFg ?? ''}`)}>
          {vm.cmpSummary}
        </div>
        <div style={css("border-radius:var(--r-lg);background:var(--surface-raised);box-shadow:var(--shadow-1), inset 0 0 0 0.5px var(--border-subtle);overflow:hidden")}>
          <div style={css("display:grid;grid-template-columns:minmax(0,1.3fr) 1fr 1fr 1fr;gap:12px;align-items:end;padding:12px 16px;border-bottom:0.5px solid var(--border-subtle)")}>
            <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary)")}>
              Atributo
            </span>
            <span style={css("display:flex;flex-direction:column;gap:2px;text-align:right")}>
              <span style={css("font-size:var(--type-caption-size);font-weight:700;color:var(--accent-fg)")}>
                A
              </span>
              <span style={css("font-weight:600")}>
                {vm.cmpA}
              </span>
            </span>
            <span style={css("display:flex;flex-direction:column;gap:2px;text-align:right")}>
              <span style={css("font-size:var(--type-caption-size);font-weight:700;color:var(--accent-fg)")}>
                B
              </span>
              <span style={css("font-weight:600")}>
                {vm.cmpB}
              </span>
            </span>
            <span style={css("font-size:var(--type-note-size);font-weight:600;color:var(--text-tertiary);text-align:right")}>
              Cambio
            </span>
          </div>
          {(vm.cmpRows || []).map((cr: any, i1: number) => (
            <Fragment key={i1}>
              <div style={css(`display:grid;grid-template-columns:minmax(0,1.3fr) 1fr 1fr 1fr;gap:12px;min-height:38px;align-items:center;padding:0 16px;border-bottom:0.5px solid var(--border-subtle);background:${cr?.bg ?? ''}`)}>
                <span>
                  {cr?.label}
                </span>
                <span style={css("text-align:right;color:var(--text-secondary)")}>
                  {cr?.a}
                </span>
                <span style={css("text-align:right;font-weight:600")}>
                  {cr?.b}
                </span>
                <span style={css(`text-align:right;font-weight:600;color:${cr?.fg ?? ''}`)}>
                  {cr?.delta}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
        <button className={cx(pc("hover", "background:var(--surface-hover)"))} onClick={vm.backHistory} style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:0;border-radius:var(--r-md);background:transparent;color:var(--accent-fg);font-weight:500")}>
          <svg width="14" height="14">
            <use href="#i-chevron-left" />
          </svg>
          Volver al historial
        </button>
      </section>
    </>
  );
}
