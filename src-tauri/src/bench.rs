//! Benchmark de lectura/escritura con fio (código abierto, el motor de KDiskMark).
//!
//! Única excepción a la regla de solo lectura, pedida por el usuario: fio escribe un
//! archivo temporal (`.hdi-bench.tmp`) en un volumen montado del disco y se borra al
//! terminar, al fallar y al cancelar. Nunca toca el dispositivo en bruto ni la tabla de
//! particiones, y no requiere privilegios. El volumen debe salir del propio `diskutil`
//! (no se aceptan rutas arbitrarias) y se exige espacio libre suficiente.

use serde::Serialize;
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::io::AsyncBufReadExt;
use tokio::process::Command;

use crate::commands::AppState;
use crate::devices;
use crate::error::{AppError, AppResult};
use crate::smartctl::valid_disk_id;

const CANDIDATES: [&str; 3] = ["/opt/homebrew/bin/fio", "/usr/local/bin/fio", "/opt/local/bin/fio"];
const TEMP_NAME: &str = ".hdi-bench.tmp";
/// Tamaños permitidos del archivo de prueba (MiB).
const SIZES: [u64; 3] = [256, 1024, 4096];
/// Segundos medidos por cada prueba (más 1 s de calentamiento).
const RUNTIME: u64 = 5;

#[derive(Default)]
pub struct BenchState {
    pub cancel: Mutex<Option<Arc<AtomicBool>>>,
    /// Archivo temporal y PID de fio en curso, para limpiar si la app se cierra a mitad.
    pub file: Mutex<Option<PathBuf>>,
    pub pid: Mutex<Option<u32>>,
}

impl BenchState {
    /// Detiene fio y borra el archivo temporal (al salir de la app).
    pub fn cleanup(&self) {
        if let Some(c) = self.cancel.lock().unwrap().as_ref() {
            c.store(true, Ordering::SeqCst);
        }
        if let Some(pid) = self.pid.lock().unwrap().take() {
            // SIGTERM primero: fio libera su memoria compartida al salir. Con SIGKILL
            // el segmento queda huérfano y macOS solo permite 4 MB en total.
            let pid = pid as i32;
            unsafe { libc::kill(pid, libc::SIGTERM) };
            for _ in 0..20 {
                if unsafe { libc::kill(pid, 0) } != 0 {
                    break;
                }
                std::thread::sleep(Duration::from_millis(100));
            }
            unsafe { libc::kill(pid, libc::SIGKILL) };
        }
        if let Some(f) = self.file.lock().unwrap().take() {
            let _ = std::fs::remove_file(f);
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Volume {
    pub id: String,
    pub name: String,
    pub mount: String,
    /// Carpeta donde se crea el archivo de prueba.
    pub dir: String,
    pub free: u64,
    pub fs: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BenchInfo {
    fio: Option<String>,
    version: Option<String>,
    volumes: Vec<Volume>,
    sizes: Vec<u64>,
    runtime: u64,
}

/// Un perfil al estilo CrystalDiskMark: tamaño de bloque, profundidad de cola y patrón.
struct Job {
    key: &'static str,
    bs: &'static str,
    depth: u32,
    random: bool,
    write: bool,
}

const JOBS: [Job; 8] = [
    Job { key: "SEQ1M Q8T1", bs: "1m", depth: 8, random: false, write: false },
    Job { key: "SEQ1M Q8T1", bs: "1m", depth: 8, random: false, write: true },
    Job { key: "SEQ1M Q1T1", bs: "1m", depth: 1, random: false, write: false },
    Job { key: "SEQ1M Q1T1", bs: "1m", depth: 1, random: false, write: true },
    Job { key: "RND4K Q32T1", bs: "4k", depth: 32, random: true, write: false },
    Job { key: "RND4K Q32T1", bs: "4k", depth: 32, random: true, write: true },
    Job { key: "RND4K Q1T1", bs: "4k", depth: 1, random: true, write: false },
    Job { key: "RND4K Q1T1", bs: "4k", depth: 1, random: true, write: true },
];

pub fn locate() -> Option<PathBuf> {
    CANDIDATES.iter().map(PathBuf::from).find(|p| p.is_file())
}

/// Volúmenes montados de un disco físico: particiones directas y volúmenes de los
/// contenedores APFS cuyo almacén físico es una partición de ese disco.
pub fn mounted_on(all: &Value, id: &str) -> Vec<(String, String, String)> {
    let prefix = format!("{id}s");
    let is_ours =
        |dev: &str| dev == id || dev.strip_prefix(&prefix).is_some_and(|r| !r.is_empty() && r.chars().all(|c| c.is_ascii_digit()));
    let mut out = Vec::new();
    let mut push = |v: &Value| {
        if let (Some(dev), Some(mount)) = (v.get("DeviceIdentifier").and_then(Value::as_str), v.get("MountPoint").and_then(Value::as_str)) {
            let name = v.get("VolumeName").and_then(Value::as_str).unwrap_or(dev);
            out.push((dev.to_string(), name.to_string(), mount.to_string()));
        }
    };
    for e in all.get("AllDisksAndPartitions").and_then(Value::as_array).into_iter().flatten() {
        let dev = e.get("DeviceIdentifier").and_then(Value::as_str).unwrap_or("");
        if dev == id {
            push(e);
            for p in e.get("Partitions").and_then(Value::as_array).into_iter().flatten() {
                push(p);
            }
        }
        let stores = e.get("APFSPhysicalStores").and_then(Value::as_array);
        if stores.into_iter().flatten().any(|s| s.get("DeviceIdentifier").and_then(Value::as_str).is_some_and(is_ours)) {
            for v in e.get("APFSVolumes").and_then(Value::as_array).into_iter().flatten() {
                push(v);
            }
        }
    }
    out
}

/// Espacio libre, sistema de archivos y si es de solo lectura (statfs).
fn stat(path: &Path) -> Option<(u64, String, bool)> {
    use std::os::unix::ffi::OsStrExt;
    let c = std::ffi::CString::new(path.as_os_str().as_bytes()).ok()?;
    let mut s: libc::statfs = unsafe { std::mem::zeroed() };
    if unsafe { libc::statfs(c.as_ptr(), &mut s) } != 0 {
        return None;
    }
    let fs = unsafe { std::ffi::CStr::from_ptr(s.f_fstypename.as_ptr()) }.to_string_lossy().to_string();
    Some((s.f_bavail * s.f_bsize as u64, fs, s.f_flags & libc::MNT_RDONLY as u32 != 0))
}

fn writable(dir: &Path) -> bool {
    use std::os::unix::ffi::OsStrExt;
    std::ffi::CString::new(dir.as_os_str().as_bytes()).map(|c| unsafe { libc::access(c.as_ptr(), libc::W_OK) } == 0).unwrap_or(false)
}

async fn volumes(id: &str) -> AppResult<Vec<Volume>> {
    let all = devices::all_disks().await?;
    let mut out = Vec::new();
    for (dev, name, mount) in mounted_on(&all, id) {
        let m = PathBuf::from(&mount);
        let Some((free, fs, ro)) = stat(&m) else { continue };
        if ro {
            continue;
        }
        // En el disco interno la raíz de Datos es de root: se usa la carpeta temporal del usuario.
        let dir = if writable(&m) {
            m.clone()
        } else if mount == "/System/Volumes/Data" {
            std::env::temp_dir()
        } else {
            continue;
        };
        out.push(Volume { id: dev, name, mount, dir: dir.display().to_string(), free, fs });
    }
    Ok(out)
}

fn known(state: &AppState, id: &str) -> AppResult<()> {
    if !valid_disk_id(id) {
        return Err(AppError::InvalidDisk(id.to_string()));
    }
    if !state.known.lock().unwrap().contains(id) {
        return Err(AppError::UnknownDisk(id.to_string()));
    }
    Ok(())
}

#[tauri::command]
pub async fn bench_info(state: State<'_, AppState>, bench: State<'_, BenchState>, id: String) -> AppResult<BenchInfo> {
    known(&state, &id)?;
    let vols = volumes(&id).await?;
    // Restos de una sesión anterior que se cerró de golpe (solo nuestro nombre exacto).
    if bench.cancel.lock().unwrap().is_none() {
        for v in &vols {
            let _ = std::fs::remove_file(PathBuf::from(&v.dir).join(TEMP_NAME));
        }
    }
    let fio = locate();
    let version = match &fio {
        Some(p) => {
            Command::new(p).arg("--version").env_clear().output().await.ok().map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        }
        None => None,
    };
    Ok(BenchInfo { fio: fio.map(|p| p.display().to_string()), version, volumes: vols, sizes: SIZES.to_vec(), runtime: RUNTIME })
}

/// fio usa `:` para separar varios archivos: se escapa.
fn fio_filename(p: &Path) -> String {
    p.display().to_string().replace(':', "\\:")
}

fn job_args(file: &Path, size_mib: u64, j: &Job) -> Vec<String> {
    let rw = match (j.random, j.write) {
        (false, false) => "read",
        (false, true) => "write",
        (true, false) => "randread",
        (true, true) => "randwrite",
    };
    [
        "--name=hdi".to_string(),
        format!("--filename={}", fio_filename(file)),
        format!("--size={size_mib}m"),
        format!("--rw={rw}"),
        format!("--bs={}", j.bs),
        format!("--iodepth={}", j.depth),
        "--numjobs=1".into(),
        // posixaio es el motor asíncrono disponible en macOS; direct=1 activa F_NOCACHE
        // para medir el disco y no la caché de la RAM.
        "--ioengine=posixaio".into(),
        "--direct=1".into(),
        "--invalidate=1".into(),
        "--ramp_time=1".into(),
        format!("--runtime={RUNTIME}"),
        "--time_based".into(),
        "--output-format=json".into(),
        // Informe acumulado cada 500 ms para graficar la velocidad en vivo.
        "--status-interval=500ms".into(),
    ]
    .to_vec()
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct JobResult {
    pub mbps: f64,
    pub iops: f64,
    pub lat_us: f64,
}

/// Lee el resultado de un job de la salida JSON de fio (puede traer avisos antes del JSON).
pub fn parse_result(stdout: &str, write: bool) -> Option<JobResult> {
    let v: Value = serde_json::from_str(&stdout[stdout.find('{')?..]).ok()?;
    let job = v.pointer("/jobs/0")?;
    if job.get("error").and_then(Value::as_i64).unwrap_or(0) != 0 {
        return None;
    }
    let side = job.get(if write { "write" } else { "read" })?;
    Some(JobResult {
        mbps: side.get("bw_bytes").and_then(Value::as_f64)? / 1e6,
        iops: side.get("iops").and_then(Value::as_f64).unwrap_or(0.0),
        lat_us: side.pointer("/lat_ns/mean").and_then(Value::as_f64).unwrap_or(0.0) / 1e3,
    })
}

/// Detiene fio con SIGTERM (libera su memoria compartida) y, si no responde en 3 s, con SIGKILL.
async fn stop_fio(child: &mut tokio::process::Child) {
    if let Some(pid) = child.id() {
        unsafe { libc::kill(pid as i32, libc::SIGTERM) };
    }
    if tokio::time::timeout(Duration::from_secs(3), child.wait()).await.is_err() {
        let _ = child.kill().await;
    }
}

fn pid_file(app: &AppHandle) -> AppResult<PathBuf> {
    let dir = tauri::Manager::path(app).app_cache_dir().map_err(|e| AppError::Other(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("fio-pids"))
}

fn record_pid(file: &Path, pid: u32) {
    use std::io::Write;
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(file) {
        let _ = writeln!(f, "{pid}");
    }
}

/// Segmento de `ipcs -mbop`: (id, procesos conectados, PID creador).
pub fn parse_ipcs(text: &str) -> Vec<(i32, u32, u32)> {
    text.lines()
        .filter(|l| l.starts_with('m'))
        .filter_map(|l| {
            let f: Vec<&str> = l.split_whitespace().collect();
            // T ID KEY MODE OWNER GROUP NATTCH SEGSZ CPID LPID
            if f.len() < 10 {
                return None;
            }
            Some((f[1].parse().ok()?, f[6].parse().ok()?, f[8].parse().ok()?))
        })
        .collect()
}

/// Libera la memoria compartida que dejaron procesos de fio lanzados por esta app y que
/// ya no existen (p. ej. si la app se cerró de golpe). Solo toca segmentos sin procesos
/// conectados cuyo creador es uno de nuestros fio.
async fn reap_orphans(file: &Path) {
    let ours: std::collections::HashSet<u32> =
        std::fs::read_to_string(file).unwrap_or_default().lines().filter_map(|l| l.trim().parse().ok()).collect();
    if ours.is_empty() {
        return;
    }
    let alive = |pid: u32| unsafe { libc::kill(pid as i32, 0) } == 0;
    if let Ok(out) = Command::new("/usr/bin/ipcs").arg("-mbop").env_clear().output().await {
        let segs = parse_ipcs(&String::from_utf8_lossy(&out.stdout));
        log::info!("fio: {} PID registrados, {} segmentos de memoria compartida", ours.len(), segs.len());
        for (id, attached, cpid) in segs {
            if attached == 0 && ours.contains(&cpid) && !alive(cpid) {
                let r = unsafe { libc::shmctl(id, libc::IPC_RMID, std::ptr::null_mut()) };
                log::info!("memoria compartida huérfana de fio {cpid} (segmento {id}) liberada: {}", r == 0);
            }
        }
    }
    let keep: Vec<String> = ours.into_iter().filter(|&p| alive(p)).map(|p| p.to_string()).collect();
    let _ = std::fs::write(file, if keep.is_empty() { String::new() } else { keep.join("\n") + "\n" });
}

/// Separa los documentos JSON que fio imprime uno tras otro (cada uno abre con `{`
/// y cierra con `}` en la columna 0).
#[derive(Default)]
pub struct JsonSplitter {
    buf: String,
    open: bool,
}

impl JsonSplitter {
    pub fn push(&mut self, line: &str) -> Option<String> {
        if !self.open {
            if !line.starts_with('{') {
                return None;
            }
            self.open = true;
            self.buf.clear();
        }
        self.buf.push_str(line);
        self.buf.push('\n');
        if line.starts_with('}') {
            self.open = false;
            return Some(std::mem::take(&mut self.buf));
        }
        None
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Progress {
    pub bytes: u64,
    pub ios: u64,
    pub runtime_ms: u64,
}

/// Totales acumulados de un informe periódico de fio.
pub fn progress_of(doc: &str, write: bool) -> Option<Progress> {
    let v: Value = serde_json::from_str(doc).ok()?;
    let job = v.pointer("/jobs/0")?;
    let side = job.get(if write { "write" } else { "read" })?;
    Some(Progress {
        bytes: side.get("io_bytes").and_then(Value::as_u64)?,
        ios: side.get("total_ios").and_then(Value::as_u64).unwrap_or(0),
        runtime_ms: job.get("job_runtime").and_then(Value::as_u64)?,
    })
}

#[derive(Serialize, Clone)]
struct BenchEvent {
    id: String,
    event: Value,
}

#[tauri::command]
pub async fn bench_run(
    app: AppHandle,
    state: State<'_, AppState>,
    bench: State<'_, BenchState>,
    id: String,
    volume: String,
    size_mib: u64,
) -> AppResult<()> {
    known(&state, &id)?;
    let fio = locate().ok_or_else(|| AppError::Other("fio no está instalado (brew install fio)".into()))?;
    if !SIZES.contains(&size_mib) {
        return Err(AppError::NotAllowed(format!("tamaño {size_mib} MiB")));
    }
    let vol = volumes(&id)
        .await?
        .into_iter()
        .find(|v| v.id == volume)
        .ok_or_else(|| AppError::NotAllowed(format!("el volumen {volume} no pertenece a {id}")))?;
    // Margen: el archivo más 1 GiB libre para no llenar el volumen.
    if vol.free < (size_mib + 1024) * 1024 * 1024 {
        return Err(AppError::Other(format!("espacio insuficiente en «{}»", vol.name)));
    }
    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut cur = bench.cancel.lock().unwrap();
        if cur.is_some() {
            return Err(AppError::NotAllowed("ya hay un benchmark en curso".into()));
        }
        *cur = Some(cancel.clone());
    }
    let pid_file = pid_file(&app)?;
    reap_orphans(&pid_file).await;
    let file = PathBuf::from(&vol.dir).join(TEMP_NAME);
    let _ = std::fs::remove_file(&file);
    *bench.file.lock().unwrap() = Some(file.clone());

    tauri::async_runtime::spawn(async move {
        let emit = |event: Value| {
            let _ = app.emit("bench-event", BenchEvent { id: id.clone(), event });
        };
        emit(serde_json::json!({ "t": "start", "total": JOBS.len(), "seconds": RUNTIME + 1, "volume": vol.name, "sizeMib": size_mib }));
        let mut failed: Option<String> = None;
        for (i, j) in JOBS.iter().enumerate() {
            if cancel.load(Ordering::SeqCst) {
                break;
            }
            emit(serde_json::json!({ "t": "job", "i": i, "key": j.key, "write": j.write }));
            let child = Command::new(&fio)
                .args(job_args(&file, size_mib, j))
                .env_clear()
                .env("LC_ALL", "C")
                .env("PATH", "/usr/bin:/bin:/usr/sbin:/sbin")
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn();
            let mut child = match child {
                Ok(c) => {
                    if let Some(b) = tauri::Manager::try_state::<BenchState>(&app) {
                        *b.pid.lock().unwrap() = c.id();
                    }
                    if let Some(pid) = c.id() {
                        record_pid(&pid_file, pid);
                    }
                    c
                }
                Err(e) => {
                    failed = Some(e.to_string());
                    break;
                }
            };
            // stderr se junta aparte para que un búfer lleno nunca bloquee a fio.
            let err_task = child.stderr.take().map(|mut e| {
                tokio::spawn(async move {
                    use tokio::io::AsyncReadExt;
                    let mut s = String::new();
                    let _ = e.read_to_string(&mut s).await;
                    s
                })
            });
            let mut lines = child.stdout.take().map(|o| tokio::io::BufReader::new(o).lines());
            let mut splitter = JsonSplitter::default();
            let (mut last, mut prev): (Option<String>, Option<Progress>) = (None, None);
            let mut tick = tokio::time::interval(Duration::from_millis(200));
            // Límite de seguridad: la creación del archivo más la prueba.
            let deadline = tokio::time::Instant::now() + Duration::from_secs(RUNTIME + 120);
            let finished = loop {
                let Some(ls) = lines.as_mut() else { break true };
                tokio::select! {
                    l = ls.next_line() => match l {
                        Ok(Some(line)) => {
                            let Some(doc) = splitter.push(&line) else { continue };
                            // Cada informe periódico trae totales acumulados: la velocidad
                            // instantánea es la diferencia con el anterior.
                            if let Some(p) = progress_of(&doc, j.write) {
                                if let Some(q) = prev.filter(|q| p.runtime_ms > q.runtime_ms && p.bytes >= q.bytes) {
                                    let dt = (p.runtime_ms - q.runtime_ms) as f64 / 1000.0;
                                    emit(serde_json::json!({ "t": "tick", "i": i, "write": j.write, "ms": p.runtime_ms,
                                        "mbps": (p.bytes - q.bytes) as f64 / dt / 1e6, "iops": (p.ios.saturating_sub(q.ios)) as f64 / dt }));
                                }
                                prev = Some(p);
                            }
                            last = Some(doc);
                        }
                        _ => break true,
                    },
                    _ = tick.tick() => {
                        if cancel.load(Ordering::SeqCst) || tokio::time::Instant::now() > deadline {
                            stop_fio(&mut child).await;
                            break false;
                        }
                    }
                }
            };
            let _ = child.wait().await;
            let err = match err_task {
                Some(t) => t.await.unwrap_or_default(),
                None => String::new(),
            };
            if !finished {
                if !cancel.load(Ordering::SeqCst) {
                    failed = Some("fio no respondió a tiempo".into());
                }
                break;
            }
            // El último documento es el resultado final del job.
            match last.as_deref().and_then(|out| parse_result(out, j.write)) {
                Some(r) => emit(
                    serde_json::json!({ "t": "result", "i": i, "key": j.key, "write": j.write, "mbps": r.mbps, "iops": r.iops, "latUs": r.lat_us }),
                ),
                None => {
                    let msg = err.lines().find(|l| !l.trim().is_empty()).unwrap_or("fio falló").to_string();
                    failed = Some(if msg.contains("shm") {
                        "macOS no tiene memoria compartida libre para fio (límite de 4 MB). Cierra otros procesos de fio o reinicia la Mac."
                            .into()
                    } else {
                        msg
                    });
                    break;
                }
            }
        }
        let _ = std::fs::remove_file(&file);
        let t = if cancel.load(Ordering::SeqCst) {
            "cancelled"
        } else if failed.is_some() {
            "failed"
        } else {
            "done"
        };
        emit(serde_json::json!({ "t": t, "message": failed }));
        if let Some(b) = tauri::Manager::try_state::<BenchState>(&app) {
            *b.cancel.lock().unwrap() = None;
            *b.pid.lock().unwrap() = None;
            *b.file.lock().unwrap() = None;
        }
    });
    Ok(())
}

#[tauri::command]
pub fn bench_cancel(bench: State<'_, BenchState>) {
    if let Some(c) = bench.cancel.lock().unwrap().as_ref() {
        c.store(true, Ordering::SeqCst);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_apfs_volumes_through_physical_store() {
        let all = serde_json::json!({ "AllDisksAndPartitions": [
            { "DeviceIdentifier": "disk6", "Partitions": [
                { "DeviceIdentifier": "disk6s1", "VolumeName": "EFI" },
                { "DeviceIdentifier": "disk6s2", "Content": "Apple_APFS" } ] },
            { "DeviceIdentifier": "disk7", "APFSPhysicalStores": [{ "DeviceIdentifier": "disk6s2" }],
              "APFSVolumes": [{ "DeviceIdentifier": "disk7s1", "VolumeName": "Datos", "MountPoint": "/Volumes/Datos" }] },
            { "DeviceIdentifier": "disk60", "Partitions": [{ "DeviceIdentifier": "disk60s1", "MountPoint": "/Volumes/Otro" }] },
            { "DeviceIdentifier": "disk8", "APFSPhysicalStores": [{ "DeviceIdentifier": "disk60s2" }],
              "APFSVolumes": [{ "DeviceIdentifier": "disk8s1", "MountPoint": "/Volumes/NoEs" }] },
            { "DeviceIdentifier": "disk9", "Partitions": [{ "DeviceIdentifier": "disk9s1", "VolumeName": "FAT", "MountPoint": "/Volumes/FAT" }] }
        ]});
        assert_eq!(mounted_on(&all, "disk6"), vec![("disk7s1".into(), "Datos".into(), "/Volumes/Datos".into())]);
        assert_eq!(mounted_on(&all, "disk9"), vec![("disk9s1".into(), "FAT".into(), "/Volumes/FAT".into())]);
    }

    #[test]
    fn parses_fio_json_and_escapes_colons() {
        let out = "fio: warning\n{\"jobs\":[{\"error\":0,\"read\":{\"bw_bytes\":3080000000,\"iops\":2938.5,\"lat_ns\":{\"mean\":2720000.0}},\"write\":{\"bw_bytes\":0}}]}";
        assert_eq!(parse_result(out, false), Some(JobResult { mbps: 3080.0, iops: 2938.5, lat_us: 2720.0 }));
        assert_eq!(parse_result("{\"jobs\":[{\"error\":5}]}", false), None);
        assert_eq!(fio_filename(Path::new("/Volumes/a:b/.hdi-bench.tmp")), "/Volumes/a\\:b/.hdi-bench.tmp");
        let args = job_args(Path::new("/V/x"), 1024, &JOBS[5]);
        assert!(args.contains(&"--rw=randwrite".to_string()) && args.contains(&"--iodepth=32".to_string()));
        assert!(!args.iter().any(|a| a.contains("/dev/")));
    }

    #[test]
    fn parses_ipcs_segments() {
        let t = "IPC status from <running system> as of Fri\nT     ID     KEY        MODE       OWNER    GROUP NATTCH  SEGSZ  CPID  LPID\nShared Memory:\nm 2097152 0x00000000 --rw------- usuario        staff      0 1532104  17711  17711\nm 262145 0x00000000 --rw------- usuario        staff      1 1532104  21067  21067\n";
        assert_eq!(parse_ipcs(t), vec![(2097152, 0, 17711), (262145, 1, 21067)]);
    }

    #[test]
    fn splits_periodic_fio_documents() {
        let mut sp = JsonSplitter::default();
        let text = "fio: aviso\n{\n\"jobs\" : [{\"job_runtime\":224,\"read\":{\"io_bytes\":789577728,\"total_ios\":753}}]\n}\n{\n\"jobs\" : [{\"job_runtime\":725,\"read\":{\"io_bytes\":2540699648,\"total_ios\":2423}}]\n}\n";
        let docs: Vec<String> = text.lines().filter_map(|l| sp.push(l)).collect();
        assert_eq!(docs.len(), 2);
        assert_eq!(progress_of(&docs[1], false), Some(Progress { bytes: 2540699648, ios: 2423, runtime_ms: 725 }));
        assert_eq!(progress_of(&docs[0], true), None);
    }
}
