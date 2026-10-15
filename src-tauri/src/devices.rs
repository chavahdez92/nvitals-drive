//! Descubrimiento de discos con las herramientas del sistema (plan §5.5):
//! `diskutil` (discos físicos e información) y `system_profiler` (conexión, enlace PCIe
//! y puente USB). Todo se devuelve como JSON crudo; el frontend lo normaliza.

use serde_json::{Map, Number, Value};
use std::time::Duration;
use tokio::process::Command;

use crate::error::{AppError, AppResult};
use crate::smartctl::valid_disk_id;

const DISKUTIL: &str = "/usr/sbin/diskutil";
const PROFILER: &str = "/usr/sbin/system_profiler";

async fn output(bin: &str, args: &[&str], timeout: Duration) -> AppResult<Vec<u8>> {
    let fut = Command::new(bin).args(args).env("LC_ALL", "C").kill_on_drop(true).output();
    let out = tokio::time::timeout(timeout, fut).await.map_err(|_| AppError::Timeout(format!("{bin} {}", args.join(" "))))??;
    if !out.status.success() {
        return Err(AppError::Other(format!("{bin} {}: {}", args.join(" "), String::from_utf8_lossy(&out.stderr).trim())));
    }
    Ok(out.stdout)
}

/// plist → JSON (fechas como texto ISO; datos binarios se omiten).
pub fn plist_to_json(v: plist::Value) -> Value {
    match v {
        plist::Value::Array(a) => Value::Array(a.into_iter().map(plist_to_json).collect()),
        plist::Value::Dictionary(d) => {
            let mut m = Map::new();
            for (k, v) in d {
                m.insert(k, plist_to_json(v));
            }
            Value::Object(m)
        }
        plist::Value::Boolean(b) => Value::Bool(b),
        plist::Value::Integer(i) => i
            .as_signed()
            .map(|n| Value::Number(n.into()))
            .or_else(|| i.as_unsigned().map(|n| Value::Number(n.into())))
            .unwrap_or(Value::Null),
        plist::Value::Real(f) => Number::from_f64(f).map(Value::Number).unwrap_or(Value::Null),
        plist::Value::String(s) => Value::String(s),
        plist::Value::Date(d) => Value::String(d.to_xml_format()),
        _ => Value::Null,
    }
}

/// Discos físicos completos (`disk0`, `disk4`…), sin imágenes de disco.
pub async fn physical_disks() -> AppResult<Vec<String>> {
    let raw = output(DISKUTIL, &["list", "-plist", "physical"], Duration::from_secs(10)).await?;
    let v = plist_to_json(plist::Value::from_reader(std::io::Cursor::new(raw))?);
    Ok(v.get("WholeDisks")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(|x| x.as_str().map(str::to_string)).filter(|id| valid_disk_id(id)).collect())
        .unwrap_or_default())
}

/// Árbol completo de `diskutil list` (particiones y contenedores APFS con sus volúmenes).
pub async fn all_disks() -> AppResult<Value> {
    let raw = output(DISKUTIL, &["list", "-plist"], Duration::from_secs(10)).await?;
    Ok(plist_to_json(plist::Value::from_reader(std::io::Cursor::new(raw))?))
}

pub async fn disk_info(id: &str) -> AppResult<Value> {
    if !valid_disk_id(id) {
        return Err(AppError::InvalidDisk(id.to_string()));
    }
    let raw = output(DISKUTIL, &["info", "-plist", id], Duration::from_secs(10)).await?;
    Ok(plist_to_json(plist::Value::from_reader(std::io::Cursor::new(raw))?))
}

/// Datos de conexión: controladoras NVMe (enlace PCIe), Thunderbolt/USB4 y USB (puentes).
pub async fn profiler() -> AppResult<Value> {
    let raw = output(
        PROFILER,
        &["SPNVMeDataType", "SPThunderboltDataType", "SPUSBHostDataType", "-json", "-detailLevel", "mini"],
        Duration::from_secs(20),
    )
    .await?;
    Ok(serde_json::from_slice(&raw).unwrap_or(Value::Null))
}

/// Expulsa un disco externo (desmonta y expulsa). Nunca el disco interno.
pub async fn eject(id: &str, internal: bool) -> AppResult<()> {
    if !valid_disk_id(id) {
        return Err(AppError::InvalidDisk(id.to_string()));
    }
    if internal {
        return Err(AppError::NotAllowed("no se puede expulsar el disco interno".into()));
    }
    output(DISKUTIL, &["eject", id], Duration::from_secs(30)).await.map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_plist_types() {
        let mut d = plist::Dictionary::new();
        d.insert("Internal".into(), plist::Value::Boolean(true));
        d.insert("TotalSize".into(), plist::Value::Integer(1_000_555_581_440u64.into()));
        d.insert("BusProtocol".into(), plist::Value::String("Apple Fabric".into()));
        d.insert("WholeDisks".into(), plist::Value::Array(vec![plist::Value::String("disk0".into())]));
        let v = plist_to_json(plist::Value::Dictionary(d));
        assert_eq!(v["Internal"], true);
        assert_eq!(v["TotalSize"], 1_000_555_581_440u64);
        assert_eq!(v["BusProtocol"], "Apple Fabric");
        assert_eq!(v["WholeDisks"][0], "disk0");
    }
}
