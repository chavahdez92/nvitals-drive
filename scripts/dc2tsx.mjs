#!/usr/bin/env node
/**
 * dc2tsx — traduce la plantilla del prototipo (Design Component de
 * prototype-design/HealthDiskInfo.dc.html) a componentes TSX.
 *
 * Replica la semántica del runtime del prototipo (prototype-design/support.js):
 *   {{ ruta }}        → valor del view-model (vm) o de la variable de un <sc-for>
 *   <sc-if value>     → render condicional por truthiness
 *   <sc-for list as>  → .map() con la variable de iteración
 *   style="…"         → objeto de estilo (css())
 *   style-hover/…     → clase con pseudo-clase (pc()), igual que el runtime
 *
 * La salida se divide en un componente por pantalla/pestaña/capa usando los
 * comentarios delimitadores de la plantilla. Uso: pnpm convert:design
 * Es una herramienta de traducción: el TSX generado es código fuente del proyecto.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'htmlparser2';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Documentos del prototipo que se traducen. */
const JOBS = [
  { src: 'HealthDiskInfo.dc.html', out: join('src', 'ui', 'screens'), root: 'AppTemplate', split: true, runtime: '../runtime/styles', vm: '../vm' },
  { src: 'Report Template.dc.html', out: join('src', 'report'), root: 'ReportTemplate', split: false, runtime: '../ui/runtime/styles', vm: '../ui/vm' },
];

/** Comentario delimitador → componente (el siguiente elemento hermano). */
const SPLIT_BY_COMMENT = [
  [/#\/onboarding/, 'OnboardingScreen'],
  [/#\/devices/, 'DevicesScreen'],
  [/#\/device\/:id/, 'DeviceDetailScreen'],
  [/a\) Resumen/, 'OverviewTab'],
  [/b\) Salud SMART/, 'SmartTab'],
  [/c\) Temperatura/, 'TemperatureTab'],
  [/d\) Pruebas/, 'TestsTab'],
  [/e\) Registros/, 'LogsTab'],
  [/f\) Identidad/, 'IdentityTab'],
  [/g\) Consola/, 'ConsoleTab'],
  [/#\/reports\/new/, 'ReportBuilderScreen'],
  [/#\/reports ═/, 'ReportsScreen'],
  [/#\/history\/compare/, 'CompareScreen'],
  [/#\/history ═/, 'HistoryScreen'],
  [/#\/settings/, 'SettingsScreen'],
  [/@component Toast \|/, 'ToastStack'],
  [/Dialog layer/, 'DialogLayer', 'group'],
  [/Scenario panel/, 'ScenarioPanel', 'group'],
];
/** data-component → componente (solo fuera de <sc-for>). */
const SPLIT_BY_COMPONENT = {
  Sidebar: 'Sidebar',
  Toolbar: 'Toolbar',
  ConsoleDrawer: 'ConsoleDrawer',
  CommandPalette: 'CommandPalette',
  ContextMenu: 'ContextMenu',
  Tooltip: 'Tooltip',
};

const VOID = new Set(['input', 'img', 'meta', 'link', 'br', 'hr', 'source']);
const ATTR_RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete',
  spellcheck: 'spellCheck', autofocus: 'autoFocus', 'clip-path': 'clipPath',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset',
  'text-anchor': 'textAnchor', 'dominant-baseline': 'dominantBaseline', 'fill-rule': 'fillRule',
  'clip-rule': 'clipRule', 'stop-color': 'stopColor', 'font-size': 'fontSize', 'font-weight': 'fontWeight',
};
const EVENT_RE = /^on[a-z]/i;

/** Componentes generados: nombre → { body, uses:Set } */
let components = new Map();
let JOB = null;

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const ident = (name) => (name === 'vm' ? 'vm_' : name);

function pathExpr(path, scope) {
  const parts = path.trim().split('.');
  const head = parts[0];
  const base = scope.includes(head) ? ident(head) : 'vm.' + head;
  return parts.length === 1 ? base : base + parts.slice(1).map((p) => '?.' + p).join('');
}

/** Valor de atributo → expresión JS (o literal). */
function attrValue(raw, scope, { asString = false } = {}) {
  const whole = raw.match(/^\s*\{\{([^{}]+?)\}\}\s*$/);
  if (whole) return { expr: pathExpr(whole[1], scope) };
  if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    const lit = parts.map((p, i) => (i & 1 ? '${' + pathExpr(p, scope) + " ?? ''}" : esc(p))).join('');
    return { expr: '`' + lit + '`' };
  }
  return asString ? { expr: JSON.stringify(raw) } : { literal: raw };
}

function renderAttrs(el, scope) {
  const out = [];
  const pseudo = [];
  let className = null;
  for (const [name, raw] of Object.entries(el.attribs)) {
    if (name.startsWith('hint-')) continue;
    if (name.startsWith('style-')) {
      const v = attrValue(raw, scope, { asString: true });
      pseudo.push(`pc(${JSON.stringify(name.slice(6))}, ${v.expr})`);
      continue;
    }
    if (name === 'style') {
      const v = attrValue(raw, scope, { asString: true });
      out.push(`style={css(${v.expr})}`);
      continue;
    }
    if (name === 'class') {
      className = attrValue(raw, scope, { asString: true }).expr;
      continue;
    }
    let key = ATTR_RENAME[name] || name;
    if (EVENT_RE.test(name) && !name.includes('-')) {
      key = 'on' + name[2].toUpperCase() + name.slice(3);
      // React: los campos controlados usan onChange (dispara en cada tecla, como onInput).
      if (key === 'onInput' && (el.name === 'input' || el.name === 'textarea')) key = 'onChange';
    }
    const v = attrValue(raw, scope);
    if (v.literal !== undefined) {
      if (['tabIndex', 'rows', 'cols', 'aria-valuemin', 'aria-valuemax', 'aria-level'].includes(key) && /^-?[0-9.]+$/.test(v.literal)) out.push(`${key}={${Number(v.literal)}}`);
      else out.push(`${key}=${JSON.stringify(v.literal)}`);
    } else out.push(`${key}={${v.expr}}`);
  }
  if (pseudo.length || className) {
    const parts = [className, ...pseudo].filter(Boolean);
    out.unshift(parts.length === 1 && !pseudo.length ? `className={${parts[0]}}` : `className={cx(${parts.join(', ')})}`);
  }
  return out;
}

function textChildren(raw, scope, inPre) {
  const txt = inPre ? raw : raw.replace(/\s+/g, ' ');
  if (!txt.includes('{{')) {
    if (!txt.trim()) return raw.includes('\n') && !inPre ? [] : [txt ? '{" "}' : ''];
    return [/[{}<>&]/.test(txt) || txt !== txt.trim() ? `{${JSON.stringify(txt)}}` : txt];
  }
  const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
  const out = [];
  parts.forEach((p, i) => {
    if (i & 1) out.push(`{${pathExpr(p, scope)}}`);
    else if (p) out.push(/[{}<>&]/.test(p) || p !== p.trim() || !p.trim() ? `{${JSON.stringify(p)}}` : p);
  });
  return out;
}

function splitNameForComment(node) {
  if (node.type !== 'comment') return null;
  const hit = SPLIT_BY_COMMENT.find(([re]) => re.test(node.data));
  return hit ? hit[1] : null;
}

function nextElement(nodes, i) {
  for (let j = i + 1; j < nodes.length; j++) {
    const n = nodes[j];
    if (n.type === 'tag') return j;
    if (n.type === 'text' && !n.data.trim()) continue;
    if (n.type === 'comment') continue;
    return -1;
  }
  return -1;
}

/** Renderiza hijos; registra los componentes separados en `uses`. */
function renderChildren(nodes, scope, depth, ctx) {
  const lines = [];
  const pending = new Map(); // índice de elemento → nombre de componente
  const grouped = new Map(); // índice inicial → { name, nodes }
  const swallowed = new Set();
  nodes.forEach((n, i) => {
    const hit = JOB.split && n.type === 'comment' && SPLIT_BY_COMMENT.find(([re]) => re.test(n.data));
    if (!hit || scope.length) return;
    const [, name, mode] = hit;
    if (mode === 'group') {
      const members = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        if (m.type === 'comment' && (SPLIT_BY_COMMENT.some(([re]) => re.test(m.data)) || Object.keys(SPLIT_BY_COMPONENT).some((c) => m.data.includes('@component ' + c + ' ')))) break;
        members.push(m);
        swallowed.add(j);
      }
      grouped.set(i, { name, nodes: members });
      return;
    }
    const j = nextElement(nodes, i);
    if (j >= 0) pending.set(j, name);
  });
  nodes.forEach((n, i) => {
    if (grouped.has(i)) {
      const g = grouped.get(i);
      ctx.uses.add(g.name);
      lines.push(pad(depth) + `<${g.name} vm={vm} />`);
      emitComponent(g.name, g.nodes);
      return;
    }
    if (swallowed.has(i)) return;
    if (n.type === 'comment') {
      if (/@component/.test(n.data)) lines.push(pad(depth) + `{/* ${n.data.trim().replace(/\*\//g, '* /')} */}`);
      return;
    }
    if (n.type === 'text') {
      textChildren(n.data, scope, ctx.inPre).forEach((t) => t && lines.push(pad(depth) + t));
      return;
    }
    if (n.type !== 'tag') return;
    const compName = ROOTS.has(n) || !JOB.split ? null : pending.get(i) || (scope.length === 0 && n.attribs?.['data-component'] && SPLIT_BY_COMPONENT[n.attribs['data-component']]);
    if (compName) {
      ctx.uses.add(compName);
      if (n.name === 'sc-if') {
        const cond = pathExpr(n.attribs.value.replace(/^\s*\{\{|\}\}\s*$/g, ''), scope);
        lines.push(pad(depth) + `{${cond} ? <${compName} vm={vm} /> : null}`);
        emitComponent(compName, n.children);
      } else {
        lines.push(pad(depth) + `<${compName} vm={vm} />`);
        emitComponent(compName, [n]);
      }
      return;
    }
    lines.push(...renderNode(n, scope, depth, ctx));
  });
  return lines;
}

function renderNode(el, scope, depth, ctx) {
  if (el.name === 'sc-if') {
    const cond = pathExpr(el.attribs.value.replace(/^\s*\{\{|\}\}\s*$/g, ''), scope);
    const kids = renderChildren(el.children, scope, depth + 1, ctx);
    return [pad(depth) + `{${cond} ? (`, pad(depth + 1) + '<>', ...kids.map((l) => '  ' + l), pad(depth + 1) + '</>', pad(depth) + ') : null}'];
  }
  if (el.name === 'sc-for') {
    const list = pathExpr(el.attribs.list.replace(/^\s*\{\{|\}\}\s*$/g, ''), scope);
    const as = el.attribs.as || 'item';
    const inner = scope.concat([as]);
    const kids = renderChildren(el.children, inner, depth + 2, ctx);
    return [
      pad(depth) + `{(${list} || []).map((${ident(as)}: any, i${inner.length}: number) => (`,
      pad(depth + 1) + `<Fragment key={i${inner.length}}>`,
      ...kids,
      pad(depth + 1) + '</Fragment>',
      pad(depth) + '))}',
    ];
  }
  const attrs = renderAttrs(el, scope);
  const openTag = `<${el.name}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
  const kids = el.children || [];
  if (VOID.has(el.name) || kids.length === 0) return [pad(depth) + openTag + ' />'];
  const inPre = ctx.inPre || el.name === 'pre';
  const inner = renderChildren(kids, scope, depth + 1, { ...ctx, inPre });
  if (!inner.length) return [pad(depth) + openTag + ' />'];
  return [pad(depth) + openTag + '>', ...inner, pad(depth) + `</${el.name}>`];
}

function pad(n) {
  return '  '.repeat(n);
}

const ROOTS = new Set();
function emitComponent(name, nodes) {
  nodes.forEach((n) => ROOTS.add(n));
  const ctx = { uses: new Set(), inPre: false };
  const body = renderChildren(nodes, [], 3, ctx);
  components.set(name, { body, uses: ctx.uses });
}

function run(job) {
  JOB = job;
  components = new Map();
  const html = readFileSync(join(ROOT, 'prototype-design', job.src), 'utf8');
  const open = html.indexOf('<x-dc>');
  const close = html.lastIndexOf('</x-dc>');
  const tpl = html.slice(open + '<x-dc>'.length, close).replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const doc = parseDocument(tpl, { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true, decodeEntities: true });
  emitComponent(job.root, doc.children);
  const out = join(ROOT, job.out);
  mkdirSync(out, { recursive: true });
  for (const [name, { body, uses }] of components) {
    const imports = [...uses].sort().map((u) => `import { ${u} } from './${u}';`);
    const needsFragment = body.some((l) => l.includes('<Fragment'));
    const file = [
      `// Traducido desde prototype-design/${JOB.src} con scripts/dc2tsx.mjs.`,
      '// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.',
      needsFragment ? "import { Fragment } from 'react';" : null,
      `import { css, cx, pc } from '${JOB.runtime}';`,
      `import type { VM } from '${JOB.vm}';`,
      ...imports,
      '',
      `export function ${name}({ vm }: { vm: VM }) {`,
      '  return (',
      '    <>',
      ...body,
      '    </>',
      '  );',
      '}',
      '',
    ].filter((l) => l !== null);
    writeFileSync(join(out, name + '.tsx'), file.join('\n'));
  }
  console.log(`dc2tsx: ${components.size} componentes → ${out}`);
  for (const [name, { body }] of components) console.log(`  ${name.padEnd(22)} ${body.length} líneas`);
}

// Las pantallas generadas ya son código fuente con ajustes propios (ver docs/DESIGN_DEVIATIONS.md).
// Sin --force se escribe en .dc2tsx-out/ para comparar contra una versión nueva del prototipo.
const force = process.argv.includes('--force');
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!force) JOBS.forEach((j) => (j.out = join('.dc2tsx-out', j.out)));
JOBS.filter((j) => !only || j.root === only).forEach(run);
