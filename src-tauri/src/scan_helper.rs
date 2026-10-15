//! Helper de escaneo de lectura (plan §8.2). Se ejecuta como root, lanzado por la app
//! con `osascript … with administrator privileges`:
//!
//!   healthdiskinfo --hdi-scan --device disk4 --mode full|quick|stress [--duration <s>] \
//!                  --progress <archivo.jsonl> --cancel <archivo> --heartbeat <archivo>
//!
//! `stress` lee de forma sostenida durante `--duration` segundos (prueba térmica).
//!
//! SOLO LEE: abre /dev/rdiskN con O_RDONLY. Escribe líneas JSON de progreso, velocidad
//! por posición y zonas ilegibles. Se detiene si aparece el archivo de cancelación, si
//! la app deja de actualizar el heartbeat (>10 s) o si el disco desaparece.

use std::fs::{File, OpenOptions};
use std::io::Write;
use std::os::unix::io::AsRawFd;
use std::path::PathBuf;
use std::time::{Duration, Instant, SystemTime};

const CHUNK: usize = 8 * 1024 * 1024;
const SUB: usize = 64 * 1024;
const QUICK_REGIONS: u64 = 1000;
const QUICK_REGION_BYTES: u64 = 32 * 1024 * 1024;
const DKIOCGETBLOCKSIZE: libc::c_ulong = 0x4004_6418;
const DKIOCGETBLOCKCOUNT: libc::c_ulong = 0x4008_6419;

struct Args {
    device: String,
    mode: String,
    duration: u64,
    progress: PathBuf,
    cancel: PathBuf,
    heartbeat: PathBuf,
}

fn parse(args: &[String]) -> Result<Args, String> {
    let get = |k: &str| args.iter().position(|a| a == k).and_then(|i| args.get(i + 1)).cloned().ok_or(format!("falta {k}"));
    let a = Args {
        device: get("--device")?,
        mode: get("--mode")?,
        duration: get("--duration").ok().and_then(|v| v.parse().ok()).unwrap_or(600).clamp(30, 3600),
        progress: get("--progress")?.into(),
        cancel: get("--cancel")?.into(),
        heartbeat: get("--heartbeat")?.into(),
    };
    if !crate::smartctl::valid_disk_id(&a.device) || a.device == "disk0" {
        return Err(format!("dispositivo no permitido: {}", a.device));
    }
    if !["full", "quick", "stress"].contains(&a.mode.as_str()) {
        return Err(format!("modo no válido: {}", a.mode));
    }
    Ok(a)
}

/// Búfer alineado a 16 KiB (lecturas sin caché sobre el dispositivo en bruto).
struct Aligned {
    ptr: *mut u8,
    len: usize,
    layout: std::alloc::Layout,
}
impl Aligned {
    fn new(len: usize) -> Aligned {
        let layout = std::alloc::Layout::from_size_align(len, 16384).unwrap();
        let ptr = unsafe { std::alloc::alloc(layout) };
        assert!(!ptr.is_null());
        Aligned { ptr, len, layout }
    }
}
impl Drop for Aligned {
    fn drop(&mut self) {
        unsafe { std::alloc::dealloc(self.ptr, self.layout) }
    }
}

enum ReadErr {
    Io,
    Gone,
}

fn pread(fd: i32, buf: &Aligned, len: usize, off: u64) -> Result<usize, ReadErr> {
    let n = unsafe { libc::pread(fd, buf.ptr as *mut libc::c_void, len.min(buf.len), off as libc::off_t) };
    if n >= 0 {
        return Ok(n as usize);
    }
    match std::io::Error::last_os_error().raw_os_error() {
        Some(libc::ENXIO) | Some(libc::ENODEV) | Some(libc::EBADF) => Err(ReadErr::Gone),
        _ => Err(ReadErr::Io),
    }
}

struct Out(File);
impl Out {
    fn line(&mut self, v: serde_json::Value) {
        let _ = writeln!(self.0, "{v}");
        let _ = self.0.flush();
    }
}

pub fn main(args: &[String]) -> i32 {
    let a = match parse(args) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("hdi-scan: {e}");
            return 2;
        }
    };
    let mut out = match OpenOptions::new().create(true).append(true).open(&a.progress) {
        Ok(f) => Out(f),
        Err(e) => {
            eprintln!("hdi-scan: {e}");
            return 2;
        }
    };
    // El archivo de progreso lo crea root: que la app (usuario) pueda leerlo.
    let _ = std::fs::set_permissions(&a.progress, std::os::unix::fs::PermissionsExt::from_mode(0o644));
    let status = if a.mode == "stress" { run_stress(&a, &mut out) } else { run(&a, &mut out) };
    if let Err(e) = status {
        // EPERM: la protección de privacidad de macOS (TCC) bloqueó el acceso al disco.
        let code = if e.contains("os error 1)") { "EPERM" } else { "ERROR" };
        out.line(serde_json::json!({ "t": "error", "code": code, "message": e }));
        return 1;
    }
    0
}

fn heartbeat_stale(p: &PathBuf) -> bool {
    std::fs::metadata(p)
        .and_then(|m| m.modified())
        .map(|t| SystemTime::now().duration_since(t).unwrap_or_default() > Duration::from_secs(10))
        .unwrap_or(true)
}

fn run(a: &Args, out: &mut Out) -> Result<(), String> {
    let path = format!("/dev/r{}", a.device);
    let file = File::open(&path).map_err(|e| format!("no se pudo abrir {path}: {e}"))?;
    let fd = file.as_raw_fd();
    unsafe { libc::fcntl(fd, libc::F_NOCACHE, 1) };
    let mut bs: u32 = 0;
    let mut count: u64 = 0;
    if unsafe { libc::ioctl(fd, DKIOCGETBLOCKSIZE, &mut bs) } != 0 || unsafe { libc::ioctl(fd, DKIOCGETBLOCKCOUNT, &mut count) } != 0 {
        return Err("no se pudo leer la geometría del disco".into());
    }
    let block = bs.max(512) as u64;
    let total = count * block;

    // Regiones a leer: todo el disco o ~2 % repartido uniformemente.
    let regions: Vec<(u64, u64)> = if a.mode == "full" {
        vec![(0, total)]
    } else {
        let n = QUICK_REGIONS.min((total / QUICK_REGION_BYTES).max(1));
        let stride = total / n;
        (0..n).map(|i| (i * stride - (i * stride) % block, QUICK_REGION_BYTES.min(total - i * stride))).collect()
    };
    let to_read: u64 = regions.iter().map(|r| r.1).sum();
    out.line(serde_json::json!({ "t": "start", "total": total, "toRead": to_read, "blockSize": block, "mode": a.mode }));

    let buf = Aligned::new(CHUNK);
    let t0 = Instant::now();
    let mut done: u64 = 0;
    let mut last_emit = Instant::now();
    let mut win_bytes: u64 = 0;
    let mut win_t = Instant::now();
    let (mut min_s, mut max_s, mut zones) = (f64::MAX, 0f64, 0u64);
    let mut open_zone: Option<(u64, u64)> = None;
    let mut status = "passed";

    'outer: for (start, len) in regions {
        let mut off = start;
        let end = start + len;
        while off < end {
            if a.cancel.exists() || heartbeat_stale(&a.heartbeat) {
                status = "cancelled";
                break 'outer;
            }
            let want = CHUNK.min((end - off) as usize);
            match pread(fd, &buf, want, off) {
                Ok(0) => break,
                Ok(n) => {
                    if let Some((zs, ze)) = open_zone.take() {
                        out.line(serde_json::json!({ "t": "zone", "q": zs as f64 / total as f64, "lbaStart": zs / block, "lbaEnd": ze / block - 1 }));
                    }
                    off += n as u64;
                    done += n as u64;
                    win_bytes += n as u64;
                }
                Err(ReadErr::Gone) => {
                    status = "interrupted";
                    break 'outer;
                }
                Err(ReadErr::Io) => {
                    // Acota la zona ilegible leyendo en trozos de 64 KiB.
                    let mut sub = off;
                    let stop = off + want as u64;
                    while sub < stop {
                        let w = SUB.min((stop - sub) as usize);
                        match pread(fd, &buf, w, sub) {
                            Ok(_) => {
                                if let Some((zs, ze)) = open_zone.take() {
                                    out.line(serde_json::json!({ "t": "zone", "q": zs as f64 / total as f64, "lbaStart": zs / block, "lbaEnd": ze / block - 1 }));
                                }
                            }
                            Err(ReadErr::Gone) => {
                                status = "interrupted";
                                break 'outer;
                            }
                            Err(ReadErr::Io) => {
                                zones += u64::from(open_zone.is_none());
                                open_zone = Some(match open_zone {
                                    Some((zs, _)) => (zs, sub + w as u64),
                                    None => (sub, sub + w as u64),
                                });
                            }
                        }
                        sub += w as u64;
                    }
                    off = stop;
                    done += want as u64;
                    win_bytes += want as u64;
                    status = "errors";
                }
            }
            if last_emit.elapsed() >= Duration::from_millis(250) {
                let secs = win_t.elapsed().as_secs_f64().max(1e-3);
                let mbps = win_bytes as f64 / 1e6 / secs;
                min_s = min_s.min(mbps);
                max_s = max_s.max(mbps);
                out.line(serde_json::json!({
                    "t": "progress", "p": done as f64 / to_read as f64, "q": off as f64 / total as f64,
                    "mbps": mbps.round(), "done": done, "errors": zones, "elapsedMs": t0.elapsed().as_millis() as u64,
                }));
                win_bytes = 0;
                win_t = Instant::now();
                last_emit = Instant::now();
            }
        }
    }
    if let Some((zs, ze)) = open_zone.take() {
        out.line(serde_json::json!({ "t": "zone", "q": zs as f64 / total as f64, "lbaStart": zs / block, "lbaEnd": ze / block - 1 }));
    }
    let secs = t0.elapsed().as_secs_f64().max(1e-3);
    let avg = done as f64 / 1e6 / secs;
    if min_s == f64::MAX {
        // Terminó antes de la primera muestra: la única velocidad conocida es el promedio.
        min_s = avg;
        max_s = avg;
    }
    out.line(serde_json::json!({
        "t": "done", "status": status, "p": done as f64 / to_read.max(1) as f64, "avg": avg.round(),
        "min": min_s.round(), "max": max_s.round(), "errors": zones, "durationMs": (secs * 1000.0) as u64, "bytes": done,
    }));
    Ok(())
}

/// Prueba térmica: lectura secuencial sostenida (dando la vuelta al llegar al final) durante
/// `duration` segundos. La velocidad se registra en el tiempo para detectar estrangulamiento.
fn run_stress(a: &Args, out: &mut Out) -> Result<(), String> {
    let path = format!("/dev/r{}", a.device);
    let file = File::open(&path).map_err(|e| format!("no se pudo abrir {path}: {e}"))?;
    let fd = file.as_raw_fd();
    unsafe { libc::fcntl(fd, libc::F_NOCACHE, 1) };
    let mut bs: u32 = 0;
    let mut count: u64 = 0;
    if unsafe { libc::ioctl(fd, DKIOCGETBLOCKSIZE, &mut bs) } != 0 || unsafe { libc::ioctl(fd, DKIOCGETBLOCKCOUNT, &mut count) } != 0 {
        return Err("no se pudo leer la geometría del disco".into());
    }
    let total = count * bs.max(512) as u64;
    let dur = Duration::from_secs(a.duration);
    out.line(serde_json::json!({ "t": "start", "total": total, "toRead": 0, "blockSize": bs, "mode": "stress", "duration": a.duration }));
    let buf = Aligned::new(CHUNK);
    let t0 = Instant::now();
    let (mut off, mut done, mut errors) = (0u64, 0u64, 0u64);
    let (mut win_bytes, mut win_t, mut last) = (0u64, Instant::now(), Instant::now());
    let mut speeds: Vec<f64> = Vec::new();
    let mut status = "passed";
    while t0.elapsed() < dur {
        if a.cancel.exists() || heartbeat_stale(&a.heartbeat) {
            status = "cancelled";
            break;
        }
        let want = CHUNK.min((total - off) as usize);
        match pread(fd, &buf, want, off) {
            Ok(n) if n > 0 => {
                done += n as u64;
                win_bytes += n as u64;
                off += n as u64;
            }
            Ok(_) => off = total,
            Err(ReadErr::Gone) => {
                status = "interrupted";
                break;
            }
            Err(ReadErr::Io) => {
                errors += 1;
                out.line(serde_json::json!({ "t": "zone", "q": t0.elapsed().as_secs_f64() / dur.as_secs_f64(), "lbaStart": off / bs.max(512) as u64, "lbaEnd": (off + want as u64) / bs.max(512) as u64 - 1 }));
                off += want as u64;
                status = "errors";
            }
        }
        if off >= total {
            off = 0;
        }
        if last.elapsed() >= Duration::from_millis(250) {
            let mbps = win_bytes as f64 / 1e6 / win_t.elapsed().as_secs_f64().max(1e-3);
            speeds.push(mbps);
            let p = (t0.elapsed().as_secs_f64() / dur.as_secs_f64()).min(1.0);
            out.line(serde_json::json!({ "t": "progress", "p": p, "q": p, "mbps": mbps.round(), "done": done, "errors": errors, "elapsedMs": t0.elapsed().as_millis() as u64 }));
            win_bytes = 0;
            win_t = Instant::now();
            last = Instant::now();
        }
    }
    let secs = t0.elapsed().as_secs_f64().max(1e-3);
    let avg = done as f64 / 1e6 / secs;
    let part = (speeds.len() / 5).max(1);
    let mean = |v: &[f64]| if v.is_empty() { avg } else { v.iter().sum::<f64>() / v.len() as f64 };
    let first = mean(&speeds[..part.min(speeds.len())]);
    let lastv = mean(&speeds[speeds.len().saturating_sub(part)..]);
    let min = speeds.iter().cloned().fold(f64::MAX, f64::min);
    let max = speeds.iter().cloned().fold(0.0, f64::max);
    out.line(serde_json::json!({
        "t": "done", "status": status, "p": (secs / dur.as_secs_f64()).min(1.0), "avg": avg.round(),
        "min": if min == f64::MAX { avg.round() } else { min.round() }, "max": if max == 0.0 { avg.round() } else { max.round() },
        "firstAvg": first.round(), "lastAvg": lastv.round(), "errors": errors, "durationMs": (secs * 1000.0) as u64, "bytes": done,
    }));
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_invalid_or_internal_devices() {
        let base = |dev: &str, mode: &str| {
            vec!["--device", dev, "--mode", mode, "--progress", "/tmp/p", "--cancel", "/tmp/c", "--heartbeat", "/tmp/h"]
                .into_iter()
                .map(String::from)
                .collect::<Vec<_>>()
        };
        assert!(parse(&base("disk4", "full")).is_ok());
        assert!(parse(&base("disk4", "quick")).is_ok());
        assert!(parse(&base("disk0", "full")).is_err());
        assert!(parse(&base("disk4s1", "full")).is_err());
        assert!(parse(&base("/dev/disk4", "full")).is_err());
        assert!(parse(&base("disk4", "stress")).is_ok());
        assert!(parse(&base("disk4", "write")).is_err());
    }
}
