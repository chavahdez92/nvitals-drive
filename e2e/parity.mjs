#!/usr/bin/env node
/**
 * Paridad visual (plan §12.3): captura la app (modo mock) y el prototipo con WebKit a
 * 1512 × 982 (ventana) en tema oscuro y claro, y genera docs/parity/<fecha>/index.html
 * con las capturas lado a lado y el % de píxeles distintos (orientativo: la temperatura
 * simulada varía entre cargas).
 * Requiere: app en http://localhost:1420 (pnpm dev:web) y prototipo en http://localhost:4174.
 */
import { webkit } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const APP = process.env.APP_URL || 'http://localhost:1420';
const PROTO = process.env.PROTO_URL || 'http://localhost:4174';
const ROUTES = (process.env.ROUTES || [
  '#/devices', '#/device/disk4/overview', '#/device/disk4/smart', '#/device/disk4/temperature',
  '#/device/disk4/tests', '#/device/disk8/logs', '#/device/disk4/identity', '#/device/disk4/console',
  '#/device/disk5/overview', '#/device/disk7/overview', '#/device/disk0/logs',
  '#/reports', '#/reports/new', '#/history', '#/history/compare', '#/settings',
].join(',')).split(',');
const THEMES = (process.env.THEMES || 'dark,light').split(',');
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const OUT = join('docs', 'parity', stamp);
mkdirSync(OUT, { recursive: true });

const browser = await webkit.launch();
const rows = [];
for (const theme of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: 1552, height: 1022 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((t) => {
    localStorage.setItem('hdi-proto', JSON.stringify({ theme: t, wall: t, motion: 'reduced', transp: 'system', speed: 1 }));
    Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  }, theme);
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const name = theme + '_' + route.replace(/[#/]+/g, '_').replace(/^_|_$/g, '');
    const shots = {};
    for (const [label, base] of [['proto', PROTO], ['app', APP]]) {
      await page.goto(base + '/' + route, { waitUntil: 'load' });
      await page.waitForTimeout(1600);
      const file = join(OUT, `${name}.${label}.png`);
      await page.screenshot({ path: file });
      shots[label] = file;
    }
    const a = PNG.sync.read(readFileSync(shots.proto));
    const b = PNG.sync.read(readFileSync(shots.app));
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    writeFileSync(join(OUT, `${name}.diff.png`), PNG.sync.write(diff));
    const pct = (100 * n / (a.width * a.height)).toFixed(2);
    rows.push({ name, route, theme, pct });
    console.log(`${pct.padStart(6)} %  ${theme.padEnd(5)} ${route}`);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Paridad ${stamp}</title>
<style>body{font:13px system-ui;margin:20px;background:#111;color:#eee}img{width:32%;border:1px solid #333}h2{font-size:14px;margin:24px 0 6px}</style>
<h1>Paridad visual · ${stamp}</h1><p>Izquierda: prototipo · centro: app · derecha: diferencia.</p>
${rows.map((r) => `<h2>${r.theme} · ${r.route} — ${r.pct} % distinto</h2><img src="${r.name}.proto.png"><img src="${r.name}.app.png"><img src="${r.name}.diff.png">`).join('\n')}`);
console.log('Reporte:', join(OUT, 'index.html'));
