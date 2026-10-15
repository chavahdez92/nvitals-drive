//! Orquestación del escaneo de lectura (plan §8.2): lanza el helper como root con el
//! diálogo nativo de contraseña de macOS, mantiene el heartbeat, evita el reposo con
//! `caffeinate` y reenvía cada línea de progreso como evento `scan-event`.

use serde::Serialize;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::AsyncBufReadExt;

use crate::commands::AppState;
use crate::error::{AppError, AppResult};

#[derive(Default)]
pub struct ScanState {
    pub current: Mutex<Option<Running>>,
}

pub struct Running {
    pub id: String,
    pub cancel: PathBuf,
}

#[derive(Serialize, Clone)]
struct ScanEvent {
    id: String,
    event: Value,
}

/// Script AppleScript: los argumentos llegan por argv (sin interpolar en el código).
const SCRIPT: &str = r#"on run argv
set n to count of argv
set cmd to quoted form of item 1 of argv
repeat with i from 2 to (n - 1)
set cmd to cmd & " " & quoted form of item i of argv
end repeat
do shell script cmd with administrator privileges with prompt (item n of argv)
end run"#;

/// ¿Touch ID habilitado para sudo? (`auth sufficient pam_tid.so` activo en /etc/pam.d/sudo_local)
pub fn touch_id_enabled() -> bool {
    std::fs::read_to_string("/etc/pam.d/sudo_local")
        .map(|t| {
            t.lines().any(|l| {
                let l = l.trim();
                !l.starts_with('#') && l.contains("pam_tid.so")
            })
        })
        .unwrap_or(false)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthInfo {
    touch_id: bool,
    enable_command: &'static str,
}

#[tauri::command]
pub fn auth_info() -> AuthInfo {
    AuthInfo {
        touch_id: touch_id_enabled(),
        enable_command: "sed -e 's/^#auth/auth/' /etc/pam.d/sudo_local.template | sudo tee /etc/pam.d/sudo_local",
    }
}

/// Abre el dispositivo desde la app (proceso principal). macOS muestra aquí su diálogo de
/// privacidad «Volúmenes extraíbles»; el helper hereda el permiso concedido a la app.
fn probe_raw_access(id: &str) -> AppResult<()> {
    match std::fs::File::open(format!("/dev/r{id}")) {
        Ok(_) => Ok(()),
        Err(e) if e.raw_os_error() == Some(libc::EPERM) => Err(AppError::DiskAccessDenied),
        // EACCES: los permisos Unix exigen root (lo resuelve el helper); la privacidad ya pasó.
        Err(_) => Ok(()),
    }
}

#[tauri::command]
pub async fn open_privacy_settings(which: String) -> AppResult<()> {
    let anchor = if which == "full" { "Privacy_AllFiles" } else { "Privacy_RemovableVolumes" };
    tokio::process::Command::new("/usr/bin/open")
        .arg(format!("x-apple.systempreferences:com.apple.preference.security?{anchor}"))
        .status()
        .await?;
    Ok(())
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub async fn scan_start(
    app: AppHandle,
    state: State<'_, AppState>,
    scans: State<'_, ScanState>,
    id: String,
    mode: String,
    internal: bool,
    keep_awake: bool,
    duration: Option<u64>,
) -> AppResult<()> {
    if !crate::smartctl::valid_disk_id(&id) || !state.known.lock().unwrap().contains(&id) {
        return Err(AppError::UnknownDisk(id));
    }
    if internal || id == "disk0" {
        return Err(AppError::NotAllowed("el escaneo no está disponible para el disco interno".into()));
    }
    if !["full", "quick", "stress"].contains(&mode.as_str()) {
        return Err(AppError::NotAllowed(mode));
    }
    let id_probe = id.clone();
    tokio::task::spawn_blocking(move || probe_raw_access(&id_probe)).await.map_err(|e| AppError::Other(e.to_string()))??;
    let duration = duration.unwrap_or(600).clamp(30, 3600).to_string();
    if scans.current.lock().unwrap().is_some() {
        return Err(AppError::NotAllowed("ya hay un escaneo en curso".into()));
    }
    let dir = app.path().app_cache_dir().map_err(|e| AppError::Other(e.to_string()))?.join("scan");
    std::fs::create_dir_all(&dir)?;
    let progress = dir.join("progress.jsonl");
    let cancel = dir.join("cancel");
    let heartbeat = dir.join("heartbeat");
    for f in [&progress, &cancel] {
        let _ = std::fs::remove_file(f);
    }
    std::fs::write(&progress, b"")?;
    std::fs::write(&heartbeat, b"")?;
    let exe = std::env::current_exe()?;

    let helper_args: Vec<String> = vec![
        "--hdi-scan".into(),
        "--device".into(),
        id.clone(),
        "--mode".into(),
        mode.clone(),
        "--duration".into(),
        duration.clone(),
        "--progress".into(),
        progress.display().to_string(),
        "--cancel".into(),
        cancel.display().to_string(),
        "--heartbeat".into(),
        heartbeat.display().to_string(),
    ];
    let use_touch_id = touch_id_enabled();
    *scans.current.lock().unwrap() = Some(Running { id: id.clone(), cancel: cancel.clone() });

    let app2 = app.clone();
    tauri::async_runtime::spawn(async move {
        let emit = |event: Value| {
            let _ = app2.emit("scan-event", ScanEvent { id: id.clone(), event });
        };
        // Intentos: Touch ID (sudo + pam_tid) y, si no se autoriza, el diálogo de contraseña.
        let attempts: &[bool] = if use_touch_id { &[true, false] } else { &[false] };
        let (mut saw_done, mut offset, mut stderr, mut code) = (false, 0usize, String::new(), None);
        for (i, &touch) in attempts.iter().enumerate() {
            if i > 0 {
                emit(serde_json::json!({ "t": "auth-fallback" }));
            }
            let mut child = match spawn_privileged(&exe, &helper_args, touch) {
                Ok(c) => c,
                Err(e) => {
                    stderr = e.to_string();
                    continue;
                }
            };
            // Mantener la Mac despierta mientras dure la prueba.
            let caffeinate = if keep_awake {
                child.id().and_then(|pid| {
                    tokio::process::Command::new("/usr/bin/caffeinate")
                        .args(["-ims", "-w", &pid.to_string()])
                        .kill_on_drop(true)
                        .spawn()
                        .ok()
                })
            } else {
                None
            };
            let mut buf = String::new();
            let mut beat = tokio::time::interval(Duration::from_millis(250));
            let mut n = 0u32;
            let pump = |offset: &mut usize, buf: &mut String, saw_done: &mut bool| {
                if let Ok(text) = std::fs::read_to_string(&progress) {
                    if text.len() > *offset {
                        buf.push_str(&text[*offset..]);
                        *offset = text.len();
                        while let Some(nl) = buf.find('\n') {
                            let line: String = buf.drain(..=nl).collect();
                            if let Ok(v) = serde_json::from_str::<Value>(line.trim()) {
                                *saw_done |= v.get("t").and_then(Value::as_str) == Some("done");
                                emit(v);
                            }
                        }
                    }
                }
            };
            let status = loop {
                tokio::select! {
                    s = child.wait() => break s.ok(),
                    _ = beat.tick() => {
                        n = n.wrapping_add(1);
                        if n % 8 == 0 { let _ = std::fs::write(&heartbeat, n.to_string()); }
                        pump(&mut offset, &mut buf, &mut saw_done);
                    }
                }
            };
            buf.push('\n');
            pump(&mut offset, &mut buf, &mut saw_done);
            code = status.and_then(|s| s.code());
            stderr.clear();
            if let Some(mut e) = child.stderr.take() {
                let mut lines = tokio::io::BufReader::new(&mut e).lines();
                while let Ok(Some(l)) = lines.next_line().await {
                    stderr.push_str(&l);
                }
            }
            if let Some(mut c) = caffeinate {
                let _ = c.kill().await;
            }
            // Se reintenta solo si el helper nunca llegó a ejecutarse (autorización fallida).
            if saw_done || offset > 0 || stderr.contains("-128") {
                break;
            }
        }
        if !saw_done && offset == 0 {
            // -128: el usuario canceló el diálogo de contraseña.
            let kind = if stderr.contains("-128") { "auth-cancelled" } else { "failed" };
            emit(serde_json::json!({ "t": kind, "message": stderr, "code": code }));
        }
        if let Some(s) = app2.try_state::<ScanState>() {
            *s.current.lock().unwrap() = None;
        }
    });
    Ok(())
}

#[tauri::command]
pub fn scan_cancel(scans: State<'_, ScanState>) -> AppResult<()> {
    if let Some(r) = scans.current.lock().unwrap().as_ref() {
        std::fs::write(&r.cancel, b"1")?;
        log::info!("cancelando escaneo de {}", r.id);
    }
    Ok(())
}

/// Lanza el helper como root: con `sudo` (Touch ID vía pam_tid) o con el diálogo de
/// contraseña de macOS (`osascript … with administrator privileges`). Sin shell en ambos casos.
fn spawn_privileged(exe: &std::path::Path, args: &[String], touch_id: bool) -> AppResult<tokio::process::Child> {
    let mut cmd = if touch_id {
        let mut c = tokio::process::Command::new("/usr/bin/sudo");
        c.arg("--prompt=").arg("--").arg(exe).args(args).stdin(std::process::Stdio::null());
        c
    } else {
        let mut c = tokio::process::Command::new("/usr/bin/osascript");
        c.arg("-e")
            .arg(SCRIPT)
            .arg(exe.display().to_string())
            .args(args)
            .arg("NVitals Drive necesita leer el disco en modo de solo lectura para escanear su superficie. Nunca escribe en él.");
        c
    };
    Ok(cmd.stdout(std::process::Stdio::null()).stderr(std::process::Stdio::piped()).kill_on_drop(true).spawn()?)
}
