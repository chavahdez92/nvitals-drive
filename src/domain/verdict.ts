/**
 * Veredicto, alertas y frase en lenguaje natural (plan §6.2–§6.4).
 * La primera regla que se cumple determina el veredicto.
 */
import type { Disk, Thresholds, Verdict } from './disk';
import { nf, plural } from './format';

type Health = Pick<Disk, 'life' | 'spare' | 'spareTh' | 'mediaErr' | 'critWarn' | 'smartPassed'>;

/** Bits de advertencia crítica que llevan a "Crítico" (el bit 1, temperatura, es alerta térmica). */
export const CRITICAL_BITS = 0x01 | 0x04 | 0x08 | 0x10 | 0x20;

export function verdictFor(h: Health, th: Thresholds): Verdict {
  const spareLow = h.spareTh > 0 && h.spare < h.spareTh;
  if ((h.critWarn & CRITICAL_BITS) !== 0 || !h.smartPassed || spareLow || h.mediaErr >= th.thMedia) return 'critical';
  const spareNear = h.spare < 100 && h.spare <= h.spareTh + th.thSpare;
  if (h.mediaErr > 0 || spareNear || h.life <= 20) return 'warning';
  return h.life >= 80 ? 'optimal' : 'good';
}

const joinEs = (parts: string[]) =>
  parts.length <= 1 ? parts.join('') : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];

export function sentenceFor(d: Disk, th: Thresholds): string {
  if (d.nodata) return d.conn === 'usb'
    ? 'No se pueden leer datos SMART por USB en macOS. Conecta el disco con un gabinete Thunderbolt o USB4.'
    : 'smartctl no pudo leer datos SMART de este disco.';
  switch (d.verdict) {
    case 'optimal':
      return `Excelente estado: ${d.life} % de vida útil restante y sin errores de medios. ${d.writtenText} escritos en ${nf(d.hours)} h de uso.`;
    case 'good':
      return `Buen estado con desgaste moderado: ${d.life} % de vida útil restante.`;
    case 'warning': {
      const parts: string[] = [];
      if (d.mediaErr > 0) parts.push(plural(d.mediaErr, 'error de medios', 'errores de medios'));
      if (d.life <= 20) parts.push(`${d.life} % de vida útil restante`);
      if (d.spare < 100 && d.spare <= d.spareTh + th.thSpare) parts.push(`el repuesto (${d.spare} %) cerca del umbral (${d.spareTh} %)`);
      return `Requiere atención: ${joinEs(parts)}. Planifica su reemplazo y respalda tus datos.`;
    }
    case 'critical': {
      const parts: string[] = [];
      if (d.spareTh > 0 && d.spare < d.spareTh) parts.push(`el repuesto (${d.spare} %) está por debajo del umbral (${d.spareTh} %)`);
      if (d.critWarn & 0x04) parts.push('la fiabilidad está degradada');
      if (d.critWarn & 0x08) parts.push('el disco está en modo solo lectura');
      if (d.critWarn & 0x10) parts.push('falló el respaldo de memoria volátil');
      if (d.critWarn & 0x20) parts.push('la memoria persistente no es confiable');
      if (!d.smartPassed && !(d.critWarn & CRITICAL_BITS)) parts.push('la autoevaluación SMART falló');
      if (d.mediaErr >= th.thMedia) parts.push(`hay ${plural(d.mediaErr, 'error de medios', 'errores de medios')}`);
      return `Estado crítico: ${joinEs(parts)}. Respalda tus datos lo antes posible.`;
    }
    default:
      return '';
  }
}
