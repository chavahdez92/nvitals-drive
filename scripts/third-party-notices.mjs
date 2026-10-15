#!/usr/bin/env node
// Genera THIRD_PARTY_NOTICES.md con las dependencias de producción (Rust y npm) y sus licencias.
//
//   node scripts/with-cargo.mjs node scripts/third-party-notices.mjs          # escribe el archivo
//   node scripts/with-cargo.mjs node scripts/third-party-notices.mjs --check  # falla si está desactualizado (CI)

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'THIRD_PARTY_NOTICES.md');
const win = process.platform === 'win32';

const meta = JSON.parse(
  execFileSync('cargo', ['metadata', '--format-version', '1', '--locked', '--manifest-path', join(ROOT, 'src-tauri', 'Cargo.toml')], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: win,
  }),
);
const crates = meta.packages
  .filter((p) => p.source)
  .map((p) => ({ name: p.name, version: p.version, license: p.license ?? p.license_file ?? '—', url: p.repository ?? '' }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const npmRaw = JSON.parse(execFileSync('pnpm', ['licenses', 'list', '--prod', '--json'], { cwd: ROOT, encoding: 'utf8', shell: win }));
const npm = Object.entries(npmRaw)
  .flatMap(([license, pkgs]) => pkgs.flatMap((p) => (p.versions ?? [p.version]).map((v) => ({ name: p.name, version: v, license, url: p.homepage ?? '' }))))
  .sort((a, b) => a.name.localeCompare(b.name));

const row = (d) => `| ${d.url ? `[${d.name}](${d.url})` : d.name} | ${d.version} | ${d.license} |`;
const table = (list) => ['| Paquete | Versión | Licencia |', '|---|---|---|', ...list.map(row)].join('\n');

const text = `# Avisos de terceros

NVitals Drive se distribuye bajo \`MIT OR Apache-2.0\` (ver \`LICENSE-MIT\` y \`LICENSE-APACHE\`).
Este archivo lista el software de terceros que se compila dentro de la app. Se genera con
\`scripts/third-party-notices.mjs\`; no lo edites a mano.

## Programas externos (no se incluyen en la app)

La app ejecuta estos programas como procesos aparte si están instalados en el equipo. No se enlazan
ni se distribuyen con ella.

| Programa | Uso | Licencia | Código fuente |
|---|---|---|---|
| smartmontools (\`smartctl\`) | Lectura de datos SMART | GPL-2.0-or-later | https://github.com/smartmontools/smartmontools |
| fio | Benchmark de lectura y escritura | GPL-2.0 | https://github.com/axboe/fio |

## Dependencias de npm (interfaz) — ${npm.length}

${table(npm)}

## Crates de Rust (núcleo) — ${crates.length}

Incluye las dependencias de todas las plataformas (macOS, Windows y Linux).

${table(crates)}
`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== text) {
    console.error('THIRD_PARTY_NOTICES.md está desactualizado: ejecuta `pnpm notices`.');
    process.exit(1);
  }
} else {
  writeFileSync(OUT, text);
  console.log(`THIRD_PARTY_NOTICES.md: ${npm.length} paquetes npm, ${crates.length} crates`);
}
