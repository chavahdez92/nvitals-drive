# Plan de implementación: HealthDiskInfo

> **Versión 1.0 · 24-sep-2026**
> **Estado (25-sep-2026):** Fases 1–10 implementadas; la Fase 0 está verificada con el SSD interno y queda pendiente con gabinetes externos. La Fase 11 está parcial (empaquetado `.app` listo). Detalle en "Avance" al final de este documento.
> **Prototipo:** `prototype-design/`, traducido según `docs/DESIGN_MAPPING.md`.
> **Plataforma objetivo:** macOS 27 · Apple Silicon (MacBook Pro M5 Pro).

## Índice
0. [Regla de oro: el diseño manda](#0-regla-de-oro-el-diseño-manda)
1. [Objetivo y alcance](#1-objetivo-y-alcance)
2. [Hallazgos técnicos verificados en tu Mac](#2-hallazgos-técnicos-verificados-en-tu-mac)
3. [Stack recomendado y arquitectura](#3-stack-recomendado-y-arquitectura)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Núcleo Rust: smartctl y macOS](#5-núcleo-rust-smartctl-y-macos)
6. [Modelo de dominio: métricas, veredicto y alertas](#6-modelo-de-dominio-métricas-veredicto-y-alertas)
7. [Frontend: del prototipo al código](#7-frontend-del-prototipo-al-código)
8. [Pruebas de disco](#8-pruebas-de-disco)
9. [Reportes, historial y comparación](#9-reportes-historial-y-comparación)
10. [Persistencia](#10-persistencia)
11. [Seguridad y privacidad](#11-seguridad-y-privacidad)
12. [Estrategia de calidad](#12-estrategia-de-calidad)
13. [Fases, entregables y criterios de aceptación](#13-fases-entregables-y-criterios-de-aceptación)
14. [Riesgos y mitigaciones](#14-riesgos-y-mitigaciones)
15. [Checklist de arranque](#15-checklist-de-arranque)
- [Apéndices A–E](#apéndice-a-métrica--json--transformación--regla)

---

## 0. Regla de oro: el diseño manda

**`prototype-design/` es la fuente de verdad única de todo lo visual y de interacción:**
- layout;
- tokens (color, tipografía, espaciado, radios, sombras, materiales);
- iconografía;
- componentes y sus estados;
- copy;
- animaciones, transiciones y coreografías;
- atajos de teclado.

La implementación **se basa enteramente en ese diseño**.

### Reglas

1. **No se construye ninguna UI antes de la Fase 1** (ingesta del prototipo). El trabajo técnico sin UI (Fases 0, 2 y 3) sí puede avanzar en paralelo.
2. **Cada pantalla y componente replica a su equivalente del prototipo:** mismas medidas, tokens, jerarquía, copy y coreografía. No se inventan estilos, componentes ni animaciones cuando el prototipo ya define uno.
3. **`prototype-design/` es de solo lectura.** Nunca se edita. Los tokens, íconos, ilustraciones y el ícono de la app se copian a `src/` con un paso documentado (`pnpm sync:design`).
4. **Si algo falta en el prototipo:**
   1. se deriva del sistema de diseño del prototipo;
   2. se registra en `docs/DESIGN_DEVIATIONS.md`;
   3. si es visible para el usuario, se confirma contigo antes de implementarlo.
5. **Toda desviación inevitable se documenta** con captura y motivo en `docs/DESIGN_DEVIATIONS.md`. Por ejemplo: limitaciones de WebKit o Tauri, o datos reales que no caben.
6. **Precedencia técnica.** El prototipo manda en lo visual y la interacción. La exactitud técnica (valores, unidades, reglas del veredicto, qué es posible en macOS) la manda este plan. Si el copy del prototipo contradice un hecho técnico, se corrige el copy y se registra.
7. **"Terminado" significa** que la pantalla o el componente pasa la revisión de paridad visual (§12.3) en tema oscuro y claro, con movimiento completo y reducido.

### Protocolo por pantalla o componente

1. Abrir la pantalla o estado en el prototipo: navegador integrado, 1512 × 982, con el escenario correspondiente del panel de escenarios.
2. Extraer tokens, medidas, copy y la entrada del catálogo de animaciones (`prototype-design/SPEC.md`).
3. Implementar con los componentes del sistema de diseño en código.
4. Capturar la versión implementada en modo mock, con el mismo escenario y el mismo tema, y compararla lado a lado.
5. Corregir las diferencias o registrarlas como desviación aprobada.

---

## 1. Objetivo y alcance

App de escritorio nativa para macOS que usa `smartctl` para:
- detectar en vivo los discos conectados;
- mostrar su salud con un veredicto claro;
- exponer todas las herramientas de lectura de smartctl;
- ejecutar pruebas y monitorear la temperatura;
- generar reportes profesionales, con historial por disco.

**MVP (v1.0):**
- Verificación del entorno (smartctl instalado, versión, JSON, acceso).
- Dispositivos con conexión en caliente (hot-plug) animada.
- Detalle del disco con 7 pestañas: Resumen · Salud SMART · Temperatura · Pruebas · Registros · Identidad · Consola.
- Escaneo de lectura (completo y rápido) con temperatura en vivo y comparación SMART antes/después.
- Autopruebas de smartctl detrás de una detección de capacidad (bloqueadas en macOS para NVMe, con su explicación).
- Reportes en PDF, HTML y JSON; historial por disco; comparación de instantáneas.
- Ajustes, paleta de comandos (⌘K) y consola de comandos.

**Fuera de alcance de la v1 (backlog):**
- benchmark de escritura;
- monitoreo programado con `smartd`;
- ícono en la barra de menús con temperatura;
- pruebas por lotes;
- soporte para Linux o Windows;
- interfaz en inglés;
- actualizaciones automáticas;
- firma y notarización para distribuir;
- base de datos de TBW nominal por modelo.

---

## 2. Hallazgos técnicos verificados en tu Mac

Verificado el 24-sep-2026 con comandos de solo lectura.

| Tema | Resultado |
|---|---|
| Sistema | macOS 27.0 (26A428), Apple M5 Pro, arm64. |
| smartctl | 7.5 (2025-04-30 r5714), instalado con Homebrew en `/opt/homebrew/bin/smartctl`. |
| JSON | `-j` funciona. `--json=o` añade la salida de texto clásica en `smartctl.output[]`, así que **una sola ejecución alimenta las vistas "JSON" y "Texto"**. |
| Privilegios | La lectura SMART de NVMe **no requiere sudo** (verificado con el SSD interno). |
| Scan | `smartctl --scan-open -j` devuelve **rutas IOService**, no `/dev/diskN`. smartctl acepta `disk0` directamente, así que **usamos el `diskN` de `diskutil` como identificador de ejecución**. |
| SSD interno (APPLE SSD AP1024Z) | La salud se lee completa. **El log de errores falla** (`GetLogPage failed … code=745`): `exit_status = 4`, pero el resto de los datos es válido. Además: `self_test: false`, no reporta umbrales de temperatura ni el arreglo `nvme_namespaces`. |
| Claves JSON útiles en 7.5 | `temperature.current`, `spare_available.{current_percent, threshold_percent}`, `endurance_used.current_percent`, `power_on_time.hours`, `power_cycle_count`, `nvme_smart_health_information_log.*`, `nvme_optional_admin_commands.self_test`. |
| NVMe en macOS (código fuente de `os_darwin.cpp`) | Solo se soportan **Identify** y **Get Log Page**. Cualquier otro comando admin falla con `NVMe admin command 0x.. is not supported`. En consecuencia, **en macOS no hay autopruebas NVMe (`-t short/long`) ni cancelación (`-X`)**. |
| USB en macOS | `get_scsi_device` devuelve 0 ("scsi devices are not supported"). Los **puentes USB (JMicron, Realtek, ASMedia; `-d sat`, `-d snt*`) no funcionan en macOS**. Solo los gabinetes **Thunderbolt o USB4** (túnel PCIe, NVMe nativo) entregan SMART. |
| ATA/SATA | Las autopruebas ATA sí están soportadas vía IOKit, siempre que el dispositivo exponga la interfaz SMART de Apple. |
| diskutil | `diskutil info -plist` entrega `BusProtocol` (el interno reporta "Apple Fabric"), `Internal`, `Removable`, `Ejectable`, `SolidState`, `SMARTStatus`, `TotalSize` y `DeviceTreePath`. |
| system_profiler | Están disponibles `SPNVMeDataType` (relaciona `bsd_name` con el modelo, e incluye `detachable_drive`), `SPThunderboltDataType` y `SPUSBHostDataType` (permite identificar el puente USB). |
| Toolchain | Node 26.8.1, pnpm 12.4.1, Xcode 27.0, Swift 6.4, Deno 2.9.6, Python 3.14. **Rust no está instalado** y Tauri lo requiere. |

Las muestras reales (con la serie enmascarada) están en `docs/research/smartctl-samples/`.

**Consecuencia para el producto.** En macOS, la app "prueba" discos NVMe de dos formas:
1. con la **lectura completa** de salud y logs vía smartctl;
2. con un **escaneo de lectura de superficie** propio, no destructivo, con monitoreo térmico y comparación SMART antes/después.

Las autopruebas de smartctl aparecen **bloqueadas y con su explicación**. Se habilitan solas si la plataforma o el dispositivo las soportan (por ejemplo, SATA vía IOKit).

---

## 3. Stack recomendado y arquitectura

### 3.1 Decisión: app nativa con **Tauri 2** (Rust) + **React + TypeScript**

**Por qué:**
- **Experiencia nativa.** Es una ventana real de macOS: barra de título unificada, semáforos y material translúcido (vibrancy) nativo en la barra lateral. Tiene ícono en el Dock con progreso, notificaciones del sistema, diálogos nativos de guardado y barra de menús.
- **El prototipo HTML se traslada casi 1:1.** El frontend es web y corre en WKWebView, el mismo motor de Safari.
- **Seguridad.** No hay un servidor HTTP local que ejecute comandos de disco. La comunicación es por IPC, con permisos mínimos.
- **Ligereza.** El binario pesa ~10–20 MB y consume poca RAM frente a Electron.
- **Rust** es ideal para orquestar procesos (smartctl, diskutil), para la lectura de disco de bajo nivel del escaneo y para SQLite.

**Alternativas evaluadas:**

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| Web local (Node + navegador) | Sin instalar nada extra; iteración muy rápida. | Vive en una pestaña del navegador. Un servidor local que ejecuta comandos es superficie de ataque (DNS rebinding, CSRF). Sin vibrancy, Dock ni notificaciones nativas. | Se usa solo como **modo mock de desarrollo** (§3.4). |
| Electron | Todo en TypeScript. | Más de 150 MB y más RAM. Chromium no es Safari. | Plan B si no quieres instalar Rust. |
| SwiftUI nativo | Máxima integración con macOS. | El prototipo HTML no se reutiliza; habría que reescribir el diseño completo. | Descartado. |

> **Si prefieres no instalar Rust:** el frontend y los contratos de §5.9 se mantienen, y el núcleo se implementa en Node dentro de Electron. El resto del plan casi no cambia.

### 3.2 Tecnologías

**Frontend:**
- React 19 + TypeScript (strict) + Vite.
- **Estilos: la misma tecnología del prototipo.** Si llega en HTML/CSS, se porta su CSS con tokens y clases `hdi-*`. Si llega en Tailwind, se usa Tailwind v4 con `@theme`. Se decide en la Fase 1.
- **Motion** (`motion/react`) para layout, elementos compartidos, presencia y springs. Transiciones CSS para hover y press.
- TanStack Query para el estado de servidor/IPC y Zustand para el estado de la UI.
- React Router con router de hash, con las mismas rutas del prototipo.
- Primitivas de Radix UI (menús, diálogos, tooltips, pestañas) con la apariencia del prototipo. `cmdk` para la paleta de comandos.
- `d3-scale` y `d3-shape` con SVG propio para anillos y gráficos, sin librería de gráficos pesada, para lograr fidelidad total con el prototipo.

**Núcleo:**
- Rust estable, Tauri 2 y `tokio` (process, time, sync, fs).
- `serde` / `serde_json`, `plist`, `rusqlite` (bundled) con `rusqlite_migration`.
- `thiserror`, `tracing`, `sha2`, `regex`.
- `specta` + `tauri-specta` para generar desde Rust los tipos TS de todos los comandos y eventos.

**Plugins de Tauri:** `dialog`, `notification`, `opener` (mostrar en Finder), `window-state`, `single-instance` y `log`.

**Tooling:**
- pnpm, ESLint + Prettier.
- Vitest + Testing Library, y Playwright **con el motor WebKit**, el más cercano a WKWebView.
- `cargo test` + `insta` (snapshots), `clippy` y `rustfmt`.

**Versiones:** las estables vigentes al hacer el scaffold, verificadas con Context7.

### 3.3 Arquitectura

```
┌──────────────────────────── HealthDiskInfo.app (Tauri 2) ─────────────────────────────┐
│ FRONTEND · WKWebView                                                                    │
│  React 19 + TS · estilos/tokens del prototipo · Motion · TanStack Query · Zustand       │
│  features/  entorno · dispositivos · detalle · pruebas · reportes · historial · ajustes │
│  domain/    métricas, veredicto, alertas, frases (TS puro, 100 % testeado)              │
│  services/Backend ─► adaptador "tauri" (invoke + Channels) │ adaptador "mock" (fixtures) │
├─────────────────────────────── IPC tipado (tauri-specta) ──────────────────────────────┤
│ NÚCLEO RUST (src-tauri)                                                                 │
│  smartctl/  localizador · runner seguro · allowlist · bits de salida · parser tolerante │
│  devices/   diskutil + smartctl -i + system_profiler · registro · watcher hot-plug      │
│  monitor/   muestreo de temperatura (Channel)                                           │
│  tests/     autopruebas (si hay capacidad) · orquestador del escaneo de lectura         │
│  store/     SQLite: discos, instantáneas, pruebas, reportes, comandos, ajustes          │
│  report/    exportación PDF (impresión WebKit) · HTML · JSON                            │
└───────────────┬──────────────────────────┬──────────────────────────┬──────────────────┘
                │ spawn, sin shell         │ spawn, sin shell         │ osascript (admin)
                ▼                          ▼                          ▼
     /opt/homebrew/bin/smartctl   diskutil · system_profiler    hdi-scan (root, solo lectura)
                                  caffeinate                    → /dev/rdiskN
```

**Flujo típico al abrir un disco:**
1. La UI llama a `smart_read(deviceId, "extended")`.
2. Rust valida el disco y la operación.
3. Ejecuta `smartctl -x --json=o disk4` sin shell, con timeout y en la cola de ese disco.
4. Parsea el JSON de forma tolerante, decodifica los bits de salida, registra el comando y guarda la instantánea en SQLite.
5. Devuelve un `SmartReading` tipado.
6. La UI calcula el veredicto con `domain/` y anima los cambios.

**Canales de eventos:** `device_events`, `monitor_samples`, `scan_progress` y `selftest_progress`.

### 3.4 Modo mock (web)

`pnpm dev:web` levanta el frontend en el navegador con un adaptador mock. Usa los fixtures reales de la Fase 0 y un simulador de conexión en caliente, temperatura y pruebas.

**Los escenarios del mock replican 1:1 los del panel de escenarios del prototipo**, por ejemplo `?scenario=mixed-6`. Son la base de las pruebas E2E y de la revisión de paridad visual. También permiten trabajar la UI sin tener discos conectados.

---

## 4. Estructura del repositorio

```
healthDiskInfo/
├── CLAUDE.md                     ← contexto persistente para sesiones de Claude Code
├── prototype-design/             ← PROTOTIPO: fuente de verdad visual (solo lectura)
├── docs/
│   ├── DESIGN_PROMPT.md          ← prompt para generar el prototipo
│   ├── IMPLEMENTATION_PLAN.md    ← este documento
│   ├── DESIGN_MAPPING.md         ← (Fase 1) prototipo → código: tokens, componentes, rutas, motion
│   ├── DESIGN_DEVIATIONS.md      ← (Fase 1+) desviaciones aprobadas
│   ├── CAPABILITY_MATRIX.md      ← (Fase 0) qué funciona con cada gabinete y disco
│   ├── design-baseline/          ← (Fase 1) capturas del prototipo por pantalla/escenario/tema
│   ├── parity/                   ← reportes de paridad visual por fase
│   └── research/smartctl-samples/← muestras reales (serie enmascarada)
├── fixtures/                     ← salidas reales capturadas en la Fase 0 (Rust y mock las comparten)
│   ├── smartctl/  diskutil/  system_profiler/  diskutil-activity/
├── scripts/
│   ├── capture-fixtures.sh       ← captura de solo lectura, enmascara series
│   └── sync-design.mjs           ← copia tokens/íconos del prototipo a src/ y detecta divergencias
├── src/                          ← frontend
│   ├── app/                      ← router, providers, shell (barra lateral, barra superior, consola)
│   ├── design-system/            ← tokens.css, motion.ts, components/ (uno por carpeta)
│   ├── features/
│   │   ├── environment/          ← verificación del entorno
│   │   ├── devices/              ← lista, tarjetas, hot-plug
│   │   ├── device-detail/        ← overview, smart, temperature, tests, logs, identity, console
│   │   ├── tests/                ← escaneo, autopruebas, progreso persistente
│   │   ├── reports/              ← constructor, ReportDocument, exportación
│   │   ├── history/              ← timeline, comparación
│   │   ├── command-palette/
│   │   └── settings/
│   ├── domain/                   ← normalización derivada, veredicto, alertas, formatos (TS puro)
│   ├── services/                 ← Backend (interfaz), bindings.ts (generado), tauri/, mock/
│   ├── mocks/                    ← escenarios y simulador (usa /fixtures)
│   └── i18n/es-MX.ts
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs · main.rs
│   │   ├── commands/             ← IPC: env, devices, smart, monitor, tests, reports, history, settings
│   │   ├── smartctl/             ← locator, runner, ops (allowlist), exit_status, model, parse
│   │   ├── devices/              ← diskutil, profiler, registry, watcher
│   │   ├── monitor/
│   │   ├── tests/                ← selftest, scan (orquestador + lanzador privilegiado)
│   │   ├── store/                ← sqlite, migrations, repos
│   │   └── report/               ← pdf (WKWebView), html, json
│   ├── helpers/hdi-scan/         ← binario privilegiado de SOLO LECTURA (crate aparte)
│   ├── capabilities/             ← permisos mínimos de Tauri
│   └── tauri.conf.json
├── e2e/                          ← Playwright (WebKit) contra el modo mock + script de paridad
└── package.json
```

---

## 5. Núcleo Rust: smartctl y macOS

### 5.1 Localización y verificación de smartctl

Las apps que se abren desde Finder **no heredan el `PATH` de la shell**. Por eso smartctl se busca en este orden:
1. la ruta configurada en Ajustes;
2. `/opt/homebrew/bin/smartctl`;
3. `/usr/local/bin/smartctl`;
4. `/opt/local/bin/smartctl` (MacPorts);
5. el `PATH`.

Después se ejecuta `smartctl --version` y se lee la versión. El mínimo es 7.0 (JSON) y lo recomendado es 7.4 o superior; con 7.5 se aprovechan las claves normalizadas. El resultado alimenta la pantalla "Verificación del entorno".

### 5.2 Ejecutor seguro (runner)

- **Ejecución:** `tokio::process::Command` con **argumentos en vector** (nunca shell), ruta absoluta y entorno mínimo (`LC_ALL=C` para que el texto sea estable).
- **Operaciones:** son un **enum cerrado (allowlist)** que se traduce a flags. Todas se ejecutan con `--json=o` salvo el muestreo de temperatura.

| Operación | Flags | Uso en la UI |
|---|---|---|
| `Info` | `-i` | Identidad; descubrimiento |
| `Health` | `-H` | Veredicto rápido |
| `Attributes` | `-A` | Salud SMART; muestreo de temperatura (con `-j`) |
| `Capabilities` | `-c` | Capacidades |
| `ErrorLog` | `-l error` | Registros |
| `SelfTestLog` | `-l selftest` | Registros; progreso de autoprueba |
| `All` | `-a` | Consola |
| `Extended` | `-x` | Lectura completa (por defecto al abrir un disco) |
| `SelfTest{Short,Long}` | `-t short` / `-t long` | Pruebas (solo si hay capacidad, §8.1) |
| `AbortSelfTest` | `-X` | Pruebas (solo si hay capacidad) |
| `ScanOpen` | `--scan-open` | Descubrimiento |

- **Modo experto:** solo combina operaciones del enum con opciones de una lista cerrada: `-d` (auto, nvme, ata, sat) y `-T permissive`. **Nunca** expone `-s`, `-S`, `-o`, `--set`, `-g`, `-F` ni ninguna opción que modifique el dispositivo.
- **Validación del identificador:** debe cumplir `^disk[0-9]+$` **y** estar en el registro actual de dispositivos.
- **Timeouts:** 20 s para lecturas, 5 s para el muestreo `-A`. Los procesos se cancelan al cerrar la app.
- **Cola por disco:** nunca corren dos smartctl a la vez sobre el mismo disco. Discos distintos sí se leen en paralelo.
- **Resultado:** `CommandRecord { argv, startedAt, durationMs, exitStatus, exitBits[], messages[], json, text[], stderr }`. Se guarda en el log de comandos, que alimenta la consola.
- **Se parsea el JSON aunque `exit_status ≠ 0`,** porque suele venir completo; por ejemplo, el exit 4 del SSD de Apple.

### 5.3 Parser tolerante y normalización

- Estructuras `serde` con campos `Option` y `#[serde(default)]`, más el `serde_json::Value` crudo para las vistas JSON y Texto y para compatibilidad hacia adelante.
- Se normaliza a `SmartData { identity, health, capabilities, errorLog?, selfTestLog?, temperatures, meta }`. Se prefieren las claves de 7.5 y, si faltan, se usan las del log NVMe (Apéndice A).
- Cada sección tiene un estado: `ok`, `unavailable{reason}` o `failed{message}`. Así la UI muestra lecturas parciales sin romperse.
- Soporte ATA/SATA básico en el modelo (atributos, autopruebas por IOKit). La UI se centra en NVMe.

### 5.4 Decodificación del código de salida

Máscara de bits documentada en el **Apéndice B**. Cada bit activo se convierte en un chip legible con su severidad.

### 5.5 Descubrimiento de dispositivos

1. `diskutil list -plist physical` → discos físicos completos (excluye imágenes y discos virtuales).
2. Por cada disco, `diskutil info -plist diskN` → bus, interno o externo, extraíble, expulsable, tamaño, nombre y `SMARTStatus`.
3. `smartctl -i --json=o diskN` → protocolo, disponibilidad SMART, modelo, serie y firmware. Clasifica el acceso SMART como `full`, `partial` o `unsupported{reason}` (`usb_bridge`, `no_smart`, `open_failed`).
4. **Enriquecimiento asíncrono, con caché y refresco en cada hot-plug:** `system_profiler SPNVMeDataType SPThunderboltDataType SPUSBHostDataType -json` →
   - tipo de conexión: Interno, Thunderbolt/USB4 o USB;
   - enlace PCIe (generación y ancho);
   - puente USB por vendor y product ID, por ejemplo `0bda:9210` → Realtek RTL9210, o `152d:0583` → JMicron JMS583.
5. **Identidad persistente:** `deviceKey = sha256(model + serial)`. Sin SMART, se usa `model + tamaño + serie USB` como respaldo.
6. El resultado es un `Device` (§5.9). El disco interno se incluye, marcado `internal: true`.

### 5.6 Conexión en caliente (hot-plug)

- **Mecanismo principal:** un proceso hijo `diskutil activity`, que emite el flujo de eventos `***DiskAppeared ('diskN' …)` y `***DiskDisappeared ('diskN' …)`.
  - Se filtran los discos completos y se aplica un debounce de 500 ms.
  - Después se redescubre ese disco y se emite `DeviceEvent::{Attached, Detached, Updated}` por el Channel.
- **Respaldo:** si el proceso muere, se reinicia solo, y mientras tanto se sondea `diskutil list -plist physical` cada 3 s.
- **Por evaluar en la Fase 0:** usar DiskArbitration nativo vía `objc2` si el formato de `diskutil activity` resulta frágil.

### 5.7 Monitor de temperatura

- `monitor_start(deviceId, intervalMs)` ejecuta en bucle `smartctl -A -j diskN`, sin `=o` para que sea más liviano, cada 1, 2 o 5 s. Emite `TempSample { t, composite, sensors[] }` por el Channel.
- Solo corre en tres casos: con la pestaña Temperatura abierta, durante una prueba o con monitoreo explícito. Se detiene al desconectar el disco.
- **Umbrales:** `nvme_composite_temperature_threshold.{warning, critical}`. Si faltan o valen 0 (como en el SSD de Apple), se usan 70/80 °C configurables, marcados como "estimados".

### 5.8 Otras operaciones de sistema

- **Expulsar:** `diskutil eject diskN`, con confirmación previa si hay volúmenes montados.
- **Mantener la Mac despierta** durante las pruebas: `caffeinate -ims -w <pid de la prueba>`.
- **Dock y notificaciones:** progreso en el Dock con `window.setProgressBar` y notificaciones con el plugin.
- **Menú nativo de la app:** replica los atajos del prototipo (⌘K, ⌘R, ⌘E, ⌘J, ⌘1…⌘7, ⌘,).

### 5.9 Contratos IPC (tipados con tauri-specta)

```text
env_check()                                   -> EnvReport { smartctl{path,version,json}, platform, issues[] }
devices_list() / devices_rescan()             -> Device[]
devices_watch(ch: Channel<DeviceEvent>)       -> ()
smart_read(deviceId, op)                      -> SmartReading { data: SmartData, record: CommandRecord }
smart_run_expert(deviceId, ops[], options[])  -> CommandRecord
command_log(limit)                            -> CommandRecord[]
monitor_start(deviceId, intervalMs, ch)       -> MonitorId        · monitor_stop(id)
selftest_start(deviceId, kind, ch)            -> TestRunId        · selftest_abort(deviceId)
scan_start(deviceId, mode, ch)                -> TestRunId        · scan_cancel(id)
test_runs(deviceKey)                          -> TestRun[]
history_devices() / history_snapshots(deviceKey) / history_compare(a, b)
reports_list() / report_export(reportId, format, path) / report_delete(id)
settings_get() / settings_set(patch)
device_eject(deviceId) · reveal_in_finder(path)
```

**Tipos clave:**
```text
Device {
  id: "disk4",                  // volátil
  key: "sha256…",               // persistente
  model, serial?, capacityBytes, internal, removable, ejectable,
  connection: { kind: internal|thunderbolt_usb4|usb|unknown, link?: {gen, width}, bridge?: {vendor, chip} },
  protocol: nvme|ata|unknown,
  smartAccess: full|partial{sections[]}|unsupported{reason},
  capabilities: { selfTest: supported|unsupported_platform|unsupported_device, errorLog, selfTestLog },
  ioServicePath?
}
DeviceEvent = Attached{device} | Detached{id, key} | Updated{device}
```

**Configuración de la ventana** (validar las claves exactas con la documentación de Tauri al hacer el scaffold):
```json
{
  "app": {
    "macOSPrivateApi": true,
    "windows": [{
      "label": "main", "title": "HealthDiskInfo",
      "width": 1440, "height": 900, "minWidth": 1100, "minHeight": 720,
      "titleBarStyle": "Overlay", "hiddenTitle": true, "transparent": true,
      "windowEffects": { "effects": ["sidebar"], "state": "followsWindowActiveState" }
    }]
  }
}
```
La posición de los semáforos (`trafficLightPosition`) se alinea con la zona reservada del prototipo. Hay que verificar que la versión de Tauri la soporte.

---

## 6. Modelo de dominio: métricas, veredicto y alertas

Vive en `src/domain/` como TS puro, sin I/O y con tests. Lo usan los adaptadores `tauri` y `mock`, la UI y los reportes. Así el veredicto es idéntico en la app, en el mock y en el PDF.

### 6.1 Métricas derivadas

| Métrica | Fórmula |
|---|---|
| Vida útil restante (%) | `max(0, 100 − percentUsed)`, con `percentUsed = endurance_used.current_percent ?? percentage_used` |
| TB escritos / leídos | `data_units_* × 512 000 / 10¹²` |
| Días de uso | `power_on_hours / 24` |
| Ritmo de escritura | TB escritos ÷ días de uso (informativo) |
| TBW consumido (opcional) | TB escritos ÷ TBW nominal indicado por ti en Ajustes |
| Deltas | diferencia campo a campo entre dos instantáneas |
| Estado térmico | Normal / Elevada (≥ advertencia − 5 °C) / Advertencia (≥ advertencia) / Crítica (≥ crítica) |

**Formato de números:** lo dicta el prototipo. Por defecto se usa `Intl` con `es-MX`: TB con 2 decimales por debajo de 100, 1 decimal entre 100 y 999, y ninguno desde 1000 (31.64 · 312.4 · 1,352).

### 6.2 Veredicto (reglas; umbrales configurables en Ajustes → Umbrales avanzados)

Se evalúa de arriba abajo; la **primera regla que se cumple** determina el veredicto.

| Veredicto | Condición |
|---|---|
| **Sin datos** | `smartAccess = unsupported`. |
| **Crítico** | Se cumple cualquiera de estas: `critical_warning` con el bit 0, 2, 3, 4 o 5 activo · `smart_status.passed = false` (o bit 3 de salida) · repuesto < umbral · errores de medios ≥ 10. |
| **Atención** | Se cumple cualquiera de estas: errores de medios entre 1 y 9 · repuesto < 100 **y** repuesto ≤ umbral + 10 · vida útil restante ≤ 20 %. |
| **Óptimo** | Ninguna de las anteriores y vida útil restante ≥ 80 %. |
| **Bueno** | Ninguna de las anteriores y vida útil restante entre 21 % y 79 %. |

- El **anillo principal** muestra la vida útil restante con el color del veredicto, a la manera de "Bueno (98 %)" de CrystalDiskInfo.
- **No cambian el veredicto** (son notas o alertas aparte):
  - apagados inseguros → consejo "expulsa antes de desconectar";
  - entradas del log de errores → muchas son benignas;
  - `warning_temp_time` y `critical_comp_time` → nota térmica;
  - bit 1 de advertencia crítica o temperatura alta en el momento → alerta térmica transitoria;
  - lecturas parciales → aviso por sección.
- **Comprobación con los mocks del prompt de diseño:** Samsung → Óptimo 98 · WD → Bueno 58 · Kingston → Atención 12 · SK hynix → Crítico 9 · Crucial USB → Sin datos · Apple → Óptimo 99. Estos casos se convierten en tests.

### 6.3 Alertas y recomendaciones

Cada regla produce: `{ severity, title, explanation, action }`. Ejemplos:
- Repuesto por debajo del umbral → "Respalda tus datos lo antes posible y reemplaza el disco".
- Errores de medios > 0 → "Hay datos que el disco no pudo recuperar; ejecuta un escaneo completo".
- Vida útil ≤ 20 % → "Planifica el reemplazo".
- Temperatura ≥ advertencia → "Mejora la disipación del gabinete".
- USB sin SMART → "Usa un gabinete Thunderbolt/USB4".

Los textos definitivos salen del copy del prototipo.

### 6.4 Resumen en lenguaje natural

Plantillas por veredicto, rellenadas con valores. Por ejemplo: *"Excelente estado: 98 % de vida útil restante y sin errores de medios. 31.64 TB escritos en 2,164 h de uso."* Se usan en el Resumen, la barra de Historial y el reporte.

---

## 7. Frontend: del prototipo al código

### 7.1 Tokens

- `prototype-design/css/tokens.css` se copia 1:1 a `src/design-system/tokens.css`. `pnpm sync:design` lo copia y avisa si hay divergencias.
- `tokens.json` (DTCG) se convierte en `src/design-system/tokens.ts`, con tipos. Así los tokens de movimiento (duraciones, curvas, springs) se usan también desde Motion.
- Si el prototipo usa Tailwind, `@theme` mapea exactamente las mismas variables.

### 7.2 Componentes

- El inventario de `SPEC.md` se traduce en `docs/DESIGN_MAPPING.md` y cada componente vive en `src/design-system/components/<Nombre>/` (TSX + CSS).
- **Se conservan la estructura DOM, las clases `hdi-*` y los atributos `data-variant` / `data-state` del prototipo**, para que el CSS portado funcione sin reinterpretarlo.
- Las primitivas de Radix aportan accesibilidad (foco, ARIA, teclado) con la apariencia del prototipo.
- La ruta de desarrollo `#/__design-system` reproduce `design-system.html` para compararlos lado a lado.

### 7.3 Ventana y shell nativos

- La configuración de la ventana está en §5.9.
- La franja superior lleva `data-tauri-drag-region`.
- **Barra lateral:** fondo transparente para que se vea el material nativo (`windowEffects: sidebar`). **El contenido:** superficie sólida.
  - Esto sustituye el `backdrop-filter` simulado del prototipo. Es una **desviación esperada, aprobada de antemano:** mismo aspecto, pero con un material real.
- `prefers-reduced-transparency` → fondo sólido, como define el prototipo.

### 7.4 Movimiento

- Los tokens del prototipo se trasladan a `src/design-system/motion.ts`.
- Configuración global: `<MotionConfig reducedMotion="user">`, más la preferencia de Ajustes (Sistema / Reducido / Completo).
- **Técnica según el tipo de animación** (lo confirma el catálogo de `SPEC.md`):
  - Hover, press y color → transición CSS.
  - Entrada y salida (toasts, tarjetas, diálogos, filas) → `AnimatePresence`.
  - Reacomodo de la cuadrícula e indicador de pestañas → `layout` / `layoutId`.
  - Tarjeta → encabezado del detalle → `layoutId` compartido (elemento compartido, coreografía 4).
  - Anillos y contadores → `animate`/`useSpring` desde el valor actual (interrumpible).
  - Gráficos en vivo → transformación del grupo SVG con `requestAnimationFrame`, sin re-render de React por cada punto.
- Las acciones de teclado no se animan.
- **Rendimiento en WebKit:**
  - animar solo `transform` y `opacity`;
  - limitar `backdrop-filter`;
  - para animaciones críticas bajo carga, usar el string `transform` completo en lugar de `x`/`y`.
- En modo desarrollo hay un control global de velocidad (1×, 0.5×, 0.25×) para revisar las coreografías.

### 7.5 Estado y datos

- **TanStack Query:**
  - claves `['devices']`, `['smart', deviceKey]`, `['history', deviceKey]`, `['reports']`;
  - se invalidan con los eventos de hot-plug;
  - `staleTime` corto para los datos de salud.
- **Zustand:** selección de disco, estado de la consola, pruebas activas (sobreviven a la navegación) y preferencias.
- **Adaptador `Backend`:** interfaz única con dos implementaciones, `tauri` y `mock`. La UI nunca llama a `invoke` directamente.

### 7.6 Accesibilidad e idioma

- Strings en `src/i18n/es-MX.ts`, listos para agregar inglés después. Formato con `Intl` (`es-MX`).
- **Accesibilidad:**
  - foco visible;
  - navegación completa por teclado;
  - `aria-live` para el progreso y los avisos de conexión;
  - etiquetas para VoiceOver;
  - contraste AA, verificado con axe en E2E.

---

## 8. Pruebas de disco

### 8.1 Autopruebas de smartctl (según la capacidad detectada)

- **Se habilitan solo si** `nvme_optional_admin_commands.self_test = true` **y** la plataforma permite el comando. En macOS, NVMe → no; ATA vía IOKit → sí.
- **En macOS con NVMe** se muestra el estado "bloqueada" del prototipo, con la explicación.
- **Flujo cuando aplica:**
  1. `-t short` o `-t long`.
  2. Sondeo de `-l selftest` cada 5 s (`current_self_test_operation`, `current_self_test_completion_percent`).
  3. Resultado según la tabla del log.
  4. `-X` para abortar.
- El **historial de autopruebas guardado en el disco** se muestra siempre que `-l selftest` lo devuelva.

### 8.2 Escaneo de lectura (no destructivo)

**Qué es:** lectura secuencial de toda la superficie (modo completo) o de ~2 % repartido por el disco (modo rápido). Mide la velocidad por posición y localiza zonas ilegibles. **Nunca escribe.**

**Restricción:** solo para discos externos. El disco interno de arranque aparece deshabilitado, con el motivo.

**Helper `hdi-scan`** (crate aparte, se incluye en la app como `externalBin`):
- **Argumentos:** `--device diskN --mode full|quick --progress <archivo.jsonl> --cancel <archivo> --heartbeat <archivo>`. Valida `^disk[0-9]+$`.
- **Lectura:**
  - Abre `/dev/rdiskN` con `O_RDONLY` y `fcntl(F_NOCACHE)`.
  - Obtiene el tamaño con `DKIOCGETBLOCKCOUNT` × `DKIOCGETBLOCKSIZE`.
  - Lee en bloques alineados de 8 MiB.
  - Si falla con `EIO`, vuelve a leer ese bloque en trozos de 64 KiB para acotar el rango ilegible, con límite de reintentos y de tiempo.
- **Progreso:** escribe JSON Lines cada ~250 ms con `{pos, total, mbps, errors[], bucket}`. Agrega la velocidad en ~1000 cubetas por posición para el gráfico de velocidad por LBA.
- **Parada:**
  - Termina si aparece el archivo de cancelación.
  - Termina si el *heartbeat* de la app lleva más de 10 s sin actualizarse (la app se cerró).
  - Termina si el disco desaparece (ENXIO/EIO continuos) → estado "interrumpida".
- **Modo rápido:** ~1000 regiones de 32 MiB repartidas uniformemente con un jitter reproducible (la semilla se guarda en el resultado).

**Lanzamiento con privilegios.** macOS muestra su diálogo nativo de contraseña. El script se pasa como `argv`, así que no hay inyección posible:
```text
osascript -e 'on run argv' \
  -e 'do shell script (quoted form of item 1 of argv) & " --device " & (quoted form of item 2 of argv) & " --mode " & (quoted form of item 3 of argv) & " --progress " & (quoted form of item 4 of argv) & " --cancel " & (quoted form of item 5 of argv) & " --heartbeat " & (quoted form of item 6 of argv) with administrator privileges with prompt (item 7 of argv)' \
  -e 'end run' <helper> <diskN> <mode> <progress> <cancel> <heartbeat> "<texto del prompt>"
```

**Orquestación desde la app:**
1. Instantánea SMART "antes".
2. Lanzar el helper.
3. Leer el archivo de progreso mientras avanza y reenviarlo por el Channel.
4. Monitor de temperatura en paralelo.
5. `caffeinate -ims -w <pid>` para mantener la Mac despierta.
6. Progreso en el Dock.
7. Al terminar: instantánea "después", resultado y notificación del sistema.

**Seguridad:** el helper solo lee. Sin la contraseña no se ejecuta como root. No acepta rutas de dispositivo arbitrarias.

### 8.3 Resultado de una prueba

`TestRun { kind, status: passed|failed|cancelled|interrupted, durationMs, stats{avg,min,max MB/s, maxTemp}, badRanges[], speedBuckets[], tempSamples[], snapshotBefore, snapshotAfter }`

- **Aprobado:** 0 zonas ilegibles y sin aumento de errores de medios.
- **Con errores:** hay zonas ilegibles o `media_errors` aumentó.
- **Estrangulamiento térmico:** la velocidad cae más de 30 % sostenido con la temperatura ≥ advertencia − 5 °C, o aumentan los contadores de transición térmica cuando el disco los reporta.

---

## 9. Reportes, historial y comparación

### 9.1 Contenido

Según `report-template.html` del prototipo:
- encabezado, ID del reporte (`HDI-AAAAMMDD-XXXX`) y fecha;
- veredicto y vida útil, con la frase en lenguaje natural;
- identidad (serie enmascarada opcional) y métricas clave;
- tabla SMART completa;
- gráficos de temperatura y de velocidad;
- pruebas, con el diff SMART;
- registros;
- observaciones y recomendaciones;
- apéndice técnico: versión de smartctl, plataforma, comandos con su hora y código de salida, y **SHA-256 de los datos crudos**.

### 9.2 Generación

- Un componente React `ReportDocument`, fiel a la plantilla del prototipo, paginado con CSS `@page` en Carta (por defecto) o A4. El mismo componente sirve para la vista previa en vivo del constructor.
- **PDF:**
  - **Método principal:** una ventana oculta renderiza el reporte y la impresión nativa de WebKit lo guarda a archivo sin diálogo (`NSPrintOperation` con `NSPrintJobSavingURL`, vía `objc2`). **Se valida en la Fase 0.**
  - **Respaldo:** el diálogo de impresión nativo ("Guardar como PDF").
- **HTML:** autocontenido, con CSS y SVG en línea.
- **JSON:** esquema versionado `hdi-report/1` con metadatos, datos normalizados, JSON crudo de cada comando y hash.
- El archivo se guarda con el diálogo nativo, y luego se ofrece **"Mostrar en Finder"**.

### 9.3 Historial y comparación

- **Instantánea automática** al leer un disco, si cambió algo o si pasaron 10 min o más desde la anterior. Además, una antes y otra después de cada prueba.
- **Historial:** timeline por disco (vida útil, TB escritos, errores de medios, temperatura máxima) y **comparación de dos instantáneas** con los cambios coloreados según su efecto.

---

## 10. Persistencia

La base es SQLite en `~/Library/Application Support/<bundle-id>/healthdiskinfo.db`, con migraciones versionadas.

```sql
devices     (key PK, model, serial, capacity_bytes, first_seen, last_seen, rated_tbw NULL, notes NULL)
snapshots   (id PK, device_key FK, taken_at, source /*auto|manual|test_before|test_after*/,
             smartctl_version, exit_status, verdict, life_pct, temp_c,
             normalized_json, raw_json, raw_sha256)
test_runs   (id PK, device_key FK, kind, status, started_at, ended_at,
             stats_json, bad_ranges_json, speed_buckets_json, snapshot_before FK, snapshot_after FK)
temp_samples(id PK, device_key FK, test_run_id FK NULL, t, composite_c, sensors_json)
reports     (id PK, device_key FK, created_at, format, path, verdict, options_json, sha256)
command_log (id PK, device_key NULL, at, argv_json, duration_ms, exit_status, exit_bits, stderr)
settings    (key PK, value_json)
```

**Retención:**
- `command_log`: los últimos 2,000.
- `temp_samples`: solo de pruebas y sesiones de monitoreo explícitas.
- Exportar y borrar el historial se hace desde Ajustes.

---

## 11. Seguridad y privacidad

- **Sin red.** La app no hace llamadas externas: CSP `default-src 'self'` y sin telemetría.
- **Sin shell.** Solo operaciones de la allowlist, sobre identificadores de disco validados contra el registro.
- **Sin operaciones destructivas.** No existen en el código: ni formateo, ni firmware, ni `--set`, ni `-s`/`-S`/`-o`, ni escritura en el disco.
- **Helper privilegiado mínimo:** solo lectura, con argumentos validados, y solo corre después de que escribes tu contraseña.
- **Capacidades de Tauri mínimas.** No se exponen los plugins `shell` ni `fs` al frontend; todo pasa por comandos tipados.
- **Número de serie enmascarado por defecto** en la UI y en los reportes (configurable).

---

## 12. Estrategia de calidad

### 12.1 Núcleo (Rust)

- Tests de parser y normalización con **todos los fixtures reales** de la Fase 0: SSD Apple (lectura parcial), NVMe vía Thunderbolt/USB4, puente USB sin SMART y, si existe, ATA. Se comparan con snapshots `insta`.
- Tests de:
  - la decodificación de los bits de salida;
  - la allowlist (el modo experto no puede producir flags prohibidos);
  - la validación de identificadores;
  - el parseo de `diskutil activity`;
  - el cálculo de TB.
- Test del helper con un **archivo de imagen de disco** (`hdiutil create` → `attach` sin montar) para que no dependa de hardware.

### 12.2 Frontend

- Vitest para `domain/`: las reglas del veredicto se prueban como tabla, incluidos los 6 mocks del prompt; también los formatos y las alertas.
- Testing Library para los componentes con estados.
- Playwright (WebKit) E2E contra el modo mock: flujos clave, escenarios, atajos de teclado y axe.

### 12.3 Paridad visual con el prototipo (obligatoria)

- `pnpm parity` recorre `e2e/parity.map.json`, que para cada entrada define `{nombre, ruta del prototipo + escenario, ruta de la app + escenario}`.
- Captura prototipo y app en **WebKit a 1512 × 982**, en tema oscuro y claro.
- Genera `docs/parity/<fecha>/index.html` con las capturas lado a lado y una diferencia de píxeles orientativa.
- **Cada fase de UI cierra con este reporte revisado.** Las diferencias se corrigen o se registran en `DESIGN_DEVIATIONS.md`.

### 12.4 QA manual en hardware real

Checklist:
- conectar y desconectar durante lecturas y durante pruebas;
- Thunderbolt/USB4 frente a USB 3.x;
- lectura parcial;
- escaneo completo largo;
- que la Mac no entre en reposo;
- cerrar la app a mitad de una prueba;
- tema claro y oscuro;
- movimiento reducido;
- VoiceOver.

---

## 13. Fases, entregables y criterios de aceptación

**Resumen de fases:**

| Fase | Nombre | Depende de | ¿Requiere prototipo? | Tamaño |
|---|---|---|---|---|
| 0 | Validación técnica en hardware real | — | No | S |
| 1 | Ingesta del prototipo | prototipo listo | **Sí** | M |
| 2 | Scaffold y fundaciones | 0 | No (UI vacía) | S |
| 3 | Núcleo Rust (smartctl, dispositivos, hot-plug, SQLite) | 0, 2 | No | M |
| 4 | Sistema de diseño en código + shell | 1, 2 | **Sí** | M |
| 5 | Verificación del entorno + Dispositivos | 3, 4 | **Sí** | M |
| 6 | Detalle: Resumen, Salud SMART, Identidad, Registros | 5 | **Sí** | L |
| 7 | Consola, herramientas smartctl y paleta ⌘K | 6 | **Sí** | M |
| 8 | Temperatura en vivo | 6 | **Sí** | S |
| 9 | Pruebas (escaneo de lectura + autopruebas) | 6, 8 | **Sí** | L |
| 10 | Reportes, historial y comparación | 6, 9 | **Sí** | L |
| 11 | Ajustes, pulido, accesibilidad y empaquetado | todas | **Sí** | M |

**Tamaños:** S ≈ 1 sesión de trabajo · M ≈ 2–3 sesiones · L ≈ 4 o más.

> **Mientras generas el prototipo** se pueden completar las Fases 0, 2 y 3. Ninguna pantalla se construye antes de la Fase 1.

### Fase 0: Validación técnica en hardware real

**Objetivo:** confirmar con tus gabinetes y discos reales todo lo que el plan asume.

**Tareas:**
1. Instalar Rust (rustup) y verificar la toolchain de Tauri.
2. Crear `scripts/capture-fixtures.sh`. Es de **solo lectura** y enmascara las series. Para cada disco guarda:
   - `diskutil info -plist`;
   - `smartctl -x --json=o`, `-c`, `-l error` y `-l selftest`;
   - `--scan-open -j`;
   - `system_profiler SPNVMeDataType SPThunderboltDataType SPUSBHostDataType -json`;
   - `diskutil activity` mientras conectas y desconectas.
3. Ejecutarlo con cada combinación disponible: SSD interno, gabinete Thunderbolt/USB4, gabinete USB 3.x y un SATA, si tienes.
4. **Con tu autorización y en un disco de pruebas:** `smartctl -t short diskN`. Error esperado: `NVMe admin command 0x14 is not supported`.
5. **Spike de PDF:** una mini app Tauri que imprime una página HTML paginada a PDF sin diálogo. Se validan Carta y A4, los saltos de página y las fuentes.
6. **Spike de lectura cruda:** leer 1 GiB de `/dev/rdiskN` con privilegios vía `osascript`, medir los MB/s y validar el progreso por archivo, la cancelación y el heartbeat.
7. Documentar en `docs/CAPABILITY_MATRIX.md`: qué funciona con cada gabinete y disco, los mensajes de error exactos y las claves reales de `system_profiler`.

**Entregables:** `fixtures/`, `docs/CAPABILITY_MATRIX.md` y notas de los spikes.

**Aceptación:** cada supuesto de §2 está confirmado o corregido en este plan, y los spikes de PDF y de lectura cruda funcionan o tienen una alternativa decidida.

### Fase 1: Ingesta del prototipo (handoff de diseño)

**Requiere:** `prototype-design/` completo, según el checklist de `DESIGN_PROMPT.md`.

**Tareas:**
1. Hacer el inventario del prototipo (archivos, pantallas, rutas, escenarios, componentes, tokens, catálogo de animaciones) y compararlo con los criterios de aceptación del prompt.
2. Abrirlo en el navegador integrado (WebKit) a 1512 × 982 y capturar **cada pantalla × escenario × tema** en `docs/design-baseline/`.
3. Crear `docs/DESIGN_MAPPING.md` con estas correspondencias:
   - token → variable/código;
   - componente → componente React (props, variantes, estados);
   - pantalla → ruta;
   - animación → técnica (§7.4);
   - escenario del prototipo → escenario del mock.
4. Detectar huecos: estados sin diseñar, pantallas faltantes y conflictos con límites técnicos. Resolverlos contigo y registrarlos en `docs/DESIGN_DEVIATIONS.md`.
5. Decidir la tecnología de estilos según lo que llegue: CSS portado o Tailwind v4.

**Aceptación:** apruebas el mapeo y no queda ninguna pregunta abierta que bloquee.

### Fase 2: Scaffold y fundaciones

**Tareas:**
1. Crear el proyecto Tauri 2 (React + TS + Vite) con pnpm, con la estructura de §4, un bundle id (`com.healthdiskinfo.app`, ajustable) y un ícono provisional.
2. Configurar:
   - la ventana nativa (§5.9);
   - una CSP estricta;
   - las capacidades mínimas;
   - los plugins de §3.2.
3. Preparar el tooling de frontend y de núcleo. Scripts:
   - `dev`: Tauri;
   - `dev:web`: mock en el navegador;
   - `test`, `e2e`, `parity`, `sync:design`, `build`;
   - `check`: lint, types, tests y clippy juntos.
4. Configurar `tauri-specta` para que genere `src/services/bindings.ts`.
5. Crear la interfaz `Backend` y el adaptador mock con los fixtures de la Fase 0 y un selector de escenario (`?scenario=`).

**Aceptación:**
- `pnpm dev` abre una ventana nativa con vibrancy y la zona de los semáforos correcta;
- `pnpm dev:web` abre el mock en el navegador;
- `pnpm check` queda en verde.

### Fase 3: Núcleo Rust

**Tareas:**
- Implementar §5.1–§5.9: localizador, runner con allowlist y cola por disco, parser tolerante, bits de salida, descubrimiento, enriquecimiento con `system_profiler`, hot-plug, monitor, registro de comandos, expulsar y comandos IPC.
- SQLite con sus migraciones iniciales.
- Tests con fixtures.

**Aceptación:**
- los tests pasan con todos los fixtures;
- con un disco real, `devices_list` devuelve datos correctos;
- los eventos de conexión y desconexión llegan en menos de 2 s;
- un USB 3.x queda como `unsupported{usb_bridge}` con el puente identificado;
- los tests demuestran que no se puede invocar ningún flag fuera de la allowlist.

### Fase 4: Sistema de diseño en código + shell

**Tareas:**
- Tokens (`sync:design`) y los componentes del inventario, con todas sus variantes y estados.
- Tokens de movimiento y `MotionConfig`.
- Temas oscuro, claro y sistema, con el crossfade del prototipo.
- **Shell:** barra lateral con vibrancy, barra superior, región de arrastre, cajón de la consola, contenedor de toasts y de diálogos (**coreografías 10–13**: consola, toasts, diálogos y hojas, cambio de tema).
- La ruta `#/__design-system`.

**Aceptación:**
- paridad entre `#/__design-system` y `design-system.html` en ambos temas;
- axe sin violaciones serias;
- reducir movimiento y reducir transparencia funcionan igual que en el prototipo.

### Fase 5: Verificación del entorno + Dispositivos

**Tareas:**
- Onboarding con todos sus estados (smartctl ausente, versión antigua, todo OK).
- Dispositivos: cuadrícula y lista, filtros y orden.
- Tarjetas con todos sus estados.
- **Coreografías 1, 2 y 3** (arranque, conexión, desconexión o expulsión).
- Estados vacío (**coreografía 15**) y cargando, barra lateral viva, toasts y expulsar disco.

**Aceptación:**
- paridad en los escenarios "Sin discos", "Cargando", "6 discos mixtos" y "smartctl no instalado";
- conectar y desconectar un disco real se anima igual que en el prototipo.

### Fase 6: Detalle — Resumen, Salud SMART, Identidad, Registros

**Tareas:**
- `domain/` (§6) con sus tests.
- Encabezado con transición de elemento compartido (**coreografía 4**) y pestañas (**coreografía 5**).
- **Resumen:** anillo, veredicto, frase, tiles, alertas y "Desde la última revisión".
- **Salud SMART:** tabla agrupada, banderas de advertencia crítica y tooltips (Apéndice E).
- **Identidad y capacidades.**
- **Registros:** errores y autopruebas, con el aviso de lectura parcial.
- Instantáneas automáticas.
- Actualizar datos (**coreografía 6**).

**Aceptación:**
- un test automático de consistencia comprueba que los valores coinciden con `smartctl -x` en todos los fixtures;
- el SSD de Apple muestra el aviso de lectura parcial sin romper la vista;
- la revisión de paridad está aprobada.

### Fase 7: Consola, herramientas smartctl y paleta ⌘K

**Tareas:**
- Cajón de consola global y pestaña Consola.
- Botones de las herramientas de smartctl.
- Vistas Vista, JSON y Texto (esta última desde `smartctl.output`).
- Historial de comandos con chips de salida.
- Modo experto con allowlist.
- Paleta ⌘K con acciones y discos.
- Atajos globales y menú nativo.

**Aceptación:**
- todo comando ejecutado es visible y copiable;
- el constructor no puede generar comandos fuera de la allowlist;
- la paleta no tiene animación y funciona 100 % con teclado, como indica el prototipo.

### Fase 8: Temperatura en vivo

**Tareas:**
- Monitor por Channel.
- Gráfico en vivo con bandas de umbral y ventanas de 5, 15 y 60 min.
- Sensores, estadísticas, pausa, intervalo y exportación a CSV.
- Historial térmico, umbrales estimados y alerta térmica (**coreografía 7**).

**Aceptación:**
- 60 min de monitoreo sin fugas de memoria ni caídas de FPS;
- se detiene al desconectar el disco o al salir de la pestaña.

### Fase 9: Pruebas

**Tareas:**
- Tarjetas de prueba con todos sus estados: bloqueada en macOS, deshabilitada en el disco interno y disponible.
- Helper `hdi-scan` con lanzamiento con privilegios, progreso, cancelación y heartbeat.
- Prueba en curso persistente entre pantallas (**coreografía 8**).
- Resultado (**coreografía 9**) con diff SMART, zonas ilegibles y gráficos.
- Mantener despierta la Mac, progreso en el Dock, notificación, desconexión a mitad de prueba e historial de pruebas.
- Autopruebas de smartctl detrás de la detección de capacidad, probadas con mocks.

**Aceptación:**
- el escaneo completo de un disco de pruebas termina con estadísticas correctas;
- cancelar responde en menos de 1 s;
- una desconexión a mitad de prueba produce el estado "Interrumpida" sin cuelgues;
- la Mac no entra en reposo durante la prueba.

### Fase 10: Reportes, historial y comparación

**Tareas:**
- Constructor con vista previa en vivo.
- `ReportDocument` fiel a `report-template.html`, en Carta y A4.
- Exportación a PDF, HTML y JSON.
- Lista de reportes.
- Historial con timeline y comparación de instantáneas.
- **Coreografía 14.**

**Aceptación:**
- el PDF pagina bien en Carta y A4, sin cortar tablas ni gráficos, y es fiel a la plantilla del prototipo;
- el JSON valida contra su esquema;
- el hash es reproducible.

### Fase 11: Ajustes, pulido, accesibilidad y empaquetado

**Tareas:**
- Ajustes completos, incluidos los umbrales avanzados y el TBW nominal por disco.
- Revisión del movimiento a 0.25× y perfilado con el Web Inspector.
- Accesibilidad: VoiceOver, teclado y contraste.
- Estados límite y manejo de errores.
- Ícono final del prototipo.
- `pnpm tauri build` → `.app` y `.dmg` para aarch64. Se compila en tu Mac, así que no lleva atributo de cuarentena ni necesita notarización para uso personal.
- README y guía de solución de problemas (gabinetes compatibles, permisos, smartctl).

**Aceptación:**
- el checklist de QA en hardware real (§12.4) está completo;
- apruebas la revisión final de paridad.

---

## 14. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| macOS no permite autopruebas NVMe ni SMART por USB | La expectativa de "testear" no se cumple con smartctl | Detección de capacidad, explicación honesta en la UI, escaneo de lectura propio y recomendación de gabinete (§8) |
| El prototipo llega incompleto o en otro formato | Retrabajo o improvisación visual | Checklist del prompt, Fase 1 con mapeo y lista de huecos resueltos antes de codificar |
| Diferencias entre WebKit y Chrome (blur, fuentes, rendimiento) | El prototipo se ve distinto en la app | El prompt exige paridad con Safari; E2E y paridad con WebKit; vibrancy nativa en lugar de blur CSS |
| Cambios del esquema JSON entre versiones de smartctl | Datos faltantes | Parser tolerante, JSON crudo preservado, fixtures por versión y aviso de versión en el entorno |
| Formato frágil de `diskutil activity` | No se detectan conexiones | Sondeo de respaldo cada 3 s; opción de DiskArbitration nativo (Fase 0) |
| Paginación del PDF | Reporte mal cortado | Spike en la Fase 0; `@page` más reglas de corte; respaldo con el diálogo de impresión |
| Helper con privilegios | Superficie de seguridad | Solo lectura, argumentos validados, sin shell, contraseña en cada ejecución, heartbeat |
| Pruebas largas y reposo o desconexión | Resultados corruptos | `caffeinate`, detección de desaparición, estado "Interrumpida" y resultados parciales guardados |
| smartctl ausente o fuera del `PATH` de la app | La app no funciona | Rutas absolutas conocidas, ajuste manual y onboarding con instrucciones |
| Animaciones con jank en WebKit | Mala experiencia | Solo `transform`/`opacity`, perfilado, gráficos sin re-render por punto, revisión a 0.25× |

---

## 15. Checklist de arranque

Lo que necesitas hacer tú:

- [ ] Generar el prototipo con `docs/DESIGN_PROMPT.md` y colocarlo en `prototype-design/`.
- [ ] Instalar Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (o `brew install rustup` y luego `rustup-init`).
- [ ] Tener a mano tus gabinetes y discos para la Fase 0 (idealmente uno Thunderbolt/USB4, uno USB 3.x y un disco "de pruebas" sin datos importantes).
- [ ] Confirmar el stack: Tauri 2 (recomendado) o plan B con Electron.
- [ ] Para empezar, pide: **"Inicia la Fase 0"** (se puede hacer ya) o **"Inicia la Fase 1"** (cuando el prototipo esté listo).

---

## Apéndice A. Métrica → JSON → transformación → regla

Rutas de smartctl 7.5; `∥` indica el respaldo y `HL` es `nvme_smart_health_information_log`.

| Métrica (UI) | Ruta JSON | Transformación y unidad | Uso |
|---|---|---|---|
| Modelo | `model_name` | — | Identidad, clave persistente |
| Número de serie | `serial_number` | Enmascarar (`S7DN••••••`) | Clave persistente |
| Firmware | `firmware_version` | — | Identidad |
| Proveedor PCI | `nvme_pci_vendor.id` | Hex + tabla del Apéndice D | Identidad |
| Versión NVMe | `nvme_version.string` | — | Identidad |
| Capacidad | `user_capacity.bytes` ∥ `nvme_total_capacity` ∥ diskutil `TotalSize` | TB decimales | Identidad |
| Bloque lógico | `logical_block_size` ∥ `nvme_namespaces[0].formatted_lba_size` | bytes | Identidad |
| Temperatura actual | `temperature.current` ∥ `HL.temperature` | °C (°F opcional) | Estado térmico |
| Sensores | `HL.temperature_sensors[]` | °C | Temperatura |
| Umbrales de advertencia y crítico | `nvme_composite_temperature_threshold.{warning,critical}` | °C; si faltan o valen 0 → 70/80 "estimados" | Estado térmico |
| Vida útil restante | `100 − endurance_used.current_percent` ∥ `100 − HL.percentage_used` | %, mínimo 0 | Anillo y veredicto |
| Repuesto disponible | `spare_available.current_percent` ∥ `HL.available_spare` | % | Veredicto |
| Umbral de repuesto | `spare_available.threshold_percent` ∥ `HL.available_spare_threshold` | % | Veredicto |
| Datos escritos / leídos | `HL.data_units_written` / `HL.data_units_read` | × 512,000 B → TB | Métricas, reporte |
| Comandos de lectura/escritura del host | `HL.host_reads` / `HL.host_writes` | conteo | Salud SMART |
| Tiempo ocupado del controlador | `HL.controller_busy_time` | minutos | Salud SMART |
| Ciclos de encendido | `power_cycle_count` ∥ `HL.power_cycles` | conteo | Métricas |
| Horas de encendido | `power_on_time.hours` ∥ `HL.power_on_hours` | h (+ días) | Métricas |
| Apagados inseguros | `HL.unsafe_shutdowns` | conteo | Nota |
| Errores de medios | `HL.media_errors` | conteo | Veredicto |
| Entradas del log de errores | `HL.num_err_log_entries` | conteo | Nota |
| Tiempo sobre advertencia / crítica | `HL.warning_temp_time` / `HL.critical_comp_time` | minutos | Nota térmica |
| Advertencia crítica | `HL.critical_warning` ∥ `smart_status.nvme.value` | bits (Apéndice C) | Veredicto |
| Estado SMART | `smart_status.passed` | booleano | Veredicto |
| Autoprueba soportada | `nvme_optional_admin_commands.self_test` + plataforma | booleano | Pruebas |
| Autoprueba en curso | `nvme_self_test_log.current_self_test_operation` / `current_self_test_completion_percent` | — | Progreso |
| Historial de autopruebas | `nvme_self_test_log.table[]` | — | Registros |
| Log de errores | `nvme_error_information_log.{size,read,unread,table[]}` | — | Registros |
| Metadatos | `smartctl.{version,exit_status,messages[],output[]}`, `local_time.time_t` | — | Consola, reporte |

Las rutas marcadas en la Fase 0 como no presentes en tus discos se ajustan aquí.

## Apéndice B. Bits del código de salida de smartctl

| Bit | Valor | Significado (`man smartctl`) | Chip en la UI | Severidad |
|---|---|---|---|---|
| 0 | 1 | No se pudo interpretar la línea de comandos | "Comando inválido" | Error (bug interno) |
| 1 | 2 | No se pudo abrir el dispositivo, no respondió a IDENTIFY o está en bajo consumo | "No se pudo abrir" | Error |
| 2 | 4 | Falló algún comando SMART u otro, o hay un checksum inválido | "Lectura parcial" | Aviso |
| 3 | 8 | El estado SMART devolvió "DISK FAILING" | "SMART: fallando" | Crítico |
| 4 | 16 | Hay atributos prefail ≤ umbral (ATA) | "Prefail bajo el umbral" | Crítico |
| 5 | 32 | Hubo atributos ≤ umbral en el pasado (ATA) | "Umbral superado antes" | Aviso |
| 6 | 64 | El log de errores del dispositivo tiene registros | "Log con errores" | Informativo |
| 7 | 128 | El log de autopruebas tiene errores | "Autoprueba con errores" | Aviso |

## Apéndice C. Bits de advertencia crítica de NVMe (`critical_warning`)

| Bit | Máscara | Significado | Veredicto |
|---|---|---|---|
| 0 | 0x01 | Repuesto disponible por debajo del umbral | Crítico |
| 1 | 0x02 | Temperatura fuera de umbral (por encima o por debajo) | Alerta térmica |
| 2 | 0x04 | Fiabilidad del subsistema NVM degradada (errores de medios o internos) | Crítico |
| 3 | 0x08 | Medios en modo solo lectura | Crítico |
| 4 | 0x10 | Falla del respaldo de memoria volátil | Crítico |
| 5 | 0x20 | Región de memoria persistente de solo lectura o no confiable | Crítico |

## Apéndice D. Proveedores PCI frecuentes (`nvme_pci_vendor.id`)

0x144D Samsung · 0x15B7 Western Digital/SanDisk · 0x1C5C SK hynix · 0x1E0F KIOXIA · 0x1344 Micron/Crucial · 0x2646 Kingston · 0x1987 Phison · 0x126F Silicon Motion · 0x1CC1 ADATA · 0x1D97 Longsys/Lexar · 0x1E4B MAXIO · 0x1BB1 Seagate · 0x025E Solidigm · 0x8086 Intel · 0x106B Apple.

Cuando el ID es de un fabricante de controladores (Phison, Silicon Motion, MAXIO), la UI lo muestra como "Controlador: …".

## Apéndice E. Glosario técnico para tooltips

La redacción final la da el prototipo; este glosario garantiza la exactitud.

- **Porcentaje usado:** estimación del fabricante del desgaste frente a la resistencia nominal. Llegar al 100 % significa que se alcanzó la vida nominal, no que el disco falle en ese momento; el valor puede superar 100.
- **Repuesto disponible:** porcentaje de bloques de reserva que quedan para sustituir celdas dañadas. Si baja del **umbral de repuesto**, el disco emite una advertencia crítica.
- **Datos escritos / leídos:** el disco los cuenta en "data units" de 512,000 bytes.
- **Errores de medios y de integridad de datos:** errores de integridad que el controlador detectó y no pudo recuperar.
- **Entradas del log de errores:** registros de errores de comandos en el controlador. Muchos son benignos, como las consultas del sistema a funciones no soportadas.
- **Apagados inseguros:** veces que se cortó la energía sin aviso previo, por ejemplo al desconectar sin expulsar.
- **Tiempo ocupado del controlador:** minutos en que el controlador tuvo comandos de E/S pendientes.
- **Tiempo sobre temperatura de advertencia o crítica:** minutos acumulados por encima de cada umbral.
- **Advertencia crítica:** banderas que el propio disco activa ante condiciones graves (Apéndice C).
- **Autoprueba (self-test):** diagnóstico interno del disco. En macOS no se puede iniciar para NVMe, aunque sí se puede leer su historial.


---

## Avance (25-sep-2026)

| Fase | Estado | Notas |
|---|---|---|
| 0 | 🟡 Parcial | Verificado con el SSD interno, la PDF y el helper sobre una imagen de disco. Faltan los gabinetes reales (`docs/CAPABILITY_MATRIX.md`). |
| 1 | ✅ | Mapeo en `docs/DESIGN_MAPPING.md`, desviaciones en `docs/DESIGN_DEVIATIONS.md` y paridad de 0.00–0.23 % en 16 pantallas × 2 temas. |
| 2 | ✅ | Tauri 2 + React 19 + Vite 8; ventana nativa (overlay, vibrancy *sidebar*); CSP; capacidades mínimas. |
| 3 | ✅ | smartctl con allowlist, descubrimiento, watcher de conexión en caliente, SQLite y cola por disco; 12 tests de Rust. |
| 4 | ✅ | Sistema de diseño traducido 1:1 (tokens, estilos en línea, pseudo-clases, movimiento). |
| 5–8 | ✅ | Entorno, Dispositivos, Detalle (7 pestañas), Consola real, temperatura en vivo. Validado con datos reales del SSD interno mediante capturas automáticas. |
| 9 | 🟡 | Helper `--hdi-scan` y orquestación listos (lectura sin caché, zonas ilegibles, cancelación, heartbeat, caffeinate). Falta la prueba de extremo a extremo con contraseña y un disco externo. |
| 10 | ✅ | Reporte PDF (Carta/A4, vectorial), HTML autocontenido y JSON `hdi-report/1` con SHA-256; historial, comparación y lista de reportes en SQLite. |
| 11 | 🟡 | `.app` release de 7.5 MB construido. Pendiente: firma y notarización (solo si se distribuye), `.dmg` y QA en hardware real. |

**Decisión de implementación:** como el prototipo ya era React por dentro (Design Component), se tradujo automáticamente (`scripts/dc2tsx.mjs`) y su lógica se portó tal cual. La app real sobreescribe solo los puntos de datos (`RealAppController`). Así la fidelidad visual y de movimiento es prácticamente exacta.

### Benchmark y cadena de conexión (25-sep-2026)
- `src-tauri/src/bench.rs`: comandos `bench_info`, `bench_run` y `bench_cancel`, con el evento `bench-event`. Usa fio (`brew install fio`) con 8 perfiles al estilo CrystalDiskMark, de 5 s cada uno más 1 s de calentamiento, sobre un archivo temporal que siempre se borra.
- `src/domain/speedpath.ts`: techo práctico de cada eslabón (puerto → gabinete → PCIe del SSD) y cuello de botella.
- `src/domain/bench.ts`: veredicto del benchmark frente al techo y a la velocidad nominal.
- UI: desviación #16.

### Reporte rápido (28-sep-2026)
- Plantilla de una hoja `src/report/QuickReport.tsx`. Se activa con `kind=quick` en el hash de `report.html`, así que el PDF sale del mismo pipeline sin cambios en el núcleo.
- `RealAppController.exportOne()` es compartido por el constructor y la acción directa `quickReport()`. La fuente del reporte incluye el último benchmark (`bench`).
- Autotest: `HDI_PDF_SELFTEST=… HDI_PDF_KIND=quick [HDI_PDF_DISK=diskN] [HDI_PDF_PAPER=a4]`.
- Corrección: un «Técnico» o «Cliente» vacío ya no imprime los valores de ejemplo del prototipo.
- UI: desviación #18.

### Expedientes (28-sep-2026)
- SQLite, migración #2: tablas `inventory` (ficha por serie) e `inventory_checks` (lectura completa, JSON crudo, extras y ruta del PDF).
- Comandos `inventory_*` en `src-tauri/src/inventory.rs`.
- Carpeta por serie en `~/Documents/HealthDiskInfo/Expedientes/<SERIE>/` (configurable), con el PDF rápido y el JSON de cada revisión.
- `src/domain/quickView.ts`: cálculo compartido entre el reporte rápido y la ficha. `src/domain/inventory.ts`: búsqueda, estados y diferencias entre revisiones.
- Modo lote: cada disco que se conecta abre la hoja prellenada. En desarrollo, `window.__hdiApp.batchOffer('diskN')` simula la conexión y `HDI_INVENTORY_DIR` cambia la raíz para pruebas.
- UI: desviación #19.

### Cambio de marca a NVitals Drive (28-sep-2026)
- `productName`, título de ventana, textos visibles, notificaciones, aviso de contraseña (`osascript`) y carpeta `~/Documents/NVitals Drive/` (reportes y `Expedientes/`).
- Íconos regenerados desde el SVG vectorial con margen de la plantilla de macOS; logo horizontal en ProReport y QuickReport (también embebido en la exportación HTML).
- Se conservan `com.healthdiskinfo.app` y el binario `healthdiskinfo` para no perder datos ni permisos.

### Reporte rápido de varios discos (30-sep-2026)
- Comando de solo lectura `inventory_latest(serials)` en `src-tauri/src/inventory.rs`: ficha y última revisión de cada expediente, sin el JSON crudo. Valida las series y tiene un tope de 1000.
- `src/domain/batchReport.ts`: filas ordenadas por gravedad, motivos breves (§6.2), resumen del grupo y paginación (`ROW_H`, `ROOM` y `ATT_*`, medidos en Carta y A4 en modo captura, con 10 px de margen).
- Plantilla `src/report/BatchReport.tsx` (`kind=batch` en el hash de `report.html`). El PDF sale del mismo pipeline (`export_pdf`, diálogo Guardar) y se registra en Reportes con `meta.kind = 'batch'`.
- UI: modo «Seleccionar» y panel en Expedientes (desviación #21).
- Autoprueba: `HDI_PDF_SELFTEST=… HDI_PDF_KIND=batch [HDI_PDF_PAPER=a4]` imprime el último lote guardado en la plantilla (o los discos de ejemplo).
- Solo en desarrollo: `HDI_DB_PATH` usa otra base de datos, para probar con expedientes sintéticos sin tocar la real.

