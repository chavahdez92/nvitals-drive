//! Persistencia local en SQLite (plan §10): instantáneas por disco, reportes generados
//! y ajustes. Los datos del disco se guardan como JSON normalizado por el frontend.

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;

use crate::error::AppResult;

pub const MIGRATIONS: &[&str] = &[
    r#"
CREATE TABLE IF NOT EXISTS devices (
  key TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  serial TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  info_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_key TEXT NOT NULL REFERENCES devices(key) ON DELETE CASCADE,
  taken_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS snapshots_by_device ON snapshots(device_key, taken_at);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  device_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  format TEXT NOT NULL,
  path TEXT,
  meta_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
"#,
    r#"
-- Expedientes: solo los discos que el usuario elige agregar (src/inventory.rs).
CREATE TABLE IF NOT EXISTS inventory (
  serial TEXT PRIMARY KEY,
  device_key TEXT NOT NULL,
  model TEXT NOT NULL,
  vendor TEXT,
  capacity_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'stock',
  lot TEXT,
  supplier TEXT,
  destination TEXT,
  cost REAL,
  price REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS inventory_by_lot ON inventory(lot);
CREATE INDEX IF NOT EXISTS inventory_by_status ON inventory(status);
CREATE TABLE IF NOT EXISTS inventory_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL REFERENCES inventory(serial) ON DELETE CASCADE,
  taken_at INTEGER NOT NULL,
  verdict TEXT,
  life INTEGER,
  disk_json TEXT NOT NULL,
  raw_json TEXT,
  extras_json TEXT NOT NULL DEFAULT '{}',
  pdf_path TEXT
);
CREATE INDEX IF NOT EXISTS inventory_checks_by_serial ON inventory_checks(serial, taken_at);
"#,
];

pub fn open(path: &Path) -> AppResult<Connection> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let conn = Connection::open(path)?;
    migrate(&conn)?;
    Ok(conn)
}

pub fn migrate(conn: &Connection) -> AppResult<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
    let version: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    for (i, sql) in MIGRATIONS.iter().enumerate().skip(version as usize) {
        conn.execute_batch(sql)?;
        conn.execute_batch(&format!("PRAGMA user_version = {}", i + 1))?;
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceRow {
    pub key: String,
    pub model: String,
    pub serial: Option<String>,
    pub first_seen: i64,
    pub last_seen: i64,
    pub info: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotRow {
    pub id: i64,
    pub device_key: String,
    pub taken_at: i64,
    pub source: String,
    pub data: Value,
}

/// Guarda una instantánea y actualiza el registro del disco.
pub fn add_snapshot(conn: &Connection, device: &DeviceRow, source: &str, data: &Value, now: i64) -> AppResult<i64> {
    conn.execute(
        "INSERT INTO devices (key, model, serial, first_seen, last_seen, info_json) VALUES (?1, ?2, ?3, ?4, ?4, ?5)
         ON CONFLICT(key) DO UPDATE SET model = excluded.model, serial = excluded.serial, last_seen = excluded.last_seen, info_json = excluded.info_json",
        params![device.key, device.model, device.serial, now, device.info.to_string()],
    )?;
    conn.execute(
        "INSERT INTO snapshots (device_key, taken_at, source, data_json) VALUES (?1, ?2, ?3, ?4)",
        params![device.key, now, source, data.to_string()],
    )?;
    Ok(conn.last_insert_rowid())
}

fn snapshot_row(r: &rusqlite::Row) -> rusqlite::Result<SnapshotRow> {
    let data: String = r.get(4)?;
    Ok(SnapshotRow {
        id: r.get(0)?,
        device_key: r.get(1)?,
        taken_at: r.get(2)?,
        source: r.get(3)?,
        data: serde_json::from_str(&data).unwrap_or(Value::Null),
    })
}

pub fn devices(conn: &Connection) -> AppResult<Vec<DeviceRow>> {
    let mut st = conn.prepare("SELECT key, model, serial, first_seen, last_seen, info_json FROM devices ORDER BY last_seen DESC")?;
    let rows = st.query_map([], |r| {
        let info: String = r.get(5)?;
        Ok(DeviceRow {
            key: r.get(0)?,
            model: r.get(1)?,
            serial: r.get(2)?,
            first_seen: r.get(3)?,
            last_seen: r.get(4)?,
            info: serde_json::from_str(&info).unwrap_or(Value::Null),
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn snapshots(conn: &Connection, key: &str) -> AppResult<Vec<SnapshotRow>> {
    let mut st = conn
        .prepare("SELECT id, device_key, taken_at, source, data_json FROM snapshots WHERE device_key = ?1 ORDER BY taken_at ASC, id ASC")?;
    let rows = st.query_map(params![key], snapshot_row)?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn clear_history(conn: &Connection) -> AppResult<()> {
    conn.execute_batch("DELETE FROM snapshots; DELETE FROM devices;")?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportRow {
    pub id: String,
    pub device_key: String,
    pub created_at: i64,
    pub format: String,
    pub path: Option<String>,
    pub meta: Value,
}

pub fn add_report(conn: &Connection, r: &ReportRow) -> AppResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO reports (id, device_key, created_at, format, path, meta_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![r.id, r.device_key, r.created_at, r.format, r.path, r.meta.to_string()],
    )?;
    Ok(())
}

pub fn reports(conn: &Connection) -> AppResult<Vec<ReportRow>> {
    let mut st = conn.prepare("SELECT id, device_key, created_at, format, path, meta_json FROM reports ORDER BY created_at DESC")?;
    let rows = st.query_map([], |r| {
        let meta: String = r.get(5)?;
        Ok(ReportRow {
            id: r.get(0)?,
            device_key: r.get(1)?,
            created_at: r.get(2)?,
            format: r.get(3)?,
            path: r.get(4)?,
            meta: serde_json::from_str(&meta).unwrap_or(Value::Null),
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn delete_report(conn: &Connection, id: &str) -> AppResult<()> {
    conn.execute("DELETE FROM reports WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_settings(conn: &Connection) -> AppResult<Value> {
    let mut st = conn.prepare("SELECT key, value_json FROM settings")?;
    let mut map = serde_json::Map::new();
    for row in st.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))? {
        let (k, v) = row?;
        map.insert(k, serde_json::from_str(&v).unwrap_or(Value::Null));
    }
    Ok(Value::Object(map))
}

pub fn set_settings(conn: &Connection, patch: &serde_json::Map<String, Value>) -> AppResult<()> {
    for (k, v) in patch {
        conn.execute(
            "INSERT INTO settings (key, value_json) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json",
            params![k, v.to_string()],
        )?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn mem() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        migrate(&c).unwrap();
        c
    }

    #[test]
    fn stores_snapshots_per_device_in_order() {
        let c = mem();
        let dev = DeviceRow {
            key: "k1".into(),
            model: "Samsung SSD 990 PRO 2TB".into(),
            serial: Some("S7DN".into()),
            first_seen: 0,
            last_seen: 0,
            info: json!({}),
        };
        add_snapshot(&c, &dev, "auto", &json!({"life": 99}), 100).unwrap();
        add_snapshot(&c, &dev, "test_after", &json!({"life": 98}), 200).unwrap();
        let s = snapshots(&c, "k1").unwrap();
        assert_eq!(s.len(), 2);
        assert_eq!(s[1].data["life"], 98);
        let d = devices(&c).unwrap();
        assert_eq!((d[0].first_seen, d[0].last_seen), (100, 200));
        clear_history(&c).unwrap();
        assert!(snapshots(&c, "k1").unwrap().is_empty());
    }

    #[test]
    fn settings_roundtrip_and_migrations_are_idempotent() {
        let c = mem();
        migrate(&c).unwrap();
        let mut p = serde_json::Map::new();
        p.insert("repTech".into(), json!("Andrea"));
        p.insert("unit".into(), json!("C"));
        set_settings(&c, &p).unwrap();
        assert_eq!(get_settings(&c).unwrap()["repTech"], "Andrea");
    }

    #[test]
    fn reports_roundtrip() {
        let c = mem();
        add_report(
            &c,
            &ReportRow {
                id: "HDI-1".into(),
                device_key: "k".into(),
                created_at: 5,
                format: "PDF".into(),
                path: Some("/tmp/x.pdf".into()),
                meta: json!({"verdict": "optimal"}),
            },
        )
        .unwrap();
        assert_eq!(reports(&c).unwrap()[0].meta["verdict"], "optimal");
        delete_report(&c, "HDI-1").unwrap();
        assert!(reports(&c).unwrap().is_empty());
    }
}
