//! Comandos IPC (plan §5.9). El frontend nunca ejecuta procesos: todo pasa por aquí,
//! con identificadores validados contra el registro de discos físicos.

use serde::Serialize;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::devices;
use crate::error::{AppError, AppResult};
use crate::smartctl::{self, CmdResult, Op, SmartctlInfo};
use crate::store::{self, DeviceRow, ReportRow, SnapshotRow};

pub struct AppState {
    pub smartctl: Mutex<Option<PathBuf>>,
    pub configured_path: Mutex<Option<String>>,
    pub known: Mutex<HashSet<String>>,
    pub locks: Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>,
    pub db: Mutex<rusqlite::Connection>,
}

impl AppState {
    fn smartctl_path(&self) -> AppResult<PathBuf> {
        self.smartctl.lock().unwrap().clone().ok_or(AppError::SmartctlMissing)
    }
    /// Cola por disco: nunca dos smartctl a la vez sobre el mismo disco.
    fn lock_for(&self, id: &str) -> Arc<tokio::sync::Mutex<()>> {
        self.locks.lock().unwrap().entry(id.to_string()).or_default().clone()
    }
    fn ensure_known(&self, id: &str) -> AppResult<()> {
        if !smartctl::valid_disk_id(id) {
            return Err(AppError::InvalidDisk(id.to_string()));
        }
        if !self.known.lock().unwrap().contains(id) {
            return Err(AppError::UnknownDisk(id.to_string()));
        }
        Ok(())
    }
}

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvReport {
    pub smartctl: Option<SmartctlInfo>,
    pub error: Option<String>,
    pub app_version: String,
}

/// Localiza smartctl (ruta configurada → rutas conocidas → PATH) y lee su versión.
#[tauri::command]
pub async fn env_check(app: AppHandle, state: State<'_, AppState>, configured: Option<String>) -> AppResult<EnvReport> {
    if configured.is_some() {
        *state.configured_path.lock().unwrap() = configured;
    }
    let conf = state.configured_path.lock().unwrap().clone();
    let path = smartctl::locate(conf.as_deref());
    *state.smartctl.lock().unwrap() = path.clone();
    let app_version = app.package_info().version.to_string();
    Ok(match path {
        None => EnvReport { smartctl: None, error: None, app_version },
        Some(p) => match smartctl::info(&p).await {
            Ok(info) => EnvReport { smartctl: Some(info), error: None, app_version },
            Err(e) => EnvReport { smartctl: None, error: Some(e.to_string()), app_version },
        },
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskEntry {
    pub id: String,
    pub diskutil: Value,
}

/// Discos físicos presentes con su información de diskutil (rápido).
#[tauri::command]
pub async fn list_disks(state: State<'_, AppState>) -> AppResult<Vec<DiskEntry>> {
    let ids = devices::physical_disks().await?;
    *state.known.lock().unwrap() = ids.iter().cloned().collect();
    let mut out = Vec::new();
    for id in ids {
        let diskutil = devices::disk_info(&id).await.unwrap_or(Value::Null);
        out.push(DiskEntry { id, diskutil });
    }
    Ok(out)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskReading {
    pub id: String,
    pub diskutil: Value,
    pub smart: Option<CmdResult>,
    pub error: Option<String>,
}

/// Lectura completa de un disco: `smartctl -x --json=o` + diskutil.
#[tauri::command]
pub async fn read_disk(state: State<'_, AppState>, id: String) -> AppResult<DiskReading> {
    if !state.known.lock().unwrap().contains(&id) {
        // Un disco recién conectado todavía no está en el registro.
        let ids = devices::physical_disks().await?;
        *state.known.lock().unwrap() = ids.into_iter().collect();
    }
    state.ensure_known(&id)?;
    let diskutil = devices::disk_info(&id).await.unwrap_or(Value::Null);
    let path = state.smartctl_path()?;
    let lock = state.lock_for(&id);
    let _g = lock.lock().await;
    match smartctl::run(&path, &id, &[Op::Extended], true, Duration::from_secs(25)).await {
        Ok(r) => Ok(DiskReading { id, diskutil, smart: Some(r), error: None }),
        Err(e) => Ok(DiskReading { id, diskutil, smart: None, error: Some(e.to_string()) }),
    }
}

/// Datos de conexión (system_profiler); lento, el frontend lo pide en segundo plano.
#[tauri::command]
pub async fn read_profiler() -> AppResult<Value> {
    devices::profiler().await
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TempReading {
    pub id: String,
    pub temp: Option<i64>,
    pub sensors: Vec<i64>,
    pub exit: i32,
}

/// Muestreo de temperatura (`smartctl -A -j`) de varios discos.
#[tauri::command]
pub async fn read_temps(state: State<'_, AppState>, ids: Vec<String>) -> AppResult<Vec<TempReading>> {
    let path = state.smartctl_path()?;
    let mut out = Vec::new();
    for id in ids {
        if state.ensure_known(&id).is_err() {
            continue;
        }
        // Si el disco está ocupado (lectura completa en curso) se omite este muestreo.
        let lock = state.lock_for(&id);
        let Ok(_g) = lock.try_lock() else { continue };
        if let Some(r) = exec_json_attributes(&path, &id).await {
            out.push(r);
        }
    }
    Ok(out)
}

async fn exec_json_attributes(path: &std::path::Path, id: &str) -> Option<TempReading> {
    let r = smartctl::run(path, id, &[Op::Attributes], true, Duration::from_secs(6)).await.ok()?;
    let j = r.json.as_ref()?;
    let temp =
        j.pointer("/temperature/current").or_else(|| j.pointer("/nvme_smart_health_information_log/temperature")).and_then(Value::as_i64);
    let sensors = j
        .pointer("/nvme_smart_health_information_log/temperature_sensors")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_i64).collect())
        .unwrap_or_default();
    Some(TempReading { id: id.to_string(), temp, sensors, exit: r.exit })
}

/// Consola: ejecuta operaciones de la allowlist (modo experto incluido).
#[tauri::command]
pub async fn smartctl_run(state: State<'_, AppState>, id: String, flags: Vec<String>, json: bool) -> AppResult<CmdResult> {
    state.ensure_known(&id)?;
    let mut ops = Vec::new();
    for f in &flags {
        ops.push(Op::from_flag(f).ok_or_else(|| AppError::NotAllowed(f.clone()))?);
    }
    if ops.is_empty() {
        return Err(AppError::NotAllowed("sin operaciones".into()));
    }
    let path = state.smartctl_path()?;
    let lock = state.lock_for(&id);
    let _g = lock.lock().await;
    smartctl::run(&path, &id, &ops, json, Duration::from_secs(25)).await
}

/// Autoprueba SMART (solo ATA/SATA). El progreso se sigue con `smartctl -c`.
#[tauri::command]
pub async fn selftest_start(state: State<'_, AppState>, id: String, kind: String) -> AppResult<CmdResult> {
    state.ensure_known(&id)?;
    let path = state.smartctl_path()?;
    let lock = state.lock_for(&id);
    let _g = lock.lock().await;
    smartctl::ata_self_test(&path, &id, &kind).await
}

#[tauri::command]
pub async fn smartctl_scan(state: State<'_, AppState>) -> AppResult<CmdResult> {
    smartctl::scan_open(&state.smartctl_path()?).await
}

#[tauri::command]
pub async fn eject_disk(state: State<'_, AppState>, id: String, internal: bool) -> AppResult<()> {
    state.ensure_known(&id)?;
    devices::eject(&id, internal).await
}

// ── Historial ──

#[tauri::command]
pub fn history_add(state: State<'_, AppState>, device: DeviceRow, source: String, data: Value) -> AppResult<i64> {
    let db = state.db.lock().unwrap();
    store::add_snapshot(&db, &device, &source, &data, now_ms())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryDump {
    pub devices: Vec<DeviceRow>,
    pub snapshots: HashMap<String, Vec<SnapshotRow>>,
}

#[tauri::command]
pub fn history_all(state: State<'_, AppState>) -> AppResult<HistoryDump> {
    let db = state.db.lock().unwrap();
    let devices = store::devices(&db)?;
    let mut snapshots = HashMap::new();
    for d in &devices {
        snapshots.insert(d.key.clone(), store::snapshots(&db, &d.key)?);
    }
    Ok(HistoryDump { devices, snapshots })
}

#[tauri::command]
pub fn history_clear(state: State<'_, AppState>) -> AppResult<()> {
    store::clear_history(&state.db.lock().unwrap())
}

// ── Reportes y exportación ──

#[tauri::command]
pub fn reports_list(state: State<'_, AppState>) -> AppResult<Vec<ReportRow>> {
    store::reports(&state.db.lock().unwrap())
}

#[tauri::command]
pub fn reports_add(state: State<'_, AppState>, report: ReportRow) -> AppResult<()> {
    store::add_report(&state.db.lock().unwrap(), &report)
}

#[tauri::command]
pub fn reports_delete(state: State<'_, AppState>, id: String) -> AppResult<()> {
    store::delete_report(&state.db.lock().unwrap(), &id)
}

/// Pide la ruta con el diálogo nativo de guardado y escribe el contenido de texto.
/// Devuelve la ruta elegida o `None` si se canceló.
#[tauri::command]
pub async fn save_text_file(app: AppHandle, file_name: String, extension: String, content: String) -> AppResult<Option<String>> {
    let Some(path) = pick_save_path(&app, &file_name, &extension) else { return Ok(None) };
    tokio::fs::write(&path, content).await?;
    Ok(Some(path.display().to_string()))
}

pub fn pick_save_path(app: &AppHandle, file_name: &str, extension: &str) -> Option<PathBuf> {
    let docs = app.path().document_dir().ok().map(|d| d.join("NVitals Drive"));
    if let Some(d) = &docs {
        let _ = std::fs::create_dir_all(d);
    }
    let mut dlg = app.dialog().file().set_file_name(file_name).add_filter(extension.to_uppercase(), &[extension]);
    if let Some(d) = docs {
        dlg = dlg.set_directory(d);
    }
    dlg.blocking_save_file().and_then(|p| p.into_path().ok())
}

/// "Mostrar en Finder".
#[tauri::command]
pub async fn reveal_in_finder(path: String) -> AppResult<()> {
    let p = PathBuf::from(&path);
    if !p.is_absolute() {
        return Err(AppError::NotAllowed(path));
    }
    tokio::process::Command::new("/usr/bin/open").arg("-R").arg(&p).status().await?;
    Ok(())
}

#[tauri::command]
pub fn settings_get(state: State<'_, AppState>) -> AppResult<Value> {
    store::get_settings(&state.db.lock().unwrap())
}

#[tauri::command]
pub fn settings_set(state: State<'_, AppState>, patch: serde_json::Map<String, Value>) -> AppResult<()> {
    store::set_settings(&state.db.lock().unwrap(), &patch)
}

/// Errores de la interfaz hacia el log del núcleo (diagnóstico).
#[tauri::command]
pub fn ui_log(level: String, message: String) {
    let msg: String = message.chars().take(4000).collect();
    if level == "error" {
        log::error!("[ui] {msg}")
    } else {
        log::info!("[ui] {msg}")
    }
}

use tauri::Manager;
