//! Integración con smartctl: localización, ejecución segura y resultado tipado.
//!
//! Reglas (plan §5.2 y §11): nunca se usa shell, los argumentos van en vector, solo se
//! permiten las operaciones de la allowlist y el identificador de disco se valida.
//! No existe ninguna operación que escriba en el disco.

use serde::Serialize;
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::process::Command;

use crate::error::{AppError, AppResult};

/// Rutas conocidas: las apps abiertas desde Finder no heredan el PATH de la shell.
const CANDIDATES: [&str; 3] = ["/opt/homebrew/bin/smartctl", "/usr/local/bin/smartctl", "/opt/local/bin/smartctl"];

/// Operaciones permitidas (allowlist cerrada).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    Info,
    Health,
    Attributes,
    Capabilities,
    ErrorLog,
    SelfTestLog,
    All,
    Extended,
}

impl Op {
    pub fn from_flag(flag: &str) -> Option<Op> {
        Some(match flag {
            "-i" => Op::Info,
            "-H" => Op::Health,
            "-A" => Op::Attributes,
            "-c" => Op::Capabilities,
            "-l error" => Op::ErrorLog,
            "-l selftest" => Op::SelfTestLog,
            "-a" => Op::All,
            "-x" => Op::Extended,
            _ => return None,
        })
    }

    fn args(self) -> &'static [&'static str] {
        match self {
            Op::Info => &["-i"],
            Op::Health => &["-H"],
            Op::Attributes => &["-A"],
            Op::Capabilities => &["-c"],
            Op::ErrorLog => &["-l", "error"],
            Op::SelfTestLog => &["-l", "selftest"],
            Op::All => &["-a"],
            Op::Extended => &["-x"],
        }
    }
}

/// Identificador de disco completo de macOS (`disk4`). Nada de rutas ni particiones.
pub fn valid_disk_id(id: &str) -> bool {
    id.len() > 4 && id.starts_with("disk") && id[4..].chars().all(|c| c.is_ascii_digit())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmartctlInfo {
    pub path: String,
    pub version: String,
    pub major: u32,
    pub minor: u32,
    pub build: String,
    pub platform: String,
    pub json: bool,
}

/// Resultado de una ejecución: JSON (si hay), texto clásico (`--json=o`) y metadatos.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CmdResult {
    pub cmd: String,
    pub disk: Option<String>,
    pub exit: i32,
    pub json: Option<Value>,
    pub text: Vec<String>,
    pub stderr: String,
    pub duration_ms: u64,
    pub started_at: u64,
}

pub fn locate(configured: Option<&str>) -> Option<PathBuf> {
    if let Some(p) = configured.filter(|p| !p.is_empty()) {
        let p = PathBuf::from(p);
        if is_executable(&p) {
            return Some(p);
        }
    }
    for c in CANDIDATES {
        let p = PathBuf::from(c);
        if is_executable(&p) {
            return Some(p);
        }
    }
    std::env::var_os("PATH").and_then(|paths| std::env::split_paths(&paths).map(|d| d.join("smartctl")).find(|p| is_executable(p)))
}

fn is_executable(p: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    std::fs::metadata(p).map(|m| m.is_file() && m.permissions().mode() & 0o111 != 0).unwrap_or(false)
}

/// Versión a partir de `smartctl --version` (p. ej. "smartctl 7.5 2025-04-30 r5714 [Darwin 27.0.0 arm64]").
pub fn parse_version(text: &str) -> Option<(u32, u32, String, String)> {
    let first = text.lines().next()?;
    let re = regex::Regex::new(r"^smartctl (\d+)\.(\d+)\S*\s+(\S+\s+\S+)?\s*\[([^\]]+)\]").ok()?;
    let c = re.captures(first)?;
    Some((c[1].parse().ok()?, c[2].parse().ok()?, c.get(3).map(|m| m.as_str().to_string()).unwrap_or_default(), c[4].to_string()))
}

pub async fn info(path: &Path) -> AppResult<SmartctlInfo> {
    let out = run_raw(path, &["--version"], Duration::from_secs(5)).await?;
    let text = String::from_utf8_lossy(&out.stdout).to_string();
    let (major, minor, build, platform) =
        parse_version(&text).ok_or_else(|| AppError::Smartctl(format!("versión no reconocida: {}", text.lines().next().unwrap_or(""))))?;
    Ok(SmartctlInfo {
        path: path.display().to_string(),
        version: format!("{major}.{minor}"),
        major,
        minor,
        build,
        platform,
        json: major >= 7,
    })
}

struct Raw {
    status: i32,
    stdout: Vec<u8>,
    stderr: Vec<u8>,
}

async fn run_raw(path: &Path, args: &[&str], timeout: Duration) -> AppResult<Raw> {
    let child = Command::new(path)
        .args(args)
        .env_clear()
        .env("LC_ALL", "C")
        .env("PATH", "/usr/bin:/bin:/usr/sbin:/sbin")
        .kill_on_drop(true)
        .output();
    let out =
        tokio::time::timeout(timeout, child).await.map_err(|_| AppError::Timeout(format!("{} {}", path.display(), args.join(" "))))??;
    Ok(Raw { status: out.status.code().unwrap_or(-1), stdout: out.stdout, stderr: out.stderr })
}

/// Ejecuta operaciones de la allowlist sobre un disco. `json_output` agrega `--json=o`
/// (JSON + texto clásico); sin él se obtiene solo el texto clásico.
pub async fn run(path: &Path, disk: &str, ops: &[Op], json_output: bool, timeout: Duration) -> AppResult<CmdResult> {
    if !valid_disk_id(disk) {
        return Err(AppError::InvalidDisk(disk.to_string()));
    }
    let mut args: Vec<&str> = Vec::new();
    for op in ops {
        args.extend_from_slice(op.args());
    }
    if json_output {
        args.push("--json=o");
    }
    args.push(disk);
    exec(path, &args, Some(disk), timeout).await
}

/// Autoprueba SMART de discos ATA/SATA (macOS la permite vía IOKit solo para ATA:
/// corta y extendida). Para NVMe macOS no deja enviar el comando, por eso se verifica
/// el protocolo antes. `kind`: "short" | "long" | "abort".
pub async fn ata_self_test(path: &Path, disk: &str, kind: &str) -> AppResult<CmdResult> {
    if !valid_disk_id(disk) {
        return Err(AppError::InvalidDisk(disk.to_string()));
    }
    let info = run(path, disk, &[Op::Info], true, Duration::from_secs(15)).await?;
    let proto = info.json.as_ref().and_then(|j| j.pointer("/device/protocol")).and_then(Value::as_str).unwrap_or("");
    if proto != "ATA" {
        return Err(AppError::NotAllowed(format!("autoprueba solo para discos ATA/SATA (este disco es {proto})")));
    }
    let args: &[&str] = match kind {
        "short" => &["-t", "short", "--json=o"],
        "long" => &["-t", "long", "--json=o"],
        "abort" => &["-X", "--json=o"],
        _ => return Err(AppError::NotAllowed(kind.to_string())),
    };
    let mut all: Vec<&str> = args.to_vec();
    all.push(disk);
    exec(path, &all, Some(disk), Duration::from_secs(20)).await
}

/// `--scan-open -j` (descubrimiento; devuelve rutas IOService).
pub async fn scan_open(path: &Path) -> AppResult<CmdResult> {
    exec(path, &["--scan-open", "-j"], None, Duration::from_secs(10)).await
}

async fn exec(path: &Path, args: &[&str], disk: Option<&str>, timeout: Duration) -> AppResult<CmdResult> {
    let started_at = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0);
    let t0 = Instant::now();
    let raw = run_raw(path, args, timeout).await?;
    let stdout = String::from_utf8_lossy(&raw.stdout).to_string();
    let json: Option<Value> =
        if args.iter().any(|a| a.starts_with("--json") || *a == "-j") { serde_json::from_str(&stdout).ok() } else { None };
    // smartctl devuelve su código en JSON (smartctl.exit_status); si no, el del proceso.
    let exit =
        json.as_ref().and_then(|j| j.pointer("/smartctl/exit_status")).and_then(Value::as_i64).map(|v| v as i32).unwrap_or(raw.status);
    let text = match json.as_ref().and_then(|j| j.pointer("/smartctl/output")).and_then(Value::as_array) {
        Some(lines) => lines.iter().filter_map(|l| l.as_str().map(str::to_string)).collect(),
        None if json.is_none() => stdout.lines().map(str::to_string).collect(),
        None => Vec::new(),
    };
    let display_args: Vec<String> = args.iter().map(|a| if *a == "--json=o" { "-j".to_string() } else { a.to_string() }).collect();
    Ok(CmdResult {
        cmd: format!("smartctl {}", display_args.join(" ")),
        disk: disk.map(str::to_string),
        exit,
        json,
        text,
        stderr: String::from_utf8_lossy(&raw.stderr).to_string(),
        duration_ms: t0.elapsed().as_millis() as u64,
        started_at,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disk_ids_are_validated() {
        assert!(valid_disk_id("disk0"));
        assert!(valid_disk_id("disk12"));
        for bad in ["disk", "disk4s1", "/dev/disk4", "disk4;rm", "rdisk4", "disk 4", "", "disk-1"] {
            assert!(!valid_disk_id(bad), "{bad} debería rechazarse");
        }
    }

    #[test]
    fn only_allowlisted_flags_map_to_ops() {
        for ok in ["-i", "-H", "-A", "-c", "-l error", "-l selftest", "-a", "-x"] {
            assert!(Op::from_flag(ok).is_some(), "{ok}");
        }
        for bad in ["-t short", "-X", "-s on", "--set=wcache,off", "-S on", "-o on", "-l nvmelog,1,64", "-d sat", ""] {
            assert!(Op::from_flag(bad).is_none(), "{bad} no debe estar permitido");
        }
    }

    #[test]
    fn parses_version_banner() {
        let v = parse_version("smartctl 7.5 2025-04-30 r5714 [Darwin 27.0.0 arm64] (local build)\nCopyright").unwrap();
        assert_eq!((v.0, v.1), (7, 5));
        assert_eq!(v.2, "2025-04-30 r5714");
        assert_eq!(v.3, "Darwin 27.0.0 arm64");
    }
}
