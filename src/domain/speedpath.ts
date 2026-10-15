/**
 * Cadena de conexión que limita la velocidad de un disco externo:
 * puerto de la Mac → enlace del gabinete/puente → enlace PCIe del SSD.
 * El techo real es el eslabón más lento. Puro y sin E/S.
 *
 * Los MB/s "prácticos" son el máximo realista tras la sobrecarga del protocolo
 * (codificación, túnel PCIe, puente), no la cifra comercial.
 */
import { nf } from './format';

export type Hop = 'port' | 'link' | 'ssd';

export interface SpeedHop {
  label: string;
  detail: string;
  /** Techo práctico en MB/s (null si no se conoce). */
  mbps: number | null;
}

export interface SpeedPath {
  port: SpeedHop;
  link: SpeedHop;
  ssd: SpeedHop;
  /** Techo práctico de toda la cadena, en MB/s. */
  ceiling: number | null;
  bottleneck: Hop | null;
}

/** MB/s útiles por carril PCIe (tras la codificación 8b/10b o 128b/130b). */
const PCIE_LANE_MBPS: Record<number, number> = { 1: 250, 2: 500, 3: 985, 4: 1969, 5: 3938, 6: 7563 };

export function pcieHop(gen: number | null, width: number | null): SpeedHop {
  if (!gen) return { label: 'SSD', detail: 'Enlace PCIe desconocido', mbps: null };
  const w = width || 4;
  const raw = PCIE_LANE_MBPS[gen] ? PCIE_LANE_MBPS[gen] * w : null;
  return {
    label: `PCIe Gen${gen} ×${w}`,
    detail: raw ? `Hasta ~${fmt(raw)} MB/s teóricos del enlace` : 'Enlace PCIe',
    mbps: raw,
  };
}

/** Techo práctico del enlace del gabinete según tipo y velocidad negociada. */
export function linkHop(kind: 'usb' | 'usb4' | 'thunderbolt', gbps: number | null, bridge: string | null): SpeedHop {
  const who = bridge ? bridge.replace(/^Puente USB /, '') : kind === 'usb' ? 'Puente USB' : 'Gabinete';
  if (kind === 'usb') {
    const table: [number, string, number][] = [
      [20, 'USB 3.2 Gen 2×2 · 20 Gb/s', 2000],
      [10, 'USB 3.2 Gen 2 · 10 Gb/s', 1050],
      [5, 'USB 3.2 Gen 1 · 5 Gb/s', 450],
      [0.48, 'USB 2.0 · 480 Mb/s', 40],
    ];
    const hit = gbps != null ? table.find(([g]) => gbps >= g) : undefined;
    return hit ? { label: hit[1], detail: who, mbps: hit[2] } : { label: 'USB', detail: who, mbps: null };
  }
  // USB4 y Thunderbolt transportan PCIe por túnel. Un puente USB4 (ASM2464PD) llega a
  // ~3,800 MB/s a 40 Gb/s; Thunderbolt 3/4 limita el túnel PCIe a ~2,800 MB/s.
  // Thunderbolt 5 (80 Gb/s, 120 Gb/s en modo asimétrico) sube el túnel a PCIe Gen4 ×4.
  const g = gbps ?? 40;
  const name = kind === 'usb4' ? 'USB4' : g >= 80 ? 'Thunderbolt 5' : 'Thunderbolt';
  const mbps = g >= 80 ? 6000 : g >= 40 ? (kind === 'usb4' ? 3800 : 2800) : g >= 20 ? 1900 : null;
  return { label: `${name} · ${fmtG(g)} Gb/s`, detail: who, mbps };
}

/** Capacidad del puerto de la Mac: el receptáculo más rápido que reporta el sistema. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function portHop(profiler: any): SpeedHop {
  const buses: any[] = Array.isArray(profiler?.SPThunderboltDataType) ? profiler.SPThunderboltDataType : [];
  let best = 0;
  for (const b of buses) {
    for (const [k, v] of Object.entries(b)) {
      if (!/^receptacle/.test(k) || !v || typeof v !== 'object') continue;
      const g = parseFloat(String((v as any).current_speed_key || '').match(/([\d.]+)\s*Gb/i)?.[1] || '0');
      best = Math.max(best, g);
    }
  }
  if (!best) return { label: 'Puerto de la Mac', detail: 'Velocidad no reportada', mbps: null };
  const name = best >= 80 ? 'Thunderbolt 5' : best >= 40 ? 'Thunderbolt 4 / USB4' : best >= 20 ? 'Thunderbolt 3' : 'USB-C';
  // El puerto de una Mac Thunderbolt nunca es el límite para un solo SSD: su techo es el del túnel PCIe.
  const mbps = best >= 80 ? 6000 : best >= 40 ? 3800 : best >= 20 ? 1900 : null;
  return { label: name, detail: `Hasta ${fmtG(best)} Gb/s por puerto`, mbps };
}

export function buildPath(port: SpeedHop, link: SpeedHop, ssd: SpeedHop): SpeedPath {
  const hops: [Hop, SpeedHop][] = [['port', port], ['link', link], ['ssd', ssd]];
  const known = hops.filter(([, h]) => h.mbps != null) as [Hop, SpeedHop & { mbps: number }][];
  if (!known.length) return { port, link, ssd, ceiling: null, bottleneck: null };
  // Ante un empate gana el eslabón más cercano al SSD (el gabinete), que es el que el usuario puede cambiar.
  const min = known.reduce((a, b) => (b[1].mbps <= a[1].mbps ? b : a));
  return { port, link, ssd, ceiling: min[1].mbps, bottleneck: min[0] };
}

const fmt = (n: number) => nf(n);
const fmtG = (g: number) => (Number.isInteger(g) ? String(g) : g.toFixed(1));
