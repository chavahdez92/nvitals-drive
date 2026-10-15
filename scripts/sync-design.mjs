#!/usr/bin/env node
/**
 * sync-design — copia a src/ los recursos del prototipo (solo lectura):
 *   tokens.css, sprite de íconos y datos mock; el ícono de la app sale de branding/nvitals/.
 * Uso: pnpm sync:design   (con --check solo informa divergencias).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => join(ROOT, 'prototype-design', ...a);
const S = (...a) => join(ROOT, ...a);
const check = process.argv.includes('--check');

const mockSrc = readFileSync(P('js', 'mock-data.js'), 'utf8');
const body = mockSrc
  .slice(mockSrc.indexOf('(function () {') + '(function () {'.length, mockSrc.lastIndexOf('})();'))
  .replace('window.HDI_MOCK = {', 'return {');

// El sprite limpio (sin metadatos) es el que el prototipo inyecta desde js/icons.js.
const iconsJs = readFileSync(P('js', 'icons.js'), 'utf8');
const spriteExpr = iconsJs.slice(iconsJs.indexOf('var s=') + 6, iconsJs.indexOf(';\nfunction inj'));
const sprite = Function('return ' + spriteExpr)();

const BRAND_ICON = readFileSync(S('branding', 'nvitals', 'Icono de nvitals para app de discos.svg'), 'utf8');

const targets = [
  // Solo cambia el nombre en el comentario de cabecera (cambio de marca, DESIGN_DEVIATIONS #20).
  [S('src', 'design-system', 'tokens.css'), readFileSync(P('css', 'tokens.css'), 'utf8').replace('HealthDiskInfo — design tokens', 'NVitals Drive — design tokens')],
  [S('src', 'design-system', 'icons.svg'), sprite],
  // El ícono de la app sale de la marca NVitals (branding/), no del prototipo (DESIGN_DEVIATIONS #20).
  [S('public', 'assets', 'app-icon.svg'), BRAND_ICON],
  [S('src', 'design-system', 'app-icon.svg'), BRAND_ICON],
  [
    S('src', 'ui', 'mock', 'mockData.ts'),
    '// Generado por scripts/sync-design.mjs desde prototype-design/js/mock-data.js — no editar.\n' +
      '/* eslint-disable */\n// @ts-nocheck\n' +
      'export const HDI_MOCK: any = (function () {' + body + '})();\n',
  ],
];

let diverged = 0;
for (const [dest, content] of targets) {
  const same = existsSync(dest) && readFileSync(dest, 'utf8') === content;
  if (same) continue;
  diverged++;
  if (check) console.log('diverge:', dest.replace(ROOT + '/', ''));
  else {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
    console.log('copiado:', dest.replace(ROOT + '/', ''));
  }
}
if (!diverged) console.log('sync-design: todo al día');
if (check && diverged) process.exit(1);
