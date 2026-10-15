#!/usr/bin/env node
// Ejecuta un comando con la toolchain de Rust en el PATH, en cualquier SO.
//
//   node scripts/with-cargo.mjs tauri dev
//   node scripts/with-cargo.mjs --cwd src-tauri cargo test
//
// Agrega al inicio del PATH las rutas habituales de rustup (`~/.cargo/bin` y, en macOS,
// la de `brew install rustup`, que no se enlaza en /opt/homebrew/bin).

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

const args = process.argv.slice(2);
let cwd = process.cwd();
if (args[0] === '--cwd') {
  cwd = args[1];
  args.splice(0, 2);
}
if (!args.length) {
  console.error('uso: node scripts/with-cargo.mjs [--cwd <dir>] <comando> [args…]');
  process.exit(2);
}

const extra = [
  process.env.CARGO_HOME ? join(process.env.CARGO_HOME, 'bin') : join(homedir(), '.cargo', 'bin'),
  '/opt/homebrew/opt/rustup/bin',
  '/usr/local/opt/rustup/bin',
].filter((p) => existsSync(p));

const key = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
const env = { ...process.env, [key]: [...extra, process.env[key] ?? ''].join(delimiter) };

const child = spawn(args[0], args.slice(1), { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
