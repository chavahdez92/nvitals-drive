//! Expedientes de discos: ficha por número de serie (estado, lote, proveedor, destino,
//! costo, precio y notas) con sus revisiones (lectura completa guardada) y una carpeta
//! por serie con el PDF y el JSON crudo de cada revisión.
//!
//! Seguridad: el serial y los nombres de archivo se validan y la ruta final siempre se
//! arma aquí (`<raíz>/<serie>/<archivo>`), dentro de la raíz de expedientes. Nada de
//! esto escribe en los discos analizados.

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

use crate::commands::AppState;
use crate::error::{AppError, AppResult};
use crate::store;

pub const STATUSES: [&str; 4] = ["stock", "sold", "installed", "discarded"];
const ROOT_KEY: &str = "inventoryDir";

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

/// Número de serie apto como clave y como nombre de carpeta.
pub fn valid_serial(s: &str) -> bool {
    let mut chars = s.chars();
    let Some(first) = chars.next() else { return false };
    s.len() <= 64
        && first.is_ascii_alphanumeric()
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
        && !s.contains("..")
}

/// Nombre de archivo sin rutas: letras/números (con acentos), espacio y `._()-`; .pdf/.json/.html.
pub fn valid_file_name(name: &str) -> bool {
    let ext_ok = [".pdf", ".json", ".html"].iter().any(|e| name.to_ascii_lowercase().ends_with(e));
    ext_ok
        && name.chars().count() <= 150
        && !name.starts_with('.')
        && !name.contains("..")
        && name.chars().all(|c| c.is_alphanumeric() || matches!(c, ' ' | '.' | '_' | '(' | ')' | '-'))
}

/// `<raíz>/<serie>/<archivo>`, validado y dentro de la raíz.
pub fn target_path(root: &Path, serial: &str, name: &str) -> AppResult<PathBuf> {
    if !valid_serial(serial) {
        return Err(AppError::NotAllowed(format!("número de serie no válido: {serial}")));
    }
    if !valid_file_name(name) {
        return Err(AppError::NotAllowed(format!("nombre de archivo no válido: {name}")));
    }
    let dir = root.join(serial);
    let path = dir.join(name);
    if path.parent() != Some(dir.as_path()) || !path.starts_with(root) {
        return Err(AppError::NotAllowed(name.to_string()));
    }
    Ok(path)
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct InventoryRecord {
    pub serial: String,
    pub device_key: String,
    pub model: String,
    pub vendor: Option<String>,
    pub capacity_bytes: Option<i64>,
    pub status: String,
    pub lot: Option<String>,
    pub supplier: Option<String>,
    pub destination: Option<String>,
    pub cost: Option<f64>,
    pub price: Option<f64>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Campos comerciales editables de la ficha.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct InventoryPatch {
    pub status: String,
    pub lot: Option<String>,
    pub supplier: Option<String>,
    pub destination: Option<String>,
    pub cost: Option<f64>,
    pub price: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct NewCheck {
    pub verdict: Option<String>,
    pub life: Option<i64>,
    pub disk: Value,
    pub raw: Value,
    pub extras: Value,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckRow {
    pub id: i64,
    pub serial: String,
    pub taken_at: i64,
    pub verdict: Option<String>,
    pub life: Option<i64>,
    pub disk: Value,
    pub raw: Value,
    pub extras: Value,
    pub pdf_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckSummary {
    pub id: i64,
    pub taken_at: i64,
    pub verdict: Option<String>,
    pub life: Option<i64>,
    /// Uso del disco en esa revisión (sacado de `disk_json`): horas de encendido, TB escritos y capacidad.
    pub hours: Option<f64>,
    #[serde(rename = "writtenTB")]
    pub written_tb: Option<f64>,
    #[serde(rename = "capacityTB")]
    pub capacity_tb: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListRow {
    #[serde(flatten)]
    pub record: InventoryRecord,
    pub checks: i64,
    pub last: Option<CheckSummary>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Dossier {
    pub record: InventoryRecord,
    pub checks: Vec<CheckRow>,
    pub folder: String,
}

/// Revisión más reciente de un expediente, sin el JSON crudo de smartctl.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestCheck {
    pub id: i64,
    pub taken_at: i64,
    pub verdict: Option<String>,
    pub life: Option<i64>,
    pub disk: Value,
    pub extras: Value,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestRow {
    #[serde(flatten)]
    pub record: InventoryRecord,
    pub check: Option<LatestCheck>,
}

/// Tope de expedientes por consulta de `latest`.
pub const LATEST_MAX: usize = 1000;

fn clean(s: &Option<String>) -> Option<String> {
    s.as_ref().map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn check_status(status: &str) -> AppResult<()> {
    if STATUSES.contains(&status) {
        Ok(())
    } else {
        Err(AppError::NotAllowed(format!("estado: {status}")))
    }
}

// ── SQL ──

const RECORD_COLS: &str =
    "serial, device_key, model, vendor, capacity_bytes, status, lot, supplier, destination, cost, price, notes, created_at, updated_at";

fn record_row(r: &rusqlite::Row) -> rusqlite::Result<InventoryRecord> {
    Ok(InventoryRecord {
        serial: r.get(0)?,
        device_key: r.get(1)?,
        model: r.get(2)?,
        vendor: r.get(3)?,
        capacity_bytes: r.get(4)?,
        status: r.get(5)?,
        lot: r.get(6)?,
        supplier: r.get(7)?,
        destination: r.get(8)?,
        cost: r.get(9)?,
        price: r.get(10)?,
        notes: r.get(11)?,
        created_at: r.get(12)?,
        updated_at: r.get(13)?,
    })
}

/// Crea o actualiza la ficha y agrega una revisión, en una sola transacción.
pub fn add(conn: &mut Connection, rec: &InventoryRecord, check: &NewCheck, now: i64) -> AppResult<i64> {
    if !valid_serial(&rec.serial) {
        return Err(AppError::NotAllowed(format!("número de serie no válido: {}", rec.serial)));
    }
    let status = if rec.status.is_empty() { "stock" } else { rec.status.as_str() };
    check_status(status)?;
    let tx = conn.transaction()?;
    tx.execute(
        &format!(
            "INSERT INTO inventory ({RECORD_COLS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
             ON CONFLICT(serial) DO UPDATE SET device_key = excluded.device_key, model = excluded.model, vendor = excluded.vendor,
               capacity_bytes = excluded.capacity_bytes, status = excluded.status, lot = excluded.lot, supplier = excluded.supplier,
               destination = excluded.destination, cost = excluded.cost, price = excluded.price, notes = excluded.notes, updated_at = excluded.updated_at"
        ),
        params![
            rec.serial, rec.device_key, rec.model, clean(&rec.vendor), rec.capacity_bytes, status, clean(&rec.lot), clean(&rec.supplier),
            clean(&rec.destination), rec.cost, rec.price, clean(&rec.notes), now
        ],
    )?;
    tx.execute(
        "INSERT INTO inventory_checks (serial, taken_at, verdict, life, disk_json, raw_json, extras_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![rec.serial, now, check.verdict, check.life, check.disk.to_string(), check.raw.to_string(), check.extras.to_string()],
    )?;
    let id = tx.last_insert_rowid();
    tx.commit()?;
    Ok(id)
}

pub fn update(conn: &Connection, serial: &str, p: &InventoryPatch, now: i64) -> AppResult<()> {
    check_status(&p.status)?;
    let n = conn.execute(
        "UPDATE inventory SET status = ?2, lot = ?3, supplier = ?4, destination = ?5, cost = ?6, price = ?7, notes = ?8, updated_at = ?9 WHERE serial = ?1",
        params![serial, p.status, clean(&p.lot), clean(&p.supplier), clean(&p.destination), p.cost, p.price, clean(&p.notes), now],
    )?;
    if n == 0 {
        return Err(AppError::Other(format!("no existe el expediente {serial}")));
    }
    Ok(())
}

pub fn set_pdf(conn: &Connection, check_id: i64, path: &str) -> AppResult<()> {
    conn.execute("UPDATE inventory_checks SET pdf_path = ?2 WHERE id = ?1", params![check_id, path])?;
    Ok(())
}

pub fn delete(conn: &Connection, serial: &str) -> AppResult<()> {
    conn.execute("DELETE FROM inventory WHERE serial = ?1", params![serial])?;
    Ok(())
}

/// Número de `json_extract`: entero o real; cualquier otra cosa (texto, NULL) cuenta como ausente.
fn num(v: rusqlite::types::ValueRef<'_>) -> Option<f64> {
    match v {
        rusqlite::types::ValueRef::Integer(i) => Some(i as f64),
        rusqlite::types::ValueRef::Real(f) if f.is_finite() => Some(f),
        _ => None,
    }
}

pub fn list(conn: &Connection) -> AppResult<Vec<ListRow>> {
    let mut st = conn.prepare(&format!("SELECT {RECORD_COLS} FROM inventory ORDER BY updated_at DESC"))?;
    let records: Vec<InventoryRecord> = st.query_map([], record_row)?.collect::<Result<_, _>>()?;
    // Solo los campos de uso del JSON del disco (sin parsearlo completo); NULL si falta o no es JSON válido.
    let mut last_st = conn.prepare(
        "SELECT id, taken_at, verdict, life, \
         CASE WHEN json_valid(disk_json) THEN json_extract(disk_json, '$.hours') END, \
         CASE WHEN json_valid(disk_json) THEN json_extract(disk_json, '$.writtenTB') END, \
         CASE WHEN json_valid(disk_json) THEN json_extract(disk_json, '$.capacityTB') END \
         FROM inventory_checks WHERE serial = ?1 ORDER BY taken_at DESC, id DESC LIMIT 1",
    )?;
    let mut count_st = conn.prepare("SELECT COUNT(*) FROM inventory_checks WHERE serial = ?1")?;
    let mut out = Vec::with_capacity(records.len());
    for record in records {
        let last = last_st
            .query_row(params![record.serial], |r| {
                Ok(CheckSummary {
                    id: r.get(0)?,
                    taken_at: r.get(1)?,
                    verdict: r.get(2)?,
                    life: r.get(3)?,
                    hours: num(r.get_ref(4)?),
                    written_tb: num(r.get_ref(5)?),
                    capacity_tb: num(r.get_ref(6)?),
                })
            })
            .optional()?;
        let checks: i64 = count_st.query_row(params![record.serial], |r| r.get(0))?;
        out.push(ListRow { record, checks, last });
    }
    Ok(out)
}

pub fn get(conn: &Connection, serial: &str) -> AppResult<Option<(InventoryRecord, Vec<CheckRow>)>> {
    let rec = conn.query_row(&format!("SELECT {RECORD_COLS} FROM inventory WHERE serial = ?1"), params![serial], record_row).optional()?;
    let Some(rec) = rec else { return Ok(None) };
    let mut st = conn.prepare(
        "SELECT id, serial, taken_at, verdict, life, disk_json, raw_json, extras_json, pdf_path FROM inventory_checks WHERE serial = ?1 ORDER BY taken_at ASC, id ASC",
    )?;
    let parse = |s: Option<String>| s.and_then(|v| serde_json::from_str(&v).ok()).unwrap_or(Value::Null);
    let checks = st
        .query_map(params![serial], |r| {
            Ok(CheckRow {
                id: r.get(0)?,
                serial: r.get(1)?,
                taken_at: r.get(2)?,
                verdict: r.get(3)?,
                life: r.get(4)?,
                disk: parse(r.get(5)?),
                raw: parse(r.get(6)?),
                extras: parse(r.get(7)?),
                pdf_path: r.get(8)?,
            })
        })?
        .collect::<Result<_, _>>()?;
    Ok(Some((rec, checks)))
}

/// Ficha y última revisión de varios expedientes (reporte rápido de varios discos), en el
/// orden pedido y sin repetir. Las series que no existen se omiten. Solo lectura.
pub fn latest(conn: &Connection, serials: &[String]) -> AppResult<Vec<LatestRow>> {
    if serials.len() > LATEST_MAX {
        return Err(AppError::NotAllowed(format!("demasiados expedientes: {}", serials.len())));
    }
    if let Some(bad) = serials.iter().find(|s| !valid_serial(s)) {
        return Err(AppError::NotAllowed(format!("número de serie no válido: {bad}")));
    }
    let mut rec_st = conn.prepare(&format!("SELECT {RECORD_COLS} FROM inventory WHERE serial = ?1"))?;
    let mut check_st = conn.prepare(
        "SELECT id, taken_at, verdict, life, disk_json, extras_json FROM inventory_checks WHERE serial = ?1 ORDER BY taken_at DESC, id DESC LIMIT 1",
    )?;
    let parse = |s: Option<String>| s.and_then(|v| serde_json::from_str(&v).ok()).unwrap_or(Value::Null);
    let mut seen = std::collections::HashSet::new();
    let mut out = Vec::with_capacity(serials.len());
    for serial in serials {
        if !seen.insert(serial.as_str()) {
            continue;
        }
        let Some(record) = rec_st.query_row(params![serial], record_row).optional()? else { continue };
        let check = check_st
            .query_row(params![serial], |r| {
                Ok(LatestCheck {
                    id: r.get(0)?,
                    taken_at: r.get(1)?,
                    verdict: r.get(2)?,
                    life: r.get(3)?,
                    disk: parse(r.get(4)?),
                    extras: parse(r.get(5)?),
                })
            })
            .optional()?;
        out.push(LatestRow { record, check });
    }
    Ok(out)
}

// ── Carpeta de expedientes ──

/// Raíz de expedientes: ajuste `inventoryDir` o `~/Documents/NVitals Drive/Expedientes`.
pub fn root(app: &AppHandle, conn: &Connection) -> AppResult<PathBuf> {
    #[cfg(debug_assertions)]
    if let Ok(dir) = std::env::var("HDI_INVENTORY_DIR") {
        return Ok(PathBuf::from(dir));
    }
    let configured = store::get_settings(conn)?.get(ROOT_KEY).and_then(Value::as_str).map(PathBuf::from).filter(|p| p.is_absolute());
    match configured {
        Some(p) => Ok(p),
        None => Ok(app.path().document_dir().map_err(|e| AppError::Other(e.to_string()))?.join("NVitals Drive").join("Expedientes")),
    }
}

fn root_of(app: &AppHandle, state: &AppState) -> AppResult<PathBuf> {
    root(app, &state.db.lock().unwrap())
}

// ── Comandos ──

#[tauri::command]
pub fn inventory_list(state: State<'_, AppState>) -> AppResult<Vec<ListRow>> {
    list(&state.db.lock().unwrap())
}

#[tauri::command]
pub fn inventory_get(app: AppHandle, state: State<'_, AppState>, serial: String) -> AppResult<Option<Dossier>> {
    let root = root_of(&app, &state)?;
    let found = get(&state.db.lock().unwrap(), &serial)?;
    Ok(found.map(|(record, checks)| Dossier { folder: root.join(&record.serial).display().to_string(), record, checks }))
}

/// Última revisión de varios expedientes, para el reporte rápido de varios discos.
#[tauri::command]
pub fn inventory_latest(state: State<'_, AppState>, serials: Vec<String>) -> AppResult<Vec<LatestRow>> {
    latest(&state.db.lock().unwrap(), &serials)
}

#[tauri::command]
pub fn inventory_add(state: State<'_, AppState>, record: InventoryRecord, check: NewCheck) -> AppResult<i64> {
    add(&mut state.db.lock().unwrap(), &record, &check, now_ms())
}

#[tauri::command]
pub fn inventory_update(state: State<'_, AppState>, serial: String, patch: InventoryPatch) -> AppResult<()> {
    update(&state.db.lock().unwrap(), &serial, &patch, now_ms())
}

#[tauri::command]
pub fn inventory_delete(state: State<'_, AppState>, serial: String) -> AppResult<()> {
    delete(&state.db.lock().unwrap(), &serial)
}

/// PDF de una revisión, directo a la carpeta del expediente (sin diálogo).
#[tauri::command]
pub async fn inventory_export_pdf(
    app: AppHandle,
    state: State<'_, AppState>,
    serial: String,
    file_name: String,
    hash: String,
    paper: String,
    check_id: Option<i64>,
) -> AppResult<String> {
    let dest = target_path(&root_of(&app, &state)?, &serial, &file_name)?;
    if let Some(dir) = dest.parent() {
        std::fs::create_dir_all(dir)?;
    }
    crate::pdf::print_report(&app, &dest, &hash, &paper).await?;
    let path = dest.display().to_string();
    if let Some(id) = check_id {
        set_pdf(&state.db.lock().unwrap(), id, &path)?;
    }
    Ok(path)
}

/// JSON crudo o HTML de una revisión, en la carpeta del expediente.
#[tauri::command]
pub async fn inventory_save_file(
    app: AppHandle,
    state: State<'_, AppState>,
    serial: String,
    file_name: String,
    content: String,
) -> AppResult<String> {
    let dest = target_path(&root_of(&app, &state)?, &serial, &file_name)?;
    if let Some(dir) = dest.parent() {
        std::fs::create_dir_all(dir)?;
    }
    tokio::fs::write(&dest, content).await?;
    Ok(dest.display().to_string())
}

/// Abre la carpeta del expediente en Finder (la crea si aún no existe).
#[tauri::command]
pub async fn inventory_reveal(app: AppHandle, state: State<'_, AppState>, serial: String) -> AppResult<()> {
    if !valid_serial(&serial) {
        return Err(AppError::NotAllowed(serial));
    }
    let dir = root_of(&app, &state)?.join(&serial);
    std::fs::create_dir_all(&dir)?;
    tokio::process::Command::new("/usr/bin/open").arg(&dir).status().await?;
    Ok(())
}

#[tauri::command]
pub fn inventory_root(app: AppHandle, state: State<'_, AppState>) -> AppResult<String> {
    Ok(root_of(&app, &state)?.display().to_string())
}

/// Elegir otra carpeta raíz (diálogo nativo). Devuelve la nueva ruta o `None` si se canceló.
#[tauri::command]
pub async fn inventory_pick_root(app: AppHandle, state: State<'_, AppState>) -> AppResult<Option<String>> {
    let current = root_of(&app, &state)?;
    let picked =
        app.dialog().file().set_directory(current.parent().unwrap_or(&current)).blocking_pick_folder().and_then(|p| p.into_path().ok());
    let Some(dir) = picked else { return Ok(None) };
    let mut patch = serde_json::Map::new();
    patch.insert(ROOT_KEY.into(), Value::String(dir.display().to_string()));
    store::set_settings(&state.db.lock().unwrap(), &patch)?;
    Ok(Some(dir.display().to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn mem() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        store::migrate(&c).unwrap();
        c
    }

    fn rec(serial: &str) -> InventoryRecord {
        InventoryRecord {
            serial: serial.into(),
            device_key: format!("KINGSTON|{serial}"),
            model: "KINGSTON SNV2S1000G".into(),
            status: "stock".into(),
            lot: Some(" Lote 20 ".into()),
            ..Default::default()
        }
    }

    fn check(life: i64) -> NewCheck {
        NewCheck {
            verdict: Some("optimal".into()),
            life: Some(life),
            disk: json!({ "life": life }),
            raw: json!({ "smartctl": {} }),
            extras: json!({}),
        }
    }

    #[test]
    fn validates_serials_and_file_names() {
        for ok in ["95815F87012E7D03", "S7DN-NJ0W_1.2", "a"] {
            assert!(valid_serial(ok), "{ok}");
        }
        for bad in ["", "../x", "a/b", ".hidden", "a..b", "con espacio", &"x".repeat(65)] {
            assert!(!valid_serial(bad), "{bad}");
        }
        assert!(valid_file_name("HDI-20260928-0001 SNV2S1000G (rápido).pdf"));
        for bad in ["../x.pdf", "a/b.pdf", ".x.pdf", "x.sh", "x.pdf/..", "nombre"] {
            assert!(!valid_file_name(bad), "{bad}");
        }
        let root = Path::new("/tmp/exp");
        assert_eq!(target_path(root, "SN1", "r.pdf").unwrap(), Path::new("/tmp/exp/SN1/r.pdf"));
        assert!(target_path(root, "../SN1", "r.pdf").is_err());
        assert!(target_path(root, "SN1", "../r.pdf").is_err());
    }

    #[test]
    fn adds_records_with_checks_updates_and_cascades() {
        let mut c = mem();
        let id1 = add(&mut c, &rec("SN1"), &check(95), 100).unwrap();
        let id2 = add(&mut c, &InventoryRecord { status: "sold".into(), ..rec("SN1") }, &check(94), 200).unwrap();
        assert!(id2 > id1);
        let rows = list(&c).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].checks, 2);
        assert_eq!(rows[0].last.as_ref().unwrap().life, Some(94));
        assert_eq!(rows[0].record.lot.as_deref(), Some("Lote 20"));
        assert_eq!((rows[0].record.created_at, rows[0].record.updated_at), (100, 200));
        assert_eq!(rows[0].record.status, "sold");

        update(
            &c,
            "SN1",
            &InventoryPatch {
                status: "installed".into(),
                destination: Some("Equipo contabilidad".into()),
                price: Some(850.0),
                ..Default::default()
            },
            300,
        )
        .unwrap();
        set_pdf(&c, id2, "/tmp/exp/SN1/r.pdf").unwrap();
        let (r, checks) = get(&c, "SN1").unwrap().unwrap();
        assert_eq!(r.status, "installed");
        assert_eq!(r.price, Some(850.0));
        assert_eq!(checks.len(), 2);
        assert_eq!(checks[1].pdf_path.as_deref(), Some("/tmp/exp/SN1/r.pdf"));
        assert_eq!(checks[0].disk["life"], 95);

        assert!(update(&c, "SN1", &InventoryPatch { status: "robado".into(), ..Default::default() }, 400).is_err());
        assert!(add(&mut c, &rec("../x"), &check(1), 1).is_err());
        delete(&c, "SN1").unwrap();
        assert!(get(&c, "SN1").unwrap().is_none());
        let orphans: i64 = c.query_row("SELECT COUNT(*) FROM inventory_checks", [], |r| r.get(0)).unwrap();
        assert_eq!(orphans, 0);
    }

    #[test]
    fn list_includes_usage_of_the_last_check() {
        let mut c = mem();
        add(
            &mut c,
            &rec("SN1"),
            &NewCheck { disk: json!({ "life": 98, "hours": 3296, "writtenTB": 24.47, "capacityTB": 1.0 }), ..check(98) },
            100,
        )
        .unwrap();
        add(&mut c, &rec("SN2"), &check(90), 200).unwrap();
        add(&mut c, &rec("SN3"), &NewCheck { disk: json!({ "hours": "mucho" }), ..check(80) }, 300).unwrap();
        let rows = list(&c).unwrap();
        let by = |s: &str| rows.iter().find(|r| r.record.serial == s).unwrap().last.clone().unwrap();
        let sn1 = by("SN1");
        assert_eq!((sn1.hours, sn1.written_tb, sn1.capacity_tb), (Some(3296.0), Some(24.47), Some(1.0)));
        assert_eq!((by("SN2").hours, by("SN2").written_tb), (None, None));
        assert_eq!(by("SN3").hours, None);
        let json = serde_json::to_value(rows.iter().find(|r| r.record.serial == "SN1").unwrap()).unwrap();
        assert_eq!(json["last"]["hours"], 3296.0);
        assert_eq!(json["last"]["writtenTB"], 24.47);
    }

    #[test]
    fn latest_returns_the_last_check_of_each_dossier_in_order_without_raw() {
        let mut c = mem();
        add(&mut c, &rec("SN1"), &check(95), 100).unwrap();
        add(&mut c, &rec("SN1"), &check(94), 300).unwrap();
        add(&mut c, &rec("SN2"), &check(80), 200).unwrap();
        add(&mut c, &rec("SN2"), &check(79), 400).unwrap();
        let ask: Vec<String> = ["SN2", "SN1", "NOPE", "SN2"].iter().map(|s| s.to_string()).collect();
        let rows = latest(&c, &ask).unwrap();
        assert_eq!(rows.iter().map(|r| r.record.serial.as_str()).collect::<Vec<_>>(), ["SN2", "SN1"]);
        assert_eq!(rows[0].check.as_ref().unwrap().life, Some(79));
        assert_eq!(rows[1].check.as_ref().unwrap().taken_at, 300);
        assert_eq!(rows[1].check.as_ref().unwrap().disk["life"], 94);
        let json = serde_json::to_value(&rows[0]).unwrap();
        assert_eq!(json["serial"], "SN2");
        assert!(json.get("raw").is_none() && json["check"].get("raw").is_none());
        assert!(latest(&c, &["../x".to_string()]).is_err());
        assert!(latest(&c, &vec!["SN1".to_string(); LATEST_MAX + 1]).is_err());
    }

    #[test]
    fn migrates_an_existing_v1_database_keeping_data() {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch(store::MIGRATIONS[0]).unwrap();
        c.execute_batch("PRAGMA user_version = 1; INSERT INTO settings (key, value_json) VALUES ('unit', '\"C\"');").unwrap();
        store::migrate(&c).unwrap();
        let v: i64 = c.query_row("PRAGMA user_version", [], |r| r.get(0)).unwrap();
        assert_eq!(v, 2);
        assert_eq!(store::get_settings(&c).unwrap()["unit"], "C");
        assert!(list(&c).unwrap().is_empty());
    }
}
