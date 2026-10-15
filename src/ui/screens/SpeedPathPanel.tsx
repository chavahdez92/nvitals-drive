// Panel "Qué limita la velocidad": cadena puerto de la Mac → gabinete → SSD.
// No existe en el prototipo (desviación #16); usa sus tokens, radios y tipografía.
import { Fragment } from 'react';
import { css } from '../runtime/styles';

export function SpeedPathPanel({ sp, compact = false }: { sp: any; compact?: boolean }) {
  if (!sp) return null;
  return (
    <div data-component="SpeedPath" style={css("display:flex;flex-direction:column;gap:10px")}>
      {compact ? null : (
        <strong style={css("font-weight:600")}>
          Qué limita la velocidad
        </strong>
      )}
      <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr) 16px minmax(0,1fr);align-items:stretch;gap:6px")}>
        {(sp.hops || []).map((h: any, i: number) => (
          <Fragment key={i}>
            {i && sp.flowing ? (
              <span data-bench-anim="" aria-hidden="true" style={css(`align-self:center;height:3px;border-radius:2px;background-image:repeating-linear-gradient(90deg, ${sp.flowColor} 0 6px, transparent 6px 12px);background-size:24px 3px;animation:hdi-flow 600ms linear infinite`)} />
            ) : i ? (
              <svg width="16" height="16" aria-hidden="true" style={css("align-self:center;color:var(--text-tertiary)")}>
                <use href="#i-chevron-right" />
              </svg>
            ) : null}
            <div style={css(`display:flex;flex-direction:column;gap:3px;min-width:0;padding:10px 12px;border-radius:var(--r-md);background:${h.bg};box-shadow:inset 0 0 0 0.5px ${h.border}`)}>
              <span style={css(`display:flex;align-items:center;gap:6px;font-size:var(--type-note-size);color:${h.fg};font-weight:600`)}>
                <svg width="13" height="13" style={css("flex:none")}>
                  <use href={h.icon} />
                </svg>
                <span style={css("overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{h.title}</span>
              </span>
              <span style={css("font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")} title={h.label}>
                {h.label}
              </span>
              <span style={css("font-size:var(--type-note-size);color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap")} title={h.detail}>
                {h.detail}
              </span>
              <span style={css("display:flex;align-items:center;justify-content:space-between;gap:6px")}>
                <span style={css("font-family:var(--font-mono);font-size:var(--type-note-size);color:var(--text-primary);white-space:nowrap")}>
                  {h.cap}
                </span>
                {h.bn ? (
                  <span style={css(`height:18px;display:inline-flex;align-items:center;padding:0 7px;border-radius:var(--r-pill);background:${h.border};color:${h.fg};font-size:var(--type-caption-size);font-weight:600;white-space:nowrap`)}>
                    Cuello de botella
                  </span>
                ) : null}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      {sp.hasBars && !compact ? (
        <div style={css("display:flex;flex-direction:column;gap:6px;padding-top:2px")}>
          {sp.bars.map((b: any, i: number) => (
            <div key={i} style={css("display:grid;grid-template-columns:170px minmax(0,1fr) 190px;align-items:center;gap:10px;font-size:var(--type-callout-size)")}>
              <span style={css("color:var(--text-secondary)")}>
                {b.label}
              </span>
              <div style={css("height:8px;border-radius:4px;background:var(--ring-track);overflow:hidden")}>
                <div data-bench-anim="" style={css(`height:100%;width:${b.w};border-radius:4px;background:${b.color};transition:width 500ms var(--ease-out)`)} />
              </div>
              <span style={css("display:flex;gap:6px;justify-content:space-between;white-space:nowrap")}>
                <span style={css("font-weight:600")}>
                  {b.val}
                </span>
                <span style={css("color:var(--text-tertiary);font-size:var(--type-note-size)")}>
                  {b.note}
                </span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <span style={css("font-size:var(--type-note-size);color:var(--text-secondary);text-wrap:pretty")}>
        {sp.note}
      </span>
    </div>
  );
}
