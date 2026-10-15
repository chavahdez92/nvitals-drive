/**
 * Interpretación del benchmark de fio (perfiles al estilo CrystalDiskMark) frente a
 * la cadena de conexión (speedpath.ts). Puro y sin E/S.
 */
import { nf } from './format';
import type { SpeedPath } from './speedpath';

export const BENCH_PROFILES = ['SEQ1M Q8T1', 'SEQ1M Q1T1', 'RND4K Q32T1', 'RND4K Q1T1'] as const;
export type BenchProfile = (typeof BENCH_PROFILES)[number];

export interface BenchSample {
  key: BenchProfile;
  write: boolean;
  mbps: number;
  iops: number;
  latUs: number;
}

export interface BenchRated {
  read?: number | null;
  write?: number | null;
}

export type BenchTone = 'optimal' | 'good' | 'warning' | 'nodata';

export interface BenchVerdict {
  tone: BenchTone;
  title: string;
  body: string;
  seqRead: number | null;
  seqWrite: number | null;
  /** Lectura secuencial como fracción del techo de la conexión. */
  ofCeiling: number | null;
}

export const find = (rs: BenchSample[], key: BenchProfile, write: boolean) => rs.find((r) => r.key === key && r.write === write) || null;

const HOP_NAME = { port: 'el puerto de la Mac', link: 'el enlace del gabinete', ssd: 'el propio SSD' } as const;

export function benchVerdict(rs: BenchSample[], path: SpeedPath | null | undefined, rated: BenchRated = {}): BenchVerdict {
  const sr = find(rs, 'SEQ1M Q8T1', false)?.mbps ?? null;
  const sw = find(rs, 'SEQ1M Q8T1', true)?.mbps ?? null;
  const ceiling = path?.ceiling ?? null;
  const of = sr != null && ceiling ? sr / ceiling : null;
  const base = { seqRead: sr, seqWrite: sw, ofCeiling: of };
  if (sr == null) return { ...base, tone: 'nodata', title: 'Sin resultados', body: 'El benchmark no produjo mediciones.' };

  const measured = `Lectura secuencial de ${nf(sr)} MB/s${sw != null ? ` y escritura de ${nf(sw)} MB/s` : ''}`;
  const ratedTxt = rated.read ? ` Es el ${Math.round((sr / rated.read) * 100)} % de los ${nf(rated.read)} MB/s nominales del SSD.` : '';
  if (!path || !ceiling || !path.bottleneck) {
    return { ...base, tone: 'good', title: `${nf(sr)} MB/s de lectura`, body: `${measured}.${ratedTxt}` };
  }
  const pct = Math.round(of! * 100);
  const hop = path[path.bottleneck];
  const limit = `${HOP_NAME[path.bottleneck]} (${hop.label}) limita a ~${nf(ceiling)} MB/s`;
  if (of! >= 0.7) {
    const upgrade = path.bottleneck === 'ssd'
      ? ' El SSD es el límite: un gabinete más rápido no mejoraría el resultado.'
      : path.ssd.mbps && path.ssd.mbps > ceiling * 1.2
        ? ` El SSD admite hasta ~${nf(path.ssd.mbps)} MB/s: con una conexión más rápida (Thunderbolt 5) rendiría más.`
        : '';
    return { ...base, tone: 'optimal', title: 'Rinde lo que permite la conexión', body: `${measured}: el ${pct} % del techo. ${cap(limit)}.${upgrade}${ratedTxt}` };
  }
  if (of! >= 0.45) {
    return { ...base, tone: 'good', title: 'Rendimiento aceptable', body: `${measured}: el ${pct} % del techo. ${cap(limit)}. La diferencia es normal en gabinetes con puente o SSD sin DRAM.${ratedTxt}` };
  }
  return {
    ...base, tone: 'warning', title: 'Por debajo de lo esperado',
    body: `${measured}: solo el ${pct} % del techo (${cap(limit)}). Revisa el cable (que sea USB4/Thunderbolt), el puerto, la temperatura del gabinete y el espacio libre del disco.${ratedTxt}`,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
