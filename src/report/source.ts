/**
 * Origen de datos del reporte. Misma forma que los datos del prototipo
 * (`{ disks, scans, exitBits, appVersion }` + `date` y `cmds` opcionales).
 * La app escribe aquí la instantánea del disco antes de previsualizar o exportar.
 */
import { HDI_MOCK } from '../ui/mock/mockData';

export const REPORT_SOURCE_KEY = 'hdi-report-source';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reportSource(): any {
  try {
    const raw = localStorage.getItem(REPORT_SOURCE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sin almacenamiento: se usan los datos del prototipo */
  }
  return HDI_MOCK;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeReportSource(data: any): void {
  try {
    localStorage.setItem(REPORT_SOURCE_KEY, JSON.stringify(data));
  } catch {
    /* ignorado */
  }
}
