use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("smartctl no está instalado")]
    SmartctlMissing,
    #[error("smartctl: {0}")]
    Smartctl(String),
    #[error("identificador de disco no válido: {0}")]
    InvalidDisk(String),
    #[error("el disco {0} no está conectado")]
    UnknownDisk(String),
    #[error("operación no permitida: {0}")]
    NotAllowed(String),
    #[error("tiempo de espera agotado: {0}")]
    Timeout(String),
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("plist: {0}")]
    Plist(#[from] plist::Error),
    #[error("base de datos: {0}")]
    Db(#[from] rusqlite::Error),
    /// La protección de privacidad de macOS (TCC) bloqueó el acceso al disco en bruto.
    #[error("acceso-disco-denegado")]
    DiskAccessDenied,
    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
