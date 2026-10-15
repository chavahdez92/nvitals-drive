/**
 * Exportación de reportes (plan §9.2): JSON versionado, HTML autocontenido (la misma
 * plantilla del prototipo, con estilos y sprite en línea) y PDF (impresión nativa de
 * WebKit desde el núcleo). Todos llevan el SHA-256 de los datos crudos de smartctl.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderToStaticMarkup } from 'react-dom/server';
import { invoke } from '@tauri-apps/api/core';
import tokensCss from '../design-system/tokens.css?raw';
import reportCss from './report.css?raw';
import reportProCss from './report-pro.css?raw';
import reportQuickCss from './report-quick.css?raw';
import reportBatchCss from './report-batch.css?raw';
import sprite from '../design-system/icons.svg?raw';
import docPageJs from './vendor/doc-page.js?raw';
import appIcon from '../design-system/app-icon.svg?raw';
import brandLogo from '../design-system/nvitals-logo.svg?raw';
import { ProReport } from './ProReport';
import { QuickReport } from './QuickReport';
import { ReportController } from './ReportController';
import { writeReportSource } from './source';
import { api } from '../services/backend';

export const reportPayload = { write: writeReportSource };

export interface ReportParams {
  disk: string;
  paper: 'letter' | 'a4';
  s: string[];
  tech: string;
  client: string;
  notes: string;
  mask: boolean;
  id: string;
  /** Completo (2–4 hojas), rápido (1 hoja) o rápido de varios discos (tabla). */
  kind?: 'full' | 'quick' | 'batch';
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash de la plantilla: parámetros por hash, como en el prototipo. */
export function reportHash(p: ReportParams): string {
  const q = new URLSearchParams({ disk: p.disk, paper: p.paper, s: p.s.join(','), tech: p.tech, client: p.client, notes: p.notes, mask: p.mask ? '1' : '0', id: p.id, kind: p.kind === 'quick' || p.kind === 'batch' ? p.kind : 'full' });
  return q.toString();
}

/** Estilos generados en tiempo de ejecución para :hover/:active (utilidad pc()). */
function pseudoRules(): string {
  const el = document.querySelector('style[data-hdi-pseudo]') as HTMLStyleElement | null;
  return el?.sheet ? [...el.sheet.cssRules].map((r) => r.cssText).join('\n') : '';
}

/** Documento HTML autocontenido del reporte. */
export function renderReportHtml(params: ReportParams, sha: string): string {
  const vm = ReportController.vmFor(params, sha);
  // Autocontenido: el ícono va como data URI y el script se escapa para no cerrar <script>.
  const iconUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(appIcon);
  const logoUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(brandLogo);
  const body = renderToStaticMarkup(params.kind === 'quick' ? <QuickReport vm={vm} /> : <ProReport vm={vm} />).replaceAll('src="assets/app-icon.svg"', `src="${iconUri}"`).replaceAll('src="assets/nvitals-logo.svg"', `src="${logoUri}"`);
  const script = docPageJs.replace(/<\/(script)/gi, '<\\/$1');
  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reporte ${params.id} — NVitals Drive</title>
<style>${tokensCss}
${reportCss}
${reportProCss}
${reportQuickCss}
${reportBatchCss}
${pseudoRules()}</style>
</head>
<body>
${sprite}
${body}
<script>${script}</script>
</body>
</html>`;
}

export async function exportReport(opts: {
  format: 'PDF' | 'HTML' | 'JSON';
  params: ReportParams;
  source: any;
  disk: any;
  raw: any;
  fileBase: string;
}): Promise<{ path: string; sha256: string } | null> {
  const sha256 = await sha256Hex(JSON.stringify(opts.raw ?? opts.disk));
  writeReportSource({ ...opts.source, sha256 });
  const safe = opts.fileBase.replace(/[/:\\]/g, '-');
  let path: string | null = null;
  if (opts.format === 'JSON') {
    const doc = {
      schema: 'hdi-report/1',
      id: opts.params.id,
      generatedAt: new Date().toISOString(),
      app: { name: 'NVitals Drive', version: opts.source.appVersion },
      parameters: { kind: opts.params.kind || 'full', technician: opts.params.tech, reference: opts.params.client, notes: opts.params.notes, sections: opts.params.s },
      verdict: opts.disk.verdict,
      sentence: opts.disk.sentence,
      disk: opts.params.mask ? { ...opts.disk, serial: maskSerial(opts.disk.serial) } : opts.disk,
      smartctl: opts.raw,
      commands: opts.source.cmds,
      sha256,
    };
    path = await api.saveTextFile(safe + '.json', 'json', JSON.stringify(doc, null, 2));
  } else if (opts.format === 'HTML') {
    path = await api.saveTextFile(safe + '.html', 'html', renderReportHtml(opts.params, sha256));
  } else {
    path = await invoke<string | null>('export_pdf', { fileName: safe + '.pdf', hash: reportHash(opts.params), paper: opts.params.paper });
  }
  return path ? { path, sha256 } : null;
}

export function maskSerial(serial: string): string {
  return serial ? serial.slice(0, 6) + '•'.repeat(Math.max(4, serial.length - 6)) : '';
}
