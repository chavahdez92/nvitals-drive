/**
 * Reporte rápido de varios discos (desviación #21): resumen del grupo y una fila por
 * expediente con lo más relevante de su salud, tomado de su última revisión guardada.
 * Paginación explícita de <doc-page>: las filas tienen alto fijo y se reparten con
 * src/domain/batchReport.ts. Usa el view-model de ReportController.batchVals().
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react';
import type { VM } from '../ui/vm';

const TONE_ICON: Record<string, string> = { warn: '#i-alert', crit: '#i-octagon' };
const discos = (n: number) => `${n.toLocaleString('es-MX')} ${n === 1 ? 'disco' : 'discos'}`;

function Icon({ id, size = 12 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={id} />
    </svg>
  );
}

/** Valor con ícono cuando no es normal: el estado se lee también en blanco y negro. */
function Val({ v, k }: { v: string; k: string }) {
  return (
    <b className={'rb-val ' + k}>
      {TONE_ICON[k] ? <Icon id={TONE_ICON[k]} size={10} /> : null}
      {v}
    </b>
  );
}

function FirstHeader({ vm }: { vm: VM }) {
  return (
    <>
      <div className="rq-head">
        <div className="rq-head__id rq-head__id--logo">
          <img className="rp-logo" src="assets/nvitals-logo.svg" alt="NVitals Drive" />
          <span>{vm.company || 'Diagnóstico de salud de SSD'}</span>
        </div>
        <div className="rq-head__doc">
          <span className="rq-tag">
            <Icon id="#i-bolt" size={11} />
            Reporte rápido · {discos(vm.sum.total)}
          </span>
          <strong className="mono">{vm.rid}</strong>
          <span>
            {vm.date}
            {vm.tech ? ` · ${vm.tech}` : ''}
          </span>
        </div>
      </div>
      <div className="rp-rule" />
      <div className="rq-title">
        <h1>{vm.title}</h1>
        <p>{[discos(vm.sum.total), vm.sum.capTxt + ' en total', vm.sum.rangeTxt].filter(Boolean).join(' · ')}</p>
      </div>
    </>
  );
}

function Summary({ vm }: { vm: VM }) {
  const s = vm.sum;
  return (
    <div className="rb-sum">
      <div className="rb-tiles">
        {s.tiles.map((t: any) => (
          <div key={t.key} className={'rb-tile ' + (t.count ? t.key : 'zero')}>
            <span className="rb-tile__top">
              <Icon id={t.icon} size={12} />
              {t.label}
            </span>
            <b>{t.count}</b>
            <small>{t.count ? Math.round(t.pct) + ' % del grupo' : 'ninguno'}</small>
          </div>
        ))}
      </div>
      <div className="rb-bar" aria-hidden="true">
        {s.tiles.filter((t: any) => t.count).map((t: any) => (
          <span key={t.key} className={t.key} style={{ flexGrow: t.count }} />
        ))}
      </div>
      <div className="rb-facts">
        <span>
          Vida útil promedio <b>{s.avgLife == null ? '—' : s.avgLife + ' %'}</b>
        </span>
        {s.minLife ? (
          <span>
            Mínima <b>{s.minLife.life} %</b> <i className="mono">{s.minLife.serial}</i>
          </span>
        ) : null}
        <span>
          Con errores de medios <b>{s.withMedia}</b>
        </span>
        <span>
          SMART fallido <b>{s.smartFailed}</b>
        </span>
      </div>
      <p className="rb-cap">Datos de la última revisión guardada de cada expediente. Veredicto por reglas a partir de SMART; vida útil = 100 − «Percentage Used».</p>
    </div>
  );
}

function Attention({ vm }: { vm: VM }) {
  if (!vm.att.length) return null;
  const n = vm.sum.attention.length;
  return (
    <div className="rb-att">
      <div className="rb-att__h">
        <Icon id="#i-alert" size={13} />
        Requieren atención · {discos(n)}
      </div>
      <ul>
        {vm.att.map((a: any) => (
          <li key={a.serial}>
            <span className={'rb-att__v ' + a.verdict}>
              <Icon id={a.vIcon} size={11} />
              {a.vLabel}
            </span>
            <b>{a.model}</b>
            <i className="mono">{a.serial}</i>
            <span className="rb-att__r">{a.reasons.join(', ')}</span>
          </li>
        ))}
        {vm.attMore ? <li className="rb-att__more">+{vm.attMore} más en la tabla</li> : null}
      </ul>
    </div>
  );
}

function Table({ vm, rows }: { vm: VM; rows: any[] }) {
  return (
    <div className="rb-table" role="table" aria-label="Discos">
      <div className="rb-row rb-row--h" role="row">
        <span role="columnheader">#</span>
        <span role="columnheader">Disco</span>
        <span role="columnheader">Salud</span>
        <span role="columnheader">Vida útil</span>
        <span role="columnheader">Repuesto</span>
        <span role="columnheader">Errores de medios</span>
        <span role="columnheader">Uso</span>
        <span role="columnheader">Revisión</span>
      </div>
      {rows.map((r: any) => (
        <div key={r.serial} className={'rb-row ' + r.verdict} role="row">
          <span className="rb-n" role="cell">{r.n}</span>
          <span role="cell">
            <b>{r.model}</b>
            <small>
              <i className="mono">{r.serial}</i> · {r.cap}
            </small>
            {vm.extra ? <small className="rb-x">{r.extra}</small> : null}
          </span>
          <span role="cell">
            <em className={'rb-pill ' + r.verdict}>
              <Icon id={r.vIcon} size={10} />
              {r.vLabel}
            </em>
            <small className={r.smartK === 'crit' ? 'rb-bad' : undefined}>{r.smartTxt}</small>
          </span>
          <span role="cell">
            <b>{r.lifeTxt}</b>
            {r.nd ? null : (
              <i className="rb-mini">
                <i style={{ width: `${Math.max(0, Math.min(100, r.life))}%` }} />
              </i>
            )}
          </span>
          <span role="cell">
            <Val v={r.spareTxt} k={r.spareK} />
            <small>{r.spareSub}</small>
          </span>
          <span role="cell">
            <Val v={r.mediaTxt} k={r.mediaK} />
          </span>
          <span role="cell">
            <b>{r.hoursTxt}</b>
            <small>{r.writtenTxt}</small>
          </span>
          <span role="cell">
            <b className="rb-date">{r.when}</b>
          </span>
        </div>
      ))}
      {rows.length ? null : <p className="rb-empty">No hay discos en este reporte.</p>}
    </div>
  );
}

function RunningHeader({ vm }: { vm: VM }) {
  return (
    <header className="rp-run">
      <span className="rp-run__l">
        <img src="assets/app-icon.svg" alt="" />
        <b>Reporte rápido · {discos(vm.sum.total)}</b>
        <span>· {vm.title}</span>
      </span>
      <span className="mono">{vm.rid}</span>
    </header>
  );
}

function Footer({ vm, page }: { vm: VM; page: number }) {
  return (
    <footer className="rp-foot">
      <span>
        <b>NVitals Drive {vm.appVersion}</b> · smartctl {vm.sc?.version || '—'}
        {vm.company ? ` · ${vm.company}` : ''}
      </span>
      <span className="mono">
        SHA-256 {String(vm.sha || '').slice(0, 12)}… · {vm.rid} · Página {page} de {vm.total}
      </span>
    </footer>
  );
}

export function BatchReport({ vm }: { vm: VM }) {
  // El recuadro «Requieren atención» toma el color del caso más grave.
  const vk = vm.att[0]?.verdict || 'nodata';
  const vars = {
    '--v-solid': `var(--health-${vk}-solid)`,
    '--v-bg': `var(--health-${vk}-bg)`,
    '--v-border': `var(--health-${vk}-border)`,
    '--v-fg': `var(--health-${vk}-fg)`,
  } as CSSProperties;
  return (
    <div className="rp rq rb" data-theme="light" data-component="BatchReport" data-variant={vm.paper} data-extra={vm.extra ? '' : undefined} style={vars}>
      <doc-page size={vm.paper}>
        {vm.pages.map((rows: any[], i: number) => (
          <section className="page" key={i}>
            {i === 0 ? (
              <>
                <FirstHeader vm={vm} />
                <Summary vm={vm} />
                <Attention vm={vm} />
              </>
            ) : (
              <RunningHeader vm={vm} />
            )}
            <Table vm={vm} rows={rows} />
            <Footer vm={vm} page={i + 1} />
          </section>
        ))}
      </doc-page>
    </div>
  );
}
