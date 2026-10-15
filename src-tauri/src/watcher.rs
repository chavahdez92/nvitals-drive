//! Conexión en caliente (plan §5.6): sigue `diskutil activity` y, ante cada cambio,
//! compara la lista de discos físicos (las imágenes y contenedores APFS también generan
//! eventos) para emitir `disk-event` { kind: "appeared" | "disappeared", id }.
//! Si el proceso termina, se reinicia.

use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct DiskEvent {
    pub kind: &'static str,
    pub id: String,
}

/// Interpreta una línea de `diskutil activity`, p. ej.
/// `***DiskAppeared ('disk4', DAVolumePath = '<null>', …) Time=…`.
pub fn parse_line(line: &str) -> Option<DiskEvent> {
    let rest = line.trim().strip_prefix("***")?;
    let (kind, rest) = if let Some(r) = rest.strip_prefix("DiskAppeared") {
        ("appeared", r)
    } else {
        let r = rest.strip_prefix("DiskDisappeared")?;
        ("disappeared", r)
    };
    let start = rest.find("('")? + 2;
    let end = start + rest[start..].find('\'')?;
    let id = &rest[start..end];
    // Solo discos completos: disk4 sí, disk4s1 no.
    crate::smartctl::valid_disk_id(id).then(|| DiskEvent { kind, id: id.to_string() })
}

/// Diferencia entre dos listas de discos físicos.
pub fn diff(before: &[String], after: &[String]) -> Vec<DiskEvent> {
    let mut out: Vec<DiskEvent> =
        after.iter().filter(|id| !before.contains(id)).map(|id| DiskEvent { kind: "appeared", id: id.clone() }).collect();
    out.extend(before.iter().filter(|id| !after.contains(id)).map(|id| DiskEvent { kind: "disappeared", id: id.clone() }));
    out
}

pub fn spawn(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut known = crate::devices::physical_disks().await.unwrap_or_default();
        loop {
            let child = Command::new("/usr/sbin/diskutil")
                .arg("activity")
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::null())
                .kill_on_drop(true)
                .spawn();
            if let Ok(mut child) = child {
                if let Some(out) = child.stdout.take() {
                    let mut lines = BufReader::new(out).lines();
                    // Las primeras líneas enumeran los discos ya presentes: se ignoran
                    // hasta el marcador "***DAIdle".
                    let mut idle = false;
                    while let Ok(Some(line)) = lines.next_line().await {
                        if line.starts_with("***DAIdle") {
                            idle = true;
                            continue;
                        }
                        if !idle {
                            continue;
                        }
                        if parse_line(&line).is_some() {
                            // Deja que DiskArbitration termine de publicar el disco.
                            tokio::time::sleep(Duration::from_millis(400)).await;
                            if let Ok(now) = crate::devices::physical_disks().await {
                                for ev in diff(&known, &now) {
                                    log::info!("disk-event {:?}", ev);
                                    let _ = app.emit("disk-event", ev);
                                }
                                known = now;
                            }
                        }
                    }
                }
                let _ = child.kill().await;
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_appeared_and_disappeared_whole_disks() {
        assert_eq!(
            parse_line("***DiskAppeared ('disk4', DAVolumePath = '<null>', DAVolumeKind = '<null>', DAVolumeName = '<null>') Time=20260925-10:00:01.1234"),
            Some(DiskEvent { kind: "appeared", id: "disk4".into() })
        );
        assert_eq!(
            parse_line("***DiskDisappeared ('disk12', DAVolumePath = '<null>') Time=20260925-10:00:09.0000"),
            Some(DiskEvent { kind: "disappeared", id: "disk12".into() })
        );
    }

    #[test]
    fn diffs_physical_lists() {
        let a = vec!["disk0".to_string(), "disk6".to_string()];
        let b = vec!["disk0".to_string(), "disk8".to_string()];
        assert_eq!(
            diff(&a, &b),
            vec![DiskEvent { kind: "appeared", id: "disk8".into() }, DiskEvent { kind: "disappeared", id: "disk6".into() }]
        );
    }

    #[test]
    fn ignores_partitions_and_other_events() {
        assert_eq!(parse_line("***DiskAppeared ('disk4s1', DAVolumePath = 'file:///Volumes/X/') Time=…"), None);
        assert_eq!(parse_line("***DiskDescriptionChanged ('disk4', DAVolumePath = '<null>') Time=…"), None);
        assert_eq!(parse_line("***DAIdle (no more changes) Time=…"), None);
        assert_eq!(parse_line("random text"), None);
    }
}
