# Plan: NVitals Drive de código abierto y multiplataforma (macOS · Windows · Linux)

> **Versión 1.0 · 14-oct-2026**
> **Punto de partida:** app funcional en macOS (Apple Silicon). Fases 1–10 del `docs/IMPLEMENTATION_PLAN.md` implementadas. El repositorio todavía **no tiene ningún commit**.
> **Meta:** repositorio público en GitHub, con licencia abierta, documentación para colaboradores, CI, instaladores firmados y la app funcionando en **macOS, Windows 11 y Linux** (Ubuntu 24.04+, Fedora 42+, Debian 13+).
> Este plan complementa al plan original. No reemplaza la regla de oro del diseño (sección 0 del plan original y `CLAUDE.md`).

## Índice
1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Hallazgos de la auditoría](#2-hallazgos-de-la-auditoría)
3. [Hechos verificados por plataforma](#3-hechos-verificados-por-plataforma)
4. [Matriz de portabilidad](#4-matriz-de-portabilidad)
5. [Arquitectura objetivo](#5-arquitectura-objetivo)
6. [Modelo de privilegios y seguridad](#6-modelo-de-privilegios-y-seguridad)
7. [Frontend multiplataforma](#7-frontend-multiplataforma)
8. [Preparación del repositorio de código abierto](#8-preparación-del-repositorio-de-código-abierto)
9. [Empaquetado, firma y distribución](#9-empaquetado-firma-y-distribución)
10. [Estrategia de calidad y CI](#10-estrategia-de-calidad-y-ci)
11. [Fases, entregables y criterios de aceptación](#11-fases-entregables-y-criterios-de-aceptación)
12. [Decisiones pendientes](#12-decisiones-pendientes)
13. [Riesgos y mitigaciones](#13-riesgos-y-mitigaciones)
14. [Checklist de arranque](#14-checklist-de-arranque)
15. [Roadmap posterior a la v1 multiplataforma](#15-roadmap-posterior-a-la-v1-multiplataforma)

---

## 1. Resumen ejecutivo

El trabajo se divide en dos frentes que avanzan en paralelo:

- **Código abierto (Fase A).** Limpiar datos personales, resolver licencias de terceros, elegir licencia, documentar y montar CI. Se puede publicar **pronto**, como versión para macOS, mientras avanza el port.
- **Multiplataforma (Fases B–I).** El núcleo Rust está muy acoplado a macOS: `diskutil`, `system_profiler`, `osascript`, `/dev/rdiskN`, `WKWebView.createPDF`, `posixaio` e `ipcs`. La estrategia es introducir una **capa de plataforma** (`src-tauri/src/platform/{macos,linux,windows}`) que no cambie nada en macOS. Después se implementan Linux y Windows detrás de esa capa, y la interfaz se adapta según **capacidades** que reporta el núcleo.

Lo que más cambia entre plataformas:

| Tema | macOS (hoy) | Linux | Windows |
|---|---|---|---|
| Leer SMART de NVMe | Sin privilegios | **Requiere root** (Get Log Page exige `CAP_SYS_ADMIN`) | **Sin administrador** (controlador `stornvme`) |
| SMART por puente USB (JMicron/Realtek/ASMedia) | ❌ imposible | ✅ con root (`-d snt*`) | ✅ con administrador (`-d snt*`) |
| Autopruebas NVMe (`-t`) | ❌ | ✅ con root (smartctl ≥ 7.4) | ✅ con administrador |
| Elevación | `osascript`/`sudo` (solo escaneo) | `pkexec` + política polkit | UAC (`ShellExecuteExW` con `runas`) |
| PDF del reporte | `WKWebView.createPDF` | `WebKitPrintOperation` (WebKitGTK) | `ICoreWebView2_7::PrintToPdf` (WebView2) |

Linux y Windows **ganan** funciones que macOS no permite: SMART por USB y autopruebas NVMe. La interfaz debe estar lista para mostrarlas según capacidad.

**Tamaño estimado:** de 22 a 32 sesiones de trabajo en total (ver §11). Hace falta hardware real con Windows y Linux, porque las máquinas virtuales no exponen SMART de NVMe.

---

## 2. Hallazgos de la auditoría

### 2.1 Bloqueadores para publicar

| # | Hallazgo | Dónde | Acción |
|---|---|---|---|
| P1 | **Seriales reales** (3 distintos, 7 apariciones) | `fixtures/smartctl/apple-ssd-ap1024z.x.json:27,86`, `fixtures/system_profiler/usb4-asm2464-kingston.json:11,53`, `src/ui/mock/mockData.ts:143`, `src/domain/inventory.test.ts:18`, `src-tauri/src/inventory.rs:484`, `prototype-design/js/mock-data.js:142` | Anonimizar con seriales ficticios de formato válido (ver §12, D3 para `prototype-design/`) |
| P2 | **Identificadores de la máquina:** `domain_uuid_key`, `switch_uid_key`, `volume_uuid`, nombre de volumen, zona horaria | Fixtures de `system_profiler` y `smartctl` | Reemplazar por valores sintéticos |
| P3 | **Código de terceros sin licencia:** runtime de la herramienta de diseño (`support.js`, `doc-page.js`, «omelette starter», «dc-runtime») | `prototype-design/`, `src/report/vendor/doc-page.js` | Confirmar los términos de redistribución o reemplazarlo (§12, D2) |
| P4 | `docs/parity/` pesa **83 MB** (336 PNG generados) | `docs/parity/` | Ignorarlo en git y publicarlo como artefacto de CI |
| P5 | **Correo corporativo** en la identidad de git (dominio de tu empresa) | `git config user.email` | Usar un correo personal o el `noreply` de GitHub en este repo, y confirmar que el proyecto no pertenece a tu empleador (§12, D12) |
| P6 | No hay `LICENSE`, `CONTRIBUTING`, `SECURITY` ni CI | raíz | Fase A |
| P7 | Imágenes de marca generadas con IA, con metadatos C2PA (ChatGPT/OpenAI) | `branding/nvitals/*.png` | Documentar su origen. Definir la licencia de la marca, separada de la del código |
| P8 | 16 archivos `.DS_Store` | todo el árbol | Ya están en `.gitignore`. Verificar que no entren en el primer commit |

### 2.2 Acoplamiento a macOS en el núcleo Rust

| Módulo | Dependencia de macOS |
|---|---|
| `smartctl.rs` | `CANDIDATES` con rutas de Homebrew; `is_executable` con `std::os::unix`; `PATH=/usr/bin:/bin…`; `valid_disk_id` solo acepta `diskN` |
| `devices.rs` | `/usr/sbin/diskutil` (plist), `/usr/sbin/system_profiler`, `diskutil eject` |
| `watcher.rs` | Lee la salida de `diskutil activity` |
| `scan.rs` | `osascript … with administrator privileges`, `sudo` + `pam_tid` (Touch ID), `caffeinate`, `/dev/rdiskN`, `x-apple.systempreferences:` (TCC), regla `id == "disk0"` |
| `scan_helper.rs` | `/dev/rdiskN`, `F_NOCACHE`, ioctls `DKIOCGETBLOCKSIZE/COUNT`, `libc::pread`, permisos Unix |
| `bench.rs` | Rutas de fio de Homebrew, `--ioengine=posixaio`, `statfs`/`MNT_RDONLY`, `access(W_OK)`, `SIGTERM`/`kill`, `ipcs`/`shmctl`, árbol de `diskutil list` (APFS) |
| `pdf.rs` | `WKWebView.createPDFWithConfiguration` (fuera de macOS ya devuelve un error) |
| `uitest.rs` | `WKWebView.takeSnapshot` (solo en desarrollo) |
| `commands.rs`, `inventory.rs` | `/usr/bin/open -R` (Finder) |
| `error.rs` | `AppError::Plist`, `DiskAccessDenied` (TCC) |
| `Cargo.toml` | `plist` y `libc` como dependencias globales; `objc2*` ya están condicionadas a macOS |
| `tauri.conf.json` | `titleBarStyle: Overlay`, `trafficLightPosition`, `transparent`, `windowEffects: sidebar`, `macOSPrivateApi`, destinos `app`/`dmg` |

### 2.3 Acoplamiento a macOS en el frontend (resumen)

El detalle con líneas está en el informe de auditoría. Las referencias principales están en §7.

- **No se detecta la plataforma.** La única señal es `smartctl.platform` en `EnvReport`.
- **El dominio TS consume la forma cruda de `diskutil` y `system_profiler`.** `connectionOf()` (`src/domain/normalize.ts:81-134`) asume que todo disco interno es el disco de arranque (`bootDisk: conn.internal`). Además, etiqueta como Thunderbolt cualquier disco externo que no sea USB.
- **Atajos con ⌘ fijos** en una docena de pantallas. El clic con modificador solo mira `metaKey` (`RealAppController.tsx:1111`). En WebView2, Ctrl+R, J, E y K chocan con aceleradores del navegador.
- **Textos de la interfaz:** `brew`, Finder, Touch ID, TCC, «tu Mac», `/opt/homebrew/bin`, «Ruta IOService», `/dev/r` + id. Algunos son estáticos incluso en macOS y por tanto ya son errores (`SettingsScreen.tsx:84,366`, `ReportsScreen.tsx:15`).
- **Ventana:** fondo transparente que depende de la vibrancia de macOS (`global.css:25-36`) y una franja de 52 px reservada para los semáforos.
- **Fuentes:** la pila usa SF Pro y SF Mono. No hay fuentes embebidas.
- **Rutas de archivo:** `basename` solo separa por `/` (`RealAppController.tsx:23`). El saneamiento de nombres no cubre los caracteres prohibidos ni los nombres reservados de Windows (`exporter.tsx:95`, `inventory.ts:82-84`).
- **CSS moderno:** 88 tokens con `light-dark()` y 195 usos de `oklch()`. Exigen WebKitGTK ≥ 2.44 o Chromium ≥ 123.
- **Scripts:** `package.json` usa `PATH=/opt/homebrew/...` con sintaxis POSIX, que falla en Windows. `e2e/parity.mjs` solo usa WebKit.

---

## 3. Hechos verificados por plataforma

Fuentes primarias (código de smartmontools, kernel, docs de Microsoft y Tauri v2.12.4), consultadas el 14-oct-2026. **(I)** marca una inferencia que hay que confirmar en la Fase B.

### 3.1 Linux
- **Leer el log SMART de NVMe requiere `CAP_SYS_ADMIN`.** El kernel solo permite sin privilegios algunos comandos Identify (`nvme_admin_cmd_allowed` en `drivers/nvme/host/ioctl.c`). `/dev/nvme0` es solo de root.
- **Sin root se puede leer:**
  - modelo, serie y firmware en `/sys/class/nvme/nvmeX/{model,serial,firmware_rev}`;
  - temperatura por hwmon (`temp*_input`, con `CONFIG_NVME_HWMON` (I));
  - casi todo el log de salud vía **udisks2 ≥ 2.10** (`org.freedesktop.UDisks2.NVMe.Controller.SmartGetAttributes`, sin polkit). Lo trae Ubuntu 24.04 y Debian 13, pero **no** Ubuntu 22.04.
- **Nombres de dispositivo:** `--scan` devuelve `/dev/nvme0` (controladora). smartctl también acepta `/dev/nvme0n1`.
- **Ubicación de smartctl:** `/usr/sbin/smartctl` en Debian y Ubuntu (fuera del `PATH` de usuario), `/usr/bin/smartctl` en Fedora y Arch. Versiones: Ubuntu 24.04 trae 7.4; Ubuntu 26.04, Fedora 44 y Arch traen 7.5.
- **Elevación con pkexec:**
  - una política propia en `/usr/share/polkit-1/actions` con `org.freedesktop.policykit.exec.path` y `auth_admin_keep` (≈ 5 min);
  - pkexec conserva stdin y stdout;
  - código 126 = el usuario cerró el diálogo; 127 = no autorizado.
- **AppImage no puede registrar políticas polkit.** Además, root probablemente no puede ejecutar binarios dentro del montaje FUSE (I).
- **Flatpak/Flathub no es viable.** Flathub rechaza apps que dependen de componentes del host para su función principal o que escapan del sandbox.
- **Conexión en caliente:** crate `udev`/`tokio-udev` (enlaza con libudev), `netlink-sys` + `kobject-uevent`, o sondeo de `/sys/block`.

### 3.2 Windows
- **smartctl lee NVMe sin administrador** con el controlador de bandeja `stornvme` (`-x` usa `IOCTL_STORAGE_QUERY_PROPERTY`). Solo envía Identify y Get Log Page.
- **Requieren administrador:** autopruebas (`IOCTL_STORAGE_PROTOCOL_COMMAND`), puentes USB (abren `\\.\PhysicalDriveN` con `GENERIC_READ|GENERIC_WRITE` (I)) y lectura en bruto para el escaneo.
- **Nombres de dispositivo:** `/dev/sdX` o `/dev/pdN` → `\\.\PhysicalDriveN`. `/dev/nvmeN` es solo para controladores de fabricante.
- **Instalación de smartmontools:**
  - instalador oficial `smartmontools-7.5.win32-setup.exe`, que deja `C:\Program Files\smartmontools\bin\smartctl.exe` y guarda `InstallLocation` en `HKLM\…\Uninstall\smartmontools`;
  - winget `smartmontools.smartmontools`, Chocolatey y Scoop.
- **fio:** MSI oficial (`fio-3.43-x64.msi`), que instala en `Program Files\fio` y agrega a `PATH`. Motor `windowsaio` con `direct=1`. Sin verificar: si corre sin administrador sobre un archivo.
- **Enumeración:** WMI `MSFT_PhysicalDisk` (BusType 7 = USB, 11 = SATA, 17 = NVMe; MediaType 4 = SSD) en `Root\Microsoft\Windows\Storage`. También `IOCTL_STORAGE_QUERY_PROPERTY` con un handle de acceso cero (sin administrador). Crates: `wmi` 0.18 y `windows` 0.62.
- **Elevación:** `ShellExecuteExW` con verbo `runas` y `SEE_MASK_NOCLOSEPROCESS`. No permite redirigir stdio, así que la comunicación debe ser por archivos o pipes con nombre. Tauri no ofrece API de elevación. `requireAdministrator` en el manifiesto pediría UAC en cada arranque.

### 3.3 Tauri 2
- `macOSPrivateApi` no tiene efecto desde Tauri 2.12.1. `titleBarStyle`, `trafficLightPosition` y `hiddenTitle` son solo de macOS.
- **Efectos de ventana:**
  - Windows 11: `mica`, `tabbed`, `acrylic` (requieren `transparent: true`);
  - Linux: no soporta `windowEffects` ni `shadow`.
- **Configuración por plataforma:** `tauri.{macos,windows,linux}.conf.json` se fusionan con JSON Merge Patch. **Los arreglos se reemplazan completos**, así que hay que repetir la ventana entera.
- **`with_webview`:** da `controller()` (WebView2) en Windows e `inner()` (`webkit2gtk::WebView`) en Linux. Las versiones de `webview2-com` y `webkit2gtk` pueden cambiar en versiones menores de Tauri: **hay que fijar la versión menor**.
- **WebView2 `PrintToPdf`:**
  - requiere runtime ≥ 1.0.1020.30;
  - un solo trabajo a la vez;
  - por defecto usa Carta con márgenes de 0.4 in y **sin fondos** (`ShouldPrintBackgrounds = TRUE` hay que fijarlo).
- **WebKitGTK `webkit_print_operation_print()`:** imprime sin diálogo con `GTK_PRINT_SETTINGS_OUTPUT_URI = file://…`. Hay que esperar la señal `finished`.
- **Sidecars:** `bundle.externalBin` con sufijo de triple (`smartctl-x86_64-pc-windows-msvc.exe`).
- **Bundles:**
  - Windows: NSIS (`currentUser` por defecto, o `perMachine`), MSI solo se construye en Windows; WebView2 con `embedBootstrapper` (~1.8 MB);
  - Linux: `deb` y `rpm` (con `depends` y `files` para instalar la política polkit), `appimage`.
- **CI:** `tauri-apps/tauri-action@v1`. Dependencias Linux: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf xdg-utils`. Compilar en Ubuntu 22.04 por compatibilidad de glibc.
- **Firma:**
  - macOS: Developer ID + notarización (`APPLE_*`);
  - Windows: SignPath Foundation es gratis para proyectos OSI sin componentes propietarios y con builds verificables en CI. Azure Artifact Signing **no** está disponible para personas físicas fuera de EE. UU. y Canadá;
  - Updater: llaves con `tauri signer generate`; en Linux solo actualiza AppImage.
- **`tauri-plugin-opener` 2.5.5** (ya instalado) ofrece `reveal_item_in_dir`, multiplataforma. Reemplaza a `/usr/bin/open -R`.

### 3.4 Licencias
- smartmontools es **GPL-2.0-or-later** y fio es **GPL-2.0**.
- **Invocarlos como procesos aparte** (argumentos + JSON por stdout) los mantiene como programas separados. No condiciona la licencia de la app.
- **Incluir sus binarios en el instalador** es «agregación simple». Obliga a ofrecer el código fuente exacto de esos binarios (o una oferta escrita por 3 años) con la misma facilidad que los binarios.
- fio pide, como cortesía, citar su versión cuando se publiquen resultados. El reporte ya puede incluirla.

---

## 4. Matriz de portabilidad

Columna «macOS» = implementación actual. ⬆ = requiere elevación.

| Función | macOS | Linux | Windows |
|---|---|---|---|
| Localizar smartctl | Rutas de Homebrew + `PATH` | `/usr/sbin`, `/usr/bin`, `/usr/local/sbin` + `PATH` | Sidecar del instalador → `HKLM\…\smartmontools\InstallLocation` → `Program Files` → `PATH` |
| Identificador de disco | `diskN` | `nvme0n1`, `sda` (nombre de bloque del kernel) | `pdN` (= `PhysicalDriveN`) |
| Descubrir discos | `diskutil list/info -plist` | `lsblk -J -b` + sysfs | WMI `MSFT_PhysicalDisk`/`MSFT_Disk` + `IOCTL_STORAGE_QUERY_PROPERTY` |
| Disco de sistema | `Internal` + `disk0` | Disco que respalda `/` (`lsblk -s`, cubre LVM/LUKS) | `MSFT_Disk.IsBoot \|\| IsSystem` |
| Enlace PCIe (generación, carriles) | `system_profiler SPNVMeDataType` | `/sys/class/nvme/nvmeX/device/{current,max}_link_{speed,width}` | `DEVPKEY_PciDevice_CurrentLinkSpeed/Width` (I) |
| Thunderbolt/USB4 | `SPThunderboltDataType` | `/sys/bus/thunderbolt/devices/*` + atributo PCI `removable` | Por investigar (I). Respaldo: «Externo PCIe» |
| Puente USB (VID:PID, velocidad) | `SPUSBHostDataType` | Propiedades udev (`ID_VENDOR_ID`, `ID_MODEL_ID`) + `/sys/bus/usb/devices/*/speed` | PnP padre (VID/PID) vía SetupAPI/WMI |
| Leer SMART NVMe | Sin privilegios | ⬆ broker pkexec. Sin root: sysfs + hwmon (+ udisks2 después de la v1) | Sin privilegios (`/dev/pdN`) |
| SMART por puente USB | ❌ | ⬆ `-d sntjmicron/sntrealtek/sntasmedia` | ⬆ ídem |
| Autoprueba NVMe | ❌ | ⬆ (smartctl ≥ 7.4) | ⬆ |
| Autoprueba ATA | ✅ (IOKit) | ⬆ | ⬆ |
| Temperatura en vivo | `smartctl -A` | hwmon sin root; si no hay, broker | `smartctl -A` |
| Conexión en caliente | `diskutil activity` | Sondeo de `/sys/block` cada 2 s → `udev` después | Sondeo WMI cada 2 s → `CM_Register_Notification` después |
| Escaneo de lectura | Helper root, `/dev/rdiskN`, `F_NOCACHE` | ⬆ broker, `O_RDONLY\|O_DIRECT`, `BLKGETSIZE64`/`BLKSSZGET` | ⬆ helper UAC, `CreateFileW(\\.\PhysicalDriveN, GENERIC_READ, FILE_FLAG_NO_BUFFERING)`, `IOCTL_DISK_GET_LENGTH_INFO` |
| Mantener despierto | `caffeinate` | Inhibidor de logind (D-Bus `Inhibit`) | `SetThreadExecutionState` |
| Benchmark fio | `posixaio`, `direct=1`, limpieza de `ipcs` | `libaio` (o `io_uring`), `direct=1`; rechaza `tmpfs` | `windowsaio`, `direct=1`; detener con `TerminateProcess` |
| Volúmenes para el benchmark | `diskutil list` (APFS) + `statfs` | `lsblk` `MOUNTPOINTS` + `statvfs` | `MSFT_Volume` (letras) + `GetDiskFreeSpaceExW` |
| Expulsar | `diskutil eject` | udisks2 `Unmount` + `PowerOff` (D-Bus, sin root en sesión activa) | `CM_Request_Device_EjectW` |
| Mostrar en carpeta | `open -R` | `opener.reveal_item_in_dir` | `opener.reveal_item_in_dir` |
| Permisos de privacidad | TCC (Volúmenes extraíbles / Acceso total) | No aplica | No aplica |
| Exportar PDF | `WKWebView.createPDF` por hoja + `lopdf` | `WebKitPrintOperation` → archivo | `PrintToPdf` (o DevTools `Page.printToPDF`) |
| Capturas de UI (desarrollo) | `takeSnapshot` | Opcional | `CapturePreview` (opcional) |
| Ventana | Overlay + vibrancia `sidebar` | Decoración nativa, opaca | Decoración nativa, opaca (Mica después de la v1) |
| Instalador | `.app` + `.dmg` | `.deb` + `.rpm` (AppImage reducido, opcional) | NSIS (`.exe`) |
| Datos y ajustes | `~/Library/Application Support/com.healthdiskinfo.app` | `~/.local/share/com.healthdiskinfo.app` | `%APPDATA%\com.healthdiskinfo.app` |

---

## 5. Arquitectura objetivo

### 5.1 Capa de plataforma en Rust

```
src-tauri/src/
  platform/
    mod.rs          API común y tipos: DiskId, DiskEntry, Capabilities, Volume, RawDisk, Elevation
    parse/          parsers PUROS, compilados en las 3 plataformas para poder probarlos en cualquier CI
      lsblk.rs  sysfs.rs  wmi.rs  diskutil.rs  profiler.rs
    macos/          discovery, watcher, raw, elevate, keep_awake, pdf, snapshot   (código actual movido)
    linux/          discovery, watcher, raw, broker, keep_awake, pdf, eject
    windows/        discovery, watcher, raw, elevate, keep_awake, pdf, eject
  smartctl.rs  commands.rs  scan.rs  scan_helper.rs  bench.rs  pdf.rs ...      (sin #[cfg] de SO; llaman a platform::*)
```

Principios:
1. **Solo las llamadas al sistema llevan `#[cfg(target_os)]`.** Toda interpretación de salidas (JSON de lsblk, WMI, plist, sysfs) son funciones puras en `platform/parse`, probadas con fixtures en las tres plataformas.
2. **El resto del núcleo no sabe en qué SO corre.** Usa `platform::list_disks()`, `platform::raw_open(id)`, `platform::elevate(...)`, etc.
3. **macOS no cambia de comportamiento.** El refactor se valida con `pnpm check`, `pnpm parity` y la prueba manual antes de agregar código nuevo.

API común (borrador):

```rust
pub struct DiskId(String);                       // validado por plataforma; seguro para URL y nombres de archivo
pub fn parse_disk_id(s: &str) -> Option<DiskId>; // macOS ^disk\d+$ · Linux ^(nvme\d+n\d+|sd[a-z]{1,3})$ · Windows ^pd\d{1,3}$
pub async fn list_disks() -> AppResult<Vec<DiskEntry>>;
pub async fn disk(id: &DiskId) -> AppResult<DiskEntry>;
pub fn spawn_watcher(app: AppHandle);            // emite el mismo evento `disk-event`
pub async fn volumes(id: &DiskId) -> AppResult<Vec<Volume>>;
pub async fn eject(id: &DiskId) -> AppResult<()>;
pub fn smartctl_candidates() -> Vec<PathBuf>;
pub fn smartctl_target(e: &DiskEntry) -> SmartTarget;  // { device: "/dev/disk4" | "/dev/nvme0" | "/dev/pd2", dtype: DType }
pub fn raw_open(id: &DiskId) -> io::Result<RawDisk>;   // size(), block(), read_at(); solo lectura
pub fn keep_awake(reason: &str) -> Option<KeepAwakeGuard>;
pub fn fio_engine() -> &'static str;                   // posixaio | libaio | windowsaio
pub async fn print_pdf(win: &WebviewWindow, paper: Paper) -> AppResult<Vec<u8>>;
pub fn capabilities() -> Capabilities;
```

`DType` es un **conjunto cerrado**: `Auto | Nvme | Sat | SntJmicron | SntRealtek | SntAsmedia`. El núcleo lo decide a partir de `--scan-open` y nunca viene de la interfaz.

### 5.2 Contrato de datos neutral (Rust → TS)

Hoy `list_disks` devuelve `{ id, diskutil }` y el frontend interpreta la forma de `diskutil`. La propuesta es un **modelo híbrido**:

```ts
interface DiskEntry {
  id: string;                    // "disk4" | "nvme0n1" | "pd2"
  platform: 'macos' | 'linux' | 'windows';
  core: {                        // lo que el núcleo necesita para seguridad y reglas (calculado en Rust)
    devicePath: string;          // "/dev/disk4" | "/dev/nvme0n1" | "\\\\.\\PhysicalDrive2" (solo para mostrar)
    rawPath: string;             // ruta del escaneo, para mostrarla en la consola y los reportes
    system: boolean;             // disco de arranque o sistema: nunca se escanea
    internal: boolean;
    removable: boolean;
    sizeBytes: number;
    blockSize: number;
    smart: { device: string; dtype: string; needsElevation: boolean };
  };
  raw: unknown;                  // forma nativa: plist de diskutil (macOS), lsblk+sysfs (Linux), WMI (Windows)
}
```

- **Rust** calcula lo que afecta la seguridad (`system`, rutas, `dtype`, volúmenes).
- **TS** convierte `raw` en la cadena de conexión con un **adaptador por plataforma** (`src/domain/platform/{macos,linux,windows}.ts`). El adaptador de macOS es el código actual de `connectionOf()`/`speedpath.ts`, movido sin cambios. Así se conservan los tests y el principio de que el frontend normaliza.
- `read_profiler` pasa a ser `read_connection` (genérico). En macOS sigue devolviendo `system_profiler`.
- `ConnKind` se amplía a `'internal' | 'pcie' | 'thunderbolt' | 'usb4' | 'usb' | 'sata' | 'external-pcie' | 'unknown'`. `bootDisk` deja de derivarse de `internal` y usa `core.system`.

### 5.3 Capacidades

`env_check` agrega `platform`, `osVersion` y `capabilities`:

```ts
interface Capabilities {
  smartNeedsElevation: boolean;      // Linux: true
  usbBridgeSmart: boolean;           // Linux/Windows: true (con elevación)
  selfTestNvme: boolean;             // Linux/Windows y smartctl ≥ 7.4
  selfTestAta: boolean;
  rawScan: boolean;                  // los tres
  eject: boolean;
  keepAwake: boolean;
  pdfExport: boolean;
  benchmark: boolean;                // fio encontrado
  touchId: boolean;                  // solo macOS
  privacyPermissions: boolean;       // solo macOS (TCC)
  linkSpeed: boolean;
  thunderboltInfo: boolean;
  modKey: '⌘' | 'Ctrl';
  fileManager: string;               // "Finder" | "Explorador de archivos" | "el gestor de archivos"
  installHints: { smartctl: string[]; fio: string[] };  // brew / apt / dnf / pacman / winget
}
```

La interfaz decide **qué mostrar y qué explicar** solo con estas capacidades. Nunca hace `if (platform === ...)` disperso en las pantallas.

### 5.4 Procesos elevados

| Plataforma | Mecanismo | Comunicación | Vida |
|---|---|---|---|
| macOS | `osascript … with administrator privileges` / `sudo` + Touch ID (sin cambios) | Archivos (`progress.jsonl`, `cancel`, `heartbeat`) | Un escaneo |
| Linux | `pkexec <binario fijo> --hdi-broker` con política propia `auth_admin_keep` | JSON por líneas sobre stdin/stdout | **Toda la sesión** (una contraseña por sesión). Termina al cerrarse stdin |
| Windows | `ShellExecuteExW(runas) "<exe>" --hdi-scan …` / `--hdi-smart …` | Archivos (mismo protocolo que el helper actual) | Una acción |

En Linux se usa un broker de sesión porque leer SMART y la temperatura **también** requiere root. Una contraseña por lectura sería inaceptable. En Windows la lectura normal no se eleva, así que basta con elevar por acción (escaneo, puente USB, autoprueba).

### 5.5 PDF

`pdf.rs` conserva la ventana oculta, `report.html#…&capture=1` y el evento `report-ready`. Cambia la captura:

- **macOS:** sin cambios (captura por hoja + `compose_sheets`).
- **Windows:** `ICoreWebView2_7::PrintToPdf` del documento completo, con `PageWidth/Height` según Carta/A4, márgenes 0, `ShouldPrintBackgrounds = TRUE` y la regla `@page` del modo captura. Alternativa: `CallDevToolsProtocolMethod("Page.printToPDF", { preferCSSPageSize, printBackground })`. El resultado puede pasar por `compose_sheets` para normalizar el tamaño.
- **Linux:** `WebKitPrintOperation` con `GtkPrintSettings` (`output-uri = file://…`, impresora «Imprimir a archivo») y `GtkPageSetup` (papel y márgenes 0). Hay que esperar `finished`/`failed`.
- **Respaldo universal:** exportar HTML (ya existe) y abrirlo en el navegador del sistema para «Guardar como PDF».

---

## 6. Modelo de privilegios y seguridad

Las reglas «no negociables» de `CLAUDE.md` se mantienen y se amplían así:

1. **Identificadores por plataforma**, validados contra el registro del propio núcleo:
   - macOS `^disk[0-9]+$`;
   - Linux `^(nvme[0-9]+n[0-9]+|sd[a-z]{1,3})$`, sin `loop`, `dm-*`, `md*` ni `zram*`;
   - Windows `^pd[0-9]{1,3}$`.
2. **`-d` solo desde el conjunto cerrado `DType`**, elegido por el núcleo. La consola no acepta `-d` libre.
3. **Los procesos elevados nunca usan la ruta de smartctl configurada por el usuario.**
   - Linux: solo `/usr/sbin/smartctl` o `/usr/bin/smartctl`, verificando que el dueño sea root y que no tengan permiso de escritura para grupo ni otros.
   - Windows: solo el sidecar instalado en `Program Files` o la instalación oficial registrada en `HKLM`.
4. **Broker de Linux:**
   - vuelve a enumerar y validar cada disco;
   - allowlist de operaciones (`smart.read`, `smart.selftest`, `scan.*`, `temps`);
   - sin shell, con el entorno vacío;
   - límite de tamaño por mensaje;
   - termina si se cierra stdin o si el proceso padre muere.
5. **Windows:** instalar **por máquina** (`perMachine`) para que el binario que se eleva no se pueda modificar sin administrador. El manifiesto sigue en `asInvoker`.
6. **Escaneo:** apertura de solo lectura en las tres plataformas (`O_RDONLY`, `GENERIC_READ`). El disco con `core.system = true` está prohibido en el helper y en el comando.
7. **Benchmark:** mismas reglas (volúmenes salidos de la herramienta del SO, `.hdi-bench.tmp`, espacio libre, borrado garantizado). Se agrega el rechazo de `tmpfs` y volúmenes de red en Linux.
8. **Documentación:** nuevo `docs/THREAT_MODEL.md` (superficie de cada proceso elevado) y `SECURITY.md` con reporte privado de vulnerabilidades.

---

## 7. Frontend multiplataforma

Cada cambio visible se registra en `docs/DESIGN_DEVIATIONS.md` y se confirma contigo, como pide la regla de oro. **El modo mock por defecto no cambia** (paridad). Para revisar otras plataformas en el navegador se agrega `?platform=windows|linux` en `pnpm dev:web`, sin alterar el comportamiento por defecto.

| Área | Cambio | Archivos principales |
|---|---|---|
| Plataforma y capacidades | Leer `platform`/`capabilities` de `env_check` y exponerlos en el view-model | `src/services/backend.ts`, `RealAppController.tsx`, `vm.ts` |
| Dominio | Adaptadores por plataforma; `ConnKind` ampliado; «Puerto de la Mac» → «Puerto del equipo» fuera de macOS; textos de USB según `usbBridgeSmart` | `src/domain/{normalize,speedpath,verdict,quickView,bench,disk}.ts` |
| Atajos | Etiquetas `kbd(modKey + 'K')`; clic con modificador = `metaKey` en macOS y `ctrlKey` en el resto; desactivar los aceleradores de WebView2 (`AreBrowserAcceleratorKeysEnabled = false`) | `AppController.tsx:291,439-448,826`, `RealAppController.tsx:1024,1111`, `Toolbar.tsx`, `DeviceDetailScreen.tsx`, `ConsoleDrawer.tsx`, `ReportsScreen.tsx`, `Sidebar.tsx`, `InventoryScreen.tsx` |
| Textos | Instalación por SO (`installHints`); Finder → `fileManager`; Touch ID y TCC solo si hay capacidad; UAC y polkit en los diálogos de autorización; «tu Mac» → «tu equipo»; «Ruta IOService» → «Ruta del dispositivo» | `OnboardingScreen.tsx`, `DialogLayer.tsx`, `SettingsScreen.tsx`, `TestsTab.tsx`, `ReportsScreen.tsx`, `InventoryScreen.tsx`, `ProReport.tsx`, `ReportController.tsx` |
| Errores existentes (también en macOS) | Valores estáticos en Ajustes (`SettingsScreen.tsx:84,366`) y en Reportes (`ReportsScreen.tsx:15`) | idem |
| Rutas e ids | `/dev/r` + id → `core.rawPath`; `basename`/`join` que acepten `\`; saneamiento de nombres de archivo para Windows (`*?"<>\|`, punto o espacio final, `CON`/`NUL`/`COM1`…), también en Rust | `RealAppController.tsx:23,1239,1301`, `AppController.tsx:564`, `ReportController.tsx:105`, `exporter.tsx:95`, `inventory.ts:82`, `inventory.rs` |
| Ventana | Mover las claves de macOS a `tauri.macos.conf.json`. En Windows/Linux: decoración nativa, fondo opaco (reusar la ruta de «transparencia reducida» de `global.css:35-36`), sin la franja de 52 px de los semáforos (`data-platform` en `<html>`), barras de desplazamiento con estilo | `src-tauri/tauri*.conf.json`, `global.css`, `tokens.css`, `Sidebar.tsx` |
| Fuentes | Embeber **Inter** y **JetBrains Mono** (OFL) para Windows/Linux, detrás de SF en la pila. Revisar pesos variables (550/650/750) y recortes en los reportes | `tokens.css:118-120`, `report-*.css`, `vendor/doc-page.js:190` |
| Motor web | `vite.config.ts` `build.target` → `['safari17', 'chrome120']`; probar `light-dark()`, `oklch()`, `backdrop-filter` y el rendimiento en WebKitGTK (respaldo sin desenfoque si va lento); `localStorage` entre ventanas para el PDF | `vite.config.ts`, `report/source.ts` |

---

## 8. Preparación del repositorio de código abierto

### 8.1 Archivos nuevos

| Archivo | Contenido |
|---|---|
| `LICENSE-MIT` + `LICENSE-APACHE` | Licencia dual recomendada (§12, D1). Agregar `license = "MIT OR Apache-2.0"` en `Cargo.toml`, `package.json` y `bundle.license` |
| `README.md` (ES) + `README.en.md` | Qué hace, capturas por SO, tabla de soporte, instalación por SO, compilar desde el código, privacidad (sin telemetría, todo local), **aviso de responsabilidad** (herramienta de diagnóstico: haz respaldos; sin garantía), créditos a smartmontools y fio |
| `CONTRIBUTING.md` | Requisitos por SO, `pnpm check`, la regla de oro del diseño (`prototype-design/`, `DESIGN_DEVIATIONS.md`), estilo, cómo agregar fixtures anonimizados, firma DCO (`Signed-off-by`) |
| `CODE_OF_CONDUCT.md` | Contributor Covenant |
| `SECURITY.md` | Versiones con soporte, reporte privado (GitHub Private Vulnerability Reporting), alcance (helper, broker, allowlist), tiempos de respuesta |
| `SUPPORT.md` | Dónde preguntar (Discussions) vs. dónde reportar errores (Issues) |
| `CHANGELOG.md` | Formato Keep a Changelog + SemVer |
| `THIRD_PARTY_NOTICES.md` | Generado con `cargo about` (Rust) y `pnpm licenses list` (npm), más smartmontools/fio si se incluyen. Visible también en Ajustes → Acerca de |
| `TRADEMARK.md` (o una sección del README) | El código es libre; el nombre «NVitals Drive» y el logo tienen reglas de uso para forks |
| `docs/ARCHITECTURE.md` | Capa de plataforma, contrato IPC, flujo de datos, procesos elevados |
| `docs/PLATFORM_SUPPORT.md` | Matriz pública de §4 + `CAPABILITY_MATRIX.md` por SO |
| `docs/THREAT_MODEL.md` | §6 en detalle |
| `.github/ISSUE_TEMPLATE/` | `bug.yml` (SO, versión de la app, `smartctl --version`), `hardware-report.yml` (disco, gabinete, puente, salida `smartctl -x -j` **anonimizada**), `feature.yml`, `config.yml` |
| `.github/pull_request_template.md` | Checklist: `pnpm check`, paridad, desviaciones de diseño, SO probados |
| `.github/workflows/` | `ci.yml`, `release.yml`, `codeql.yml` (JS/TS y Rust), `scorecard.yml` (opcional) |
| `.github/dependabot.yml` | cargo, npm y github-actions |
| `.github/CODEOWNERS` | Tú como dueño |
| `.editorconfig`, `.gitattributes` | `* text=auto eol=lf`, binarios marcados; evita fallos de `sync-design --check` con CRLF |
| `rust-toolchain.toml`, `rustfmt.toml`, `deny.toml` | Toolchain estable fija; `cargo-deny` para licencias, avisos y fuentes |
| `.nvmrc` + `packageManager` en `package.json` | Node y pnpm reproducibles (corepack) |
| `scripts/anonymize-fixture.mjs` | Reemplaza seriales, UUID, nombres de volumen y la zona horaria en JSON de smartctl, lsblk y WMI |

### 8.2 Cambios en archivos existentes
- `.gitignore`: agregar `docs/parity/`, `.env*`, `.claude/settings.local.json`.
- `package.json`: quitar `PATH=/opt/homebrew/...` y reemplazarlo por `scripts/with-cargo.mjs`, que agrega las rutas conocidas de rustup según el SO. Agregar `repository`, `license`, `engines` y `packageManager`.
- `Cargo.toml`: `authors`, `repository`, `license`, `homepage`. Dependencias condicionadas (`plist` → macOS, `libc` → unix, `windows`/`wmi` → Windows, `zbus` → Linux).
- `tauri.conf.json`: `version` apuntando a `../package.json` (una sola fuente de versión), `bundle.copyright`, `bundle.license`.
- `CLAUDE.md`: generalizar los «hechos verificados» por SO y quitar referencias personales. Mantenerlo es útil para quien colabore con Claude Code.
- `docs/IMPLEMENTATION_PLAN.md`: se conserva como historial. Agregar una nota que apunte a este plan.
- `README.md`: reescribirlo para un público externo.

### 8.3 Configuración de GitHub
- **Repositorio:** nombre `nvitals-drive`, rama por defecto `main` (hoy es `master`), descripción, temas (`smart`, `nvme`, `ssd`, `tauri`, `smartmontools`, `disk-health`).
- **Comunidad y seguridad:** Discussions, Private Vulnerability Reporting, secret scanning y push protection.
- **Ramas:** protección de `main` con PR obligatorio, checks requeridos e historial lineal.
- **Organización del trabajo:** etiquetas (`platform:macos`, `platform:linux`, `platform:windows`, `hardware-report`, `good first issue`, `design-deviation`), un milestone por fase (§11) y un tablero de proyecto.
- **Primer commit:** solo después de la limpieza de la Fase A, verificada con `gitleaks` y una búsqueda de seriales.

---

## 9. Empaquetado, firma y distribución

| | macOS | Windows | Linux |
|---|---|---|---|
| Formatos | `.dmg` (arm64; `x86_64` o universal opcional, ver D11) | NSIS `.exe` `perMachine`, WebView2 `embedBootstrapper` | `.deb` + `.rpm`; AppImage reducido, opcional |
| smartctl | Homebrew (el onboarding lo explica) | **Incluido como sidecar** + oferta de código fuente GPL (D5) | Dependencia del paquete (`Depends: smartmontools`) |
| fio | Homebrew (opcional) | Opcional: winget o MSI oficial (el onboarding lo explica) | `Recommends: fio` |
| Extras | — | — | Política polkit en `/usr/share/polkit-1/actions/`, `.desktop`, íconos, metainfo de AppStream; `Recommends: udisks2` |
| Firma | Developer ID + notarización (99 USD/año, D9) | SignPath Foundation (gratis para OSS, D9) | `SHA256SUMS` firmado (minisign o GPG) |
| Actualizaciones | `tauri-plugin-updater` (`latest.json` en Releases) | `tauri-plugin-updater` | Gestor de paquetes; avisar desde la app cuando hay una versión nueva |
| Procedencia | Atestaciones de GitHub (`actions/attest-build-provenance`) para todos los artefactos | | |
| Canales posteriores a la v1 | Cask en un tap propio → Homebrew oficial | winget, Scoop | AUR, COPR o PPA. **Flathub no** (§3.1) |

**Cumplimiento GPL si se incluye smartctl:** adjuntar a cada Release el tarball fuente exacto de smartmontools usado, incluir su `COPYING` en el instalador y mencionarlo en `THIRD_PARTY_NOTICES.md`.

**Versionado:** SemVer.
- Primer release público de macOS: `v1.0.0`.
- Betas multiplataforma: `v1.1.0-beta.N`.
- Estable multiplataforma: `v1.1.0`.

---

## 10. Estrategia de calidad y CI

### 10.1 `ci.yml` (cada PR)

| Job | Runner | Pasos |
|---|---|---|
| `web` | ubuntu-latest | `pnpm install --frozen-lockfile`, `typecheck`, `test` (vitest con fixtures de las 3 plataformas), `sync:design --check`, `pnpm build:web` |
| `parity` | macos-latest | Paridad del modo mock contra el prototipo con Playwright WebKit. Las capturas se suben como artefacto |
| `rust` | matriz macos-latest · windows-latest · ubuntu-22.04 | `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test`; en Linux, instalar las dependencias de WebKitGTK |
| `pdf-selftest` | windows-latest · ubuntu-22.04 (xvfb) · macos-latest | `HDI_PDF_SELFTEST` con datos de ejemplo; validar con `lopdf` que hay N hojas Carta/A4 |
| `deny` | ubuntu-latest | `cargo deny check` (licencias y avisos), `pnpm audit --prod` |
| `secrets` | ubuntu-latest | `gitleaks` + un script que busca seriales y UUID en `fixtures/` |

### 10.2 Pruebas
- **Fixtures por SO** (`fixtures/{linux,windows}/…`), anonimizadas: `smartctl --scan-open -j`, `-x -j` con y sin privilegios, `lsblk -J -b`, volcados de sysfs y udev, `Get-PhysicalDisk | ConvertTo-Json`, WMI.
- **Rust:** tests de cada parser en `platform/parse` (corren en las 3 plataformas), de `parse_disk_id` por SO, del protocolo del broker (mensajes inválidos, ids no registrados, operaciones fuera de la allowlist) y de la regla «disco de sistema prohibido».
- **TS:** tests de los adaptadores `platform/{linux,windows}.ts` con las nuevas fixtures. Agregar Playwright Chromium para revisar `?platform=windows` (no reemplaza la paridad).
- **QA manual en hardware** (§11, Fase I): matriz SO × tipo de disco × gabinete. La comunidad la completa con `hardware-report`.

---

## 11. Fases, entregables y criterios de aceptación

**Tamaños:** S ≈ 1 sesión · M ≈ 2–3 sesiones · L ≈ 4 o más.

| Fase | Nombre | Depende de | Hardware | Tamaño |
|---|---|---|---|---|
| A | Preparación del repositorio y publicación (macOS) | — | Mac | M |
| B | Validación técnica en Windows y Linux | — (en paralelo con A) | **PC con NVMe + Linux + gabinetes** | M |
| C | Capa de plataforma (refactor sin cambios en macOS) | A | Mac | L |
| D | Contrato neutral, capacidades y frontend adaptativo | C | Mac | L |
| E | Backend Linux | B, C, D | Linux | L |
| F | Backend Windows | B, C, D | Windows | L |
| G | PDF en Windows y Linux | B (spike), C | Windows + Linux | M |
| H | Empaquetado, firma, actualizaciones y releases | E, F, G | Los tres | M |
| I | QA en hardware, beta pública y v1.1 multiplataforma | H | Los tres | M |

E, F y G pueden avanzar en paralelo una vez que C y D estén listas.

### Fase A: Preparación del repositorio y publicación (macOS)

**Objetivo:** repositorio público, limpio y con licencia, con la versión de macOS funcionando. Sirve para atraer colaboradores mientras avanza el port.

**Tareas:**
1. Resolver las decisiones D1, D2, D3, D12 y D13 (§12).
2. Configurar la identidad de git del repositorio (correo personal o `noreply`) y cambiar la rama `master` a `main`.
3. Anonimizar P1 y P2 con `scripts/anonymize-fixture.mjs`, actualizando los tests que dependen de esos valores.
4. Resolver P3 según D2 (confirmar términos, o reescribir `doc-page.js` y decidir qué parte de `prototype-design/` se publica).
5. Agregar `docs/parity/` al `.gitignore`. Revisar que ningún `.DS_Store` entre al commit.
6. Crear los archivos de §8.1 y aplicar los cambios de §8.2 que no dependen del port.
7. `cargo fmt` y `cargo clippy` limpios. Script `with-cargo.mjs` en lugar de `PATH=...`.
8. Crear `ci.yml` (jobs `web`, `parity` y `rust` en macOS), `dependabot.yml`, `codeql.yml` y `deny.toml`.
9. Configurar GitHub (§8.3). Primer commit, push y release `v1.0.0` de macOS (firmado si D9 lo permite; si no, sin firmar y con instrucciones).

**Criterios de aceptación:**
- `gitleaks` y la búsqueda de seriales no encuentran nada.
- `LICENSE-*`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md` y `CONTRIBUTING.md` existen.
- CI en verde.
- Alguien sin contexto clona el repo y compila en una Mac limpia siguiendo solo el README.

### Fase B: Validación técnica en Windows y Linux

**Objetivo:** confirmar en hardware real todo lo marcado con (I) y capturar fixtures. Equivale a la «Fase 0» del plan original.

**Tareas:**
1. **Preparar el entorno:**
   - Windows 11 (24H2 o posterior) en una PC con NVMe;
   - Ubuntu 24.04 y Fedora en hardware real (sirve una USB *live* o arranque dual);
   - al menos un gabinete USB-NVMe y, si es posible, uno Thunderbolt/USB4.
2. **Fixtures (anonimizadas):**
   - `smartctl --version`, `--scan-open -j` y `-x -j` por disco, con y sin privilegios;
   - `lsblk -J -b -O`, volcados de `/sys/class/nvme`, `/sys/block` y `udevadm info`;
   - `Get-PhysicalDisk`, `Get-Disk`, `Get-Partition`, `Get-Volume` (JSON) y propiedades PnP de velocidad de enlace.
3. **Verificar privilegios:**
   - Linux: smartctl sin root falla y con root funciona; udisks2 `SmartGetAttributes` funciona sin root.
   - Windows: `-x` sin administrador en `stornvme`; puente USB sin administrador (se espera fallo); autoprueba con administrador.
4. **Spikes:**
   - **PDF:** `PrintToPdf` en una ventana oculta (`@page`, fondos, Carta/A4) y `WebKitPrintOperation` a archivo con la ventana oculta.
   - **Elevación:** broker `pkexec` con stdin/stdout de ida y vuelta, y helper `runas` con IPC por archivos (incluido cancelar UAC, código 1223).
   - **fio:** Windows con `windowsaio direct=1` sin administrador sobre NTFS; Linux con `libaio`/`io_uring` y `direct=1` sobre ext4 y btrfs.
   - **WebView:** la app real en WebView2 y WebKitGTK: `light-dark()`, `oklch()`, desenfoque, fuentes, atajos, `localStorage` entre ventanas, `requestAnimationFrame` en ventanas ocultas.
5. **Investigar** el mapeo `MSFT_PhysicalDisk.DeviceId` ↔ `PhysicalDriveN`, la detección Thunderbolt en Windows y `DEVPKEY_PciDevice_CurrentLinkSpeed`.
6. Extender `docs/CAPABILITY_MATRIX.md` con columnas por SO.

**Criterios de aceptación:** cada (I) de §3 queda confirmado o corregido en este documento. Hay fixtures de al menos 2 discos por SO. Los spikes de PDF y elevación funcionan.

### Fase C: Capa de plataforma (refactor sin cambios en macOS)

**Tareas:**
1. Crear `platform/` (§5.1) y mover el código de macOS a `platform/macos` y `platform/parse`.
2. Tipo `DiskId` en lugar de `valid_disk_id` (`smartctl.rs`, `commands.rs`, `scan.rs`, `scan_helper.rs`, `bench.rs`, `watcher.rs`, `pdf.rs`).
3. Reglas por SO en `smartctl.rs`:
   - `locate` por plataforma (`.exe`, permisos ejecutables solo en unix);
   - entorno del proceso: en Windows conservar `SystemRoot` y `windir`;
   - `SmartTarget` con `DType`.
4. Reemplazar `/usr/bin/open` por `tauri-plugin-opener` (`reveal_item_in_dir` y `open_path`). Renombrar `reveal_in_finder` → `reveal_path` (dejar un alias durante una versión).
5. `Capabilities` y `platform` en `env_check`.
6. Stubs de Linux y Windows que devuelven `AppError::NotSupported`. Dependencias condicionadas en `Cargo.toml`. Actualizar Tauri a 2.12.x y fijar la versión menor.
7. CI: `cargo check` y `cargo test` en las tres plataformas.

**Criterios de aceptación:** en macOS, `pnpm check` y `pnpm parity` sin cambios y prueba manual idéntica. El núcleo compila y sus tests pasan en Windows y Linux.

### Fase D: Contrato neutral, capacidades y frontend adaptativo

**Tareas:**
1. `DiskEntry` (§5.2) en Rust y en `backend.ts`. Adaptador de macOS = código actual; adaptadores de Linux y Windows con las fixtures de la Fase B.
2. `ConnKind` ampliado; `system` en lugar de «interno = disco de arranque»; `speedpath` genérico.
3. Interfaz guiada por capacidades (§5.3). Todo lo de §7: atajos, textos, rutas, ventana, fuentes y motor web.
4. `?platform=` en `dev:web` para revisar Windows y Linux en el navegador.
5. Registrar las desviaciones visibles en `DESIGN_DEVIATIONS.md` y confirmarlas contigo.

**Criterios de aceptación:**
- Paridad del modo mock en macOS sin cambios.
- vitest pasa con las fixtures de los tres SO.
- Con `?platform=windows` y `?platform=linux` no aparece ninguna mención a ⌘, Finder, Homebrew, Touch ID, TCC ni «tu Mac».

### Fase E: Backend Linux

**Tareas:**
1. **Descubrimiento:** `lsblk -J -b` + sysfs (identidad, enlace PCIe, `removable`, Thunderbolt) + udev (puente USB). Disco de sistema = el que respalda `/`, incluyendo LVM y LUKS.
2. **Broker** `--hdi-broker`:
   - política polkit `com.healthdiskinfo.app.broker` (`auth_admin_keep`, `exec.path` fijo, `exec.argv1 = --hdi-broker`);
   - protocolo JSON por líneas y validaciones de §6.
3. **SMART y temperatura:** SMART por el broker; temperatura por hwmon sin root (si no hay, por el broker). Antes de autorizar, mostrar identidad (sysfs) y temperatura.
4. **Conexión en caliente** por sondeo de `/sys/block` (reusar `watcher::diff`).
5. **Escaneo de lectura** en el broker:
   - `O_RDONLY|O_DIRECT`, `BLKGETSIZE64`/`BLKSSZGET`;
   - `EIO` → zona ilegible; `ENODEV`/`ENXIO` → desconectado;
   - inhibidor de logind para mantener despierto.
6. **Benchmark:** `--ioengine=libaio` (o `io_uring`), volúmenes de `lsblk` + `statvfs`, rechazo de `tmpfs`, red y solo lectura.
7. Expulsar con udisks2 (D-Bus con `zbus`). SMART por puente USB y autopruebas por el broker, según capacidad.
8. **Paquetes:** `.deb`/`.rpm` con `Depends: smartmontools`, `Recommends: fio, udisks2`, política polkit, `.desktop` y metainfo.

**Criterios de aceptación:** en Ubuntu 24.04 y Fedora:
- se listan discos;
- SMART completo con **una** autorización por sesión;
- conexión en caliente, escaneo de un disco externo, benchmark, PDF, historial y expedientes funcionan;
- el disco de sistema no se puede escanear.

### Fase F: Backend Windows

**Tareas:**
1. **Descubrimiento:** WMI (`MSFT_PhysicalDisk`, `MSFT_Disk`, `MSFT_Partition`, `MSFT_Volume`) + `IOCTL_STORAGE_QUERY_PROPERTY`. `pdN` validado. Sistema = `IsBoot || IsSystem`. VID/PID del puente y velocidad de enlace PCIe según los resultados de la Fase B.
2. **SMART:** `smartctl -x -j /dev/pdN` sin elevación. Puente USB y autopruebas con el helper elevado `--hdi-smart` (resultado JSON en archivo).
3. **Conexión en caliente:** sondeo cada 2 s.
4. **Escaneo:** helper elevado con `runas` (protocolo de archivos actual), `CreateFileW` + `FILE_FLAG_NO_BUFFERING`, `ReadFile` con desplazamiento, `SetThreadExecutionState`; UAC cancelado (1223) → `auth-cancelled`.
5. **Benchmark:**
   - `--ioengine=windowsaio`, `--direct=1`;
   - escapar `:` en la ruta (ya existe);
   - volúmenes de `MSFT_Volume` + `GetDiskFreeSpaceExW`;
   - comprobar escritura creando el archivo;
   - detener con `child.kill()` y borrar. Sin `ipcs`.
6. Expulsar con `CM_Request_Device_EjectW`. Aceleradores de WebView2 desactivados.
7. **Instalador:** NSIS `perMachine`, sidecar de smartctl, `embedBootstrapper` y manifiesto `asInvoker`.

**Criterios de aceptación:** en Windows 11:
- SMART del NVMe interno **sin UAC**;
- SMART por gabinete USB con UAC;
- escaneo externo con UAC; benchmark, PDF y conexión en caliente funcionan;
- el disco de sistema no se puede escanear.

### Fase G: PDF en Windows y Linux

**Tareas:** implementar `platform::print_pdf` (§5.5) a partir de los spikes; `HDI_PDF_SELFTEST` en las tres plataformas; ajustar `capture.ts`/`report-*.css` si cambian los cortes de página; respaldo «abrir HTML en el navegador».

**Criterios de aceptación:** el reporte completo, el rápido y el de varios discos salen en Carta y A4, con texto vectorial, fondos y el mismo número de hojas que en macOS. El job `pdf-selftest` de CI pasa en los tres SO.

### Fase H: Empaquetado, firma, actualizaciones y releases

**Tareas:**
1. `tauri.{macos,windows,linux}.conf.json`. Versión única desde `package.json`.
2. `release.yml` con `tauri-action@v1`: matriz macOS arm64 (y `x86_64` o universal según D11), Windows x64 y Linux x64 (Ubuntu 22.04). Release en borrador al crear una etiqueta `v*`.
3. **Firma:** macOS (secretos `APPLE_*`), Windows (SignPath: alta del proyecto, política de firma publicada) y `SHA256SUMS` firmado.
4. `tauri-plugin-updater` con llaves propias (macOS y Windows). En Linux, aviso de nueva versión.
5. Adjuntar el tarball fuente de smartmontools (GPL) y las atestaciones de procedencia.
6. Prueba básica de los instaladores en CI (instalar y arrancar con un selftest).

**Criterios de aceptación:** una etiqueta `v1.1.0-beta.1` produce un release en borrador con artefactos firmados para los tres SO, `SHA256SUMS` y `latest.json`. Actualizar desde la beta anterior funciona en macOS y Windows.

### Fase I: QA en hardware, beta pública y v1.1 multiplataforma

**Tareas:**
1. Matriz de QA: SO × {NVMe interno, NVMe en USB, NVMe en Thunderbolt/USB4, SATA} × {SMART, temperatura, escaneo, benchmark, PDF, expedientes, conexión en caliente}.
2. Beta pública (pre-release) con convocatoria de reportes de hardware.
3. Actualizar `docs/PLATFORM_SUPPORT.md`, el README con capturas por SO y el `CHANGELOG`.
4. Triage de errores y release estable `v1.1.0`.

**Criterios de aceptación:** cero errores bloqueantes abiertos, la matriz de QA completa en al menos un equipo por SO y la documentación al día.

**Total estimado:** A (M) + B (M) + C (L) + D (L) + E (L) + F (L) + G (M) + H (M) + I (M) ≈ **22–32 sesiones**, sin contar el tiempo de conseguir hardware ni los tiempos de alta de firma (Apple y SignPath).

---

## 12. Decisiones pendientes

Cada decisión trae una recomendación. Las marcadas con ★ bloquean la Fase A.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 ★ | Licencia del código | MIT · Apache-2.0 · **MIT OR Apache-2.0** · GPL-3.0 | **MIT OR Apache-2.0** (igual que Tauri; Apache aporta concesión de patentes; compatible con SignPath; no se enlaza código GPL) |
| D2 ★ | Runtime de la herramienta de diseño (`support.js`, `doc-page.js`) | Confirmar que los términos permiten redistribuirlo con licencia OSI · reescribir `doc-page.js` y publicar `prototype-design/` sin runtime (SPEC, tokens y capturas) | Confirmar los términos primero. Si no está claro, **reescribir `doc-page.js`** (≈ 780 líneas, solo paginación). SignPath exige que no haya componentes propietarios |
| D3 ★ | Serial real en `prototype-design/js/mock-data.js` (carpeta de solo lectura) | Excepción única para anonimizarlo (registrada en `DESIGN_DEVIATIONS.md`) · publicarlo tal cual | **Excepción única** documentada |
| D4 | Privilegios en Linux | Broker `pkexec` por sesión · `pkexec` por lectura · toda la GUI como root (estilo GSmartControl) | **Broker por sesión** en la v1. Modo sin root con udisks2 después |
| D5 | smartctl en Windows | Incluido en el instalador (sidecar + cumplimiento GPL) · pedir instalarlo con winget | **Incluirlo**: la lectura funciona sin configurar nada |
| D6 | Barra de título en Windows/Linux | Nativa · personalizada (botones propios + Mica) | **Nativa** en la v1 (menos riesgo); personalizada después |
| D7 | Tipografía en Windows/Linux | Fuentes del sistema (Segoe UI, Cantarell…) · **Inter + JetBrains Mono embebidas** | **Embebidas**: más cerca de SF y del prototipo; reportes consistentes |
| D8 | Formatos de Linux | deb + rpm · + AppImage · + Flatpak | **deb + rpm**; AppImage reducido después; Flatpak no |
| D9 | Presupuesto de firma | Apple Developer (99 USD/año) · SignPath (gratis) · sin firma | **Las dos** antes de la v1.1. Sin firma, Gatekeeper y SmartScreen bloquean o asustan |
| D10 | Idioma | Solo es-MX · i18n con en-US | **es-MX en la v1** + README bilingüe; i18n como primera tarea después de la v1 |
| D11 | Macs Intel | Solo arm64 · universal | **Universal** (costo bajo; macOS 14 corre en Intel) |
| D12 ★ | Titularidad y correo | Confirmar que el proyecto es personal; correo personal o `noreply` de GitHub | Confirmarlo **antes** del primer commit público |
| D13 ★ | ¿Publicar antes del port? | Publicar macOS ya (Fase A) · publicar al terminar | **Publicar ya**, con roadmap y etiquetas `platform:*` para recibir ayuda |
| D14 | Escaneo de discos internos que no son de sistema | Permitir (con aviso) · bloquear todo interno (como hoy) | **Permitir**: en una PC es común tener un segundo NVMe interno |
| D15 | Instalación en Windows | `perMachine` · `currentUser` | **`perMachine`**: el binario que se eleva no puede ser modificable sin administrador |

---

## 13. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin hardware de Windows y Linux | No se puede validar | Fase B al inicio; USB *live* de Linux; arranque dual; reportes de la comunidad |
| WebKitGTK lento con desenfoque y animaciones; diferencias con WebKit de macOS | Mala experiencia en Linux | Spike en la Fase B; respaldo opaco sin `backdrop-filter`; probar con GPU de NVIDIA (`WEBKIT_DISABLE_DMABUF_RENDERER=1` como último recurso) |
| PDF en Linux (impresora «a archivo», páginas, ventana oculta) | Reportes mal cortados | Spike en la Fase B; selftest en CI con xvfb; respaldo «abrir en el navegador» |
| Mapeo de discos en Windows (WMI ↔ PhysicalDrive ↔ smartctl `pdN`) | Lecturas del disco equivocado | Validar el número con `IOCTL_STORAGE_GET_DEVICE_NUMBER` y comparar el serial con el de smartctl antes de mostrar datos |
| Superficie de los procesos elevados | Escalada de privilegios | §6; tests del protocolo; modelo de amenazas; revisión de seguridad antes de la beta |
| SmartScreen o Gatekeeper sin firma | Usuarios que no instalan | D9; instrucciones claras mientras no haya firma |
| smartctl 7.4 vs 7.5 (`endurance_used` no existe en 7.4) | Datos faltantes | `normalize.ts` ya usa `percentage_used` como respaldo; fixtures por versión |
| Cambios de `webview2-com`/`webkit2gtk` en versiones menores de Tauri | El PDF o los aceleradores se rompen | Fijar la versión menor de Tauri; selftest de PDF en CI |
| Licencias de terceros (runtime de diseño, GPL) | Problemas legales o rechazo de SignPath | D2; `cargo deny`; `THIRD_PARTY_NOTICES`; código fuente de smartmontools en cada release |
| Mantener tres plataformas una sola persona | Atraso y errores sin atender | Capacidades en lugar de ramas por SO; CI en la matriz; plantillas de issues; buscar co-mantenedores por plataforma |
| Ubuntu 22.04 (udisks2 2.9, WebKitGTK más viejo) | Funciones faltantes | Soporte oficial desde Ubuntu 24.04; compilar en 22.04 solo por glibc |

---

## 14. Checklist de arranque

Lo que necesitas hacer tú:

- [ ] Responder D1, D2, D3, D12 y D13 (bloquean la Fase A).
- [ ] Crear el repositorio en GitHub (vacío, sin README) y decidir el nombre (`nvitals-drive` sugerido).
- [ ] Verificar que el nombre «NVitals Drive» no choque con otra marca o proyecto conocido.
- [ ] Conseguir el hardware de la Fase B: una PC con NVMe para Windows 11 y Linux (USB *live* o arranque dual) y un gabinete USB-NVMe.
- [ ] Si eliges firmar: alta en Apple Developer Program y solicitud a SignPath Foundation. Los dos trámites tardan; conviene iniciarlos pronto.
- [ ] Para empezar, pide: **«Inicia la Fase A»** (se puede ya) o **«Inicia la Fase B»** (cuando tengas el hardware).

---

## 15. Roadmap posterior a la v1 multiplataforma

- **Interfaz en inglés (i18n):** extraer textos a diccionarios es-MX y en-US. Es la mejora con más alcance para un proyecto público.
- **Linux sin contraseña:** lectura de salud por udisks2 (`SmartGetAttributes`) con la misma forma JSON que smartctl. El broker se pide solo para logs, puentes USB, autopruebas y escaneo.
- **Windows:** barra de título personalizada con Mica; broker de sesión con pipe con nombre; `CM_Register_Notification` para conexión en caliente.
- **Linux:** conexión en caliente con `udev`.
- **ARM64:** Windows ARM64 y Linux aarch64.
- **Canales:** Homebrew Cask, winget, Scoop, AUR, COPR o PPA.
- **Benchmark nativo en Rust**, para no depender de fio en Windows.
- Página del proyecto (GitHub Pages) con capturas, preguntas frecuentes y la matriz de hardware de la comunidad.

---

## Avance

### Fase A (14-oct-2026), parcial
- **Hecho:**
  - Fixtures, mocks y tests anonimizados con `scripts/anonymize-fixture.mjs` (D3 registrada como desviación #23).
  - `.gitignore` con `docs/parity/`.
  - Licencias `LICENSE-MIT` y `LICENSE-APACHE` y metadatos de licencia en `package.json`, `Cargo.toml` y `tauri.conf.json`, cuya versión ahora sale de `package.json`.
  - Documentos: `README` (ES/EN), `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`, `CHANGELOG`, `TRADEMARK` y `THIRD_PARTY_NOTICES` (generado con `pnpm notices`).
  - Configuración: `.editorconfig`, `.gitattributes`, `rust-toolchain.toml`, `rustfmt.toml`, `deny.toml` y `.nvmrc`.
  - Scripts sin rutas de Homebrew (`scripts/with-cargo.mjs`).
  - GitHub: `ci.yml`, `codeql.yml`, `dependabot.yml` y plantillas de issues y PR.
  - `cargo fmt` y clippy limpios.
  - Rama renombrada a `main`.
  - Arreglo en `sync-design`: ya no sobrescribe el ícono de la marca.
- **Decisiones resueltas (14-oct-2026):**
  - **D2:** confirmaste que los términos de la herramienta de diseño permiten redistribuir su runtime (`support.js`, `doc-page.js`); se publica sin cambios.
  - **D12:** proyecto personal; commits con el correo personal configurado solo en este repositorio. Repositorio: `chavahdez92/nvitals-drive`.
- **Pendiente:** push, configuración de GitHub (§8.3) y release `v1.0.0`.
