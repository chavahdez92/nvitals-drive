#!/usr/bin/env node
// Anonimiza fixtures JSON (smartctl, system_profiler, lsblk, WMI…) antes de agregarlos al repo.
//
//   node scripts/anonymize-fixture.mjs <archivo.json>…            # muestra los reemplazos
//   node scripts/anonymize-fixture.mjs <archivo.json>… --write    # los aplica
//
// Reemplaza los valores de texto cuya clave parece un identificador único (serie, UUID,
// UID de Thunderbolt, WWN, EUI-64, NGUID) por valores ficticios con la misma forma
// (dígito → dígito, hex → hex, mayúsculas y separadores intactos), también donde
// aparecen dentro de otros textos (p. ej. `smartctl.output[]`). El reemplazo es
// determinista: el mismo serial da el mismo valor ficticio en todos los archivos.
// También cambia la zona horaria local (CST, CDT, PDT…) por UTC.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const SENSITIVE_KEY = /serial|uuid|_uid|^uid$|wwn|eui64|nguid/i;
const TZ = /\b(?:[ECMP][SD]T|CET|CEST|BST|IST|JST)\b/g;
const SALT = 'nvitals-fixture';

export function fake(value) {
  const hash = createHash('sha256').update(SALT + value).digest();
  let i = 0;
  const next = () => hash[i++ % hash.length];
  const prefix = /^0x/i.exec(value)?.[0] ?? '';
  return prefix + [...value.slice(prefix.length)]
    .map((c) => {
      if (/[0-9]/.test(c)) return String(next() % 10);
      if (/[A-F]/.test(c)) return 'ABCDEF'[next() % 6];
      if (/[a-f]/.test(c)) return 'abcdef'[next() % 6];
      if (/[G-Z]/.test(c)) return String.fromCharCode(71 + (next() % 20));
      if (/[g-z]/.test(c)) return String.fromCharCode(103 + (next() % 20));
      return c;
    })
    .join('');
}

function collect(node, key, out) {
  if (Array.isArray(node)) node.forEach((v) => collect(v, key, out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) collect(v, k, out);
  else if (typeof node === 'string' && key && SENSITIVE_KEY.test(key) && node.length >= 4 && !/^(.)\1+$/.test(node)) out.add(node);
}

function rewrite(node, map) {
  if (Array.isArray(node)) return node.map((v) => rewrite(v, map));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, rewrite(v, map)]));
  if (typeof node !== 'string') return node;
  let s = node;
  for (const [from, to] of map) s = s.split(from).join(to);
  return s.replace(TZ, 'UTC');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const files = args.filter((a) => a !== '--write');
  if (!files.length) {
    console.error('uso: node scripts/anonymize-fixture.mjs <archivo.json>… [--write]');
    process.exit(2);
  }
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const json = JSON.parse(text);
    const values = new Set();
    collect(json, null, values);
    const map = [...values].sort((a, b) => b.length - a.length).map((v) => [v, fake(v)]);
    for (const [from, to] of map) console.log(`${file}: ${from} → ${to}`);
    if (write) {
      const indent = /^\s*\{\n(\s+)/.exec(text)?.[1] ?? '  ';
      writeFileSync(file, JSON.stringify(rewrite(json, map), null, indent) + '\n');
    }
  }
}
