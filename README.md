# NVitals Drive

<img src="branding/nvitals/Logo de nvitals.svg" alt="NVitals Drive" height="48">

**[English](README.en.md)** · Español

App de escritorio de código abierto para diagnosticar la salud de SSD NVMe. Lee los datos SMART con [smartmontools](https://github.com/smartmontools/smartmontools) (`smartctl`) y los traduce a un veredicto claro: vida útil, temperatura, errores, horas de uso y velocidad del enlace.

> **Estado:** funciona en **macOS** (Apple Silicon). El soporte para **Windows y Linux** está en desarrollo; el plan está en [`docs/OPEN_SOURCE_PLAN.md`](docs/OPEN_SOURCE_PLAN.md). Si tienes una PC con NVMe y quieres ayudar a probar, revisa [CONTRIBUTING.md](CONTRIBUTING.md).

## Qué hace

- **Dispositivos:** detecta los discos internos y externos, y los que conectas o desconectas en caliente.
- **Salud SMART:** veredicto, vida útil restante, repuesto disponible, errores de medios, apagados inseguros y advertencias críticas, con explicaciones en lenguaje claro.
- **Temperatura en vivo** con gráfica y exportación a CSV.
- **Cadena de conexión:** enlace PCIe, Thunderbolt o USB4 y puente USB, para saber si el gabinete limita la velocidad.
- **Pruebas:** escaneo de lectura de la superficie (solo lectura) y benchmark de lectura y escritura con [fio](https://github.com/axboe/fio).
- **Reportes** en PDF, HTML y JSON, con historial y comparación entre revisiones.
- **Expedientes:** registro por número de serie para talleres y laboratorios, con reportes de varios discos.
- **Consola** de smartctl con una lista cerrada de operaciones de solo lectura.

## Soporte por plataforma

| | macOS | Windows | Linux |
|---|---|---|---|
| Estado | ✅ Estable (macOS 14+, Apple Silicon e Intel) | 🚧 En desarrollo | 🚧 En desarrollo |
| SMART de NVMe interno | ✅ Sin privilegios | Previsto sin administrador | Previsto con una autorización por sesión |
| SMART por gabinete USB | ❌ macOS no lo permite | Previsto | Previsto |
| Gabinetes Thunderbolt / USB4 | ✅ | Previsto | Previsto |

Los detalles por plataforma y tipo de gabinete están en [`docs/CAPABILITY_MATRIX.md`](docs/CAPABILITY_MATRIX.md).

## Instalación (macOS)

Requisitos: macOS 14 o posterior, en Apple Silicon o Intel.

1. Instala smartmontools: `brew install smartmontools` (opcional para el benchmark: `brew install fio`).
2. Descarga el `.dmg` de la [página de Releases](https://github.com/chavahdez92/nvitals-drive/releases), ábrelo y arrastra la app a Aplicaciones. También puedes compilarla desde el código (abajo).
3. **Primera apertura:** la app todavía no está firmada con un certificado de Apple, así que macOS la bloquea la primera vez. Ve a **Ajustes del Sistema → Privacidad y seguridad** y pulsa **Abrir de todos modos**. Otra opción, desde la Terminal:
   ```bash
   xattr -dr com.apple.quarantine "/Applications/NVitals Drive.app"
   ```
4. Opcional: verifica la descarga con `shasum -a 256 -c SHA256SUMS` (el archivo está en el mismo release).

## Privacidad y seguridad

- **Todo es local.** La app no tiene telemetría, no crea cuentas y no se conecta a internet.
- **Solo lectura.** Nunca escribe en los discos que analiza: no hay formateo, firmware, `--set` ni operaciones que modifiquen el disco. La única excepción es el benchmark, que escribe un archivo temporal (`.hdi-bench.tmp`) en un volumen que tú eliges y lo borra siempre.
- **Sin shell.** smartctl se ejecuta con argumentos en vector, sobre una lista cerrada de operaciones y con identificadores de disco validados.
- El escaneo de superficie necesita privilegios de administrador y los pide en cada ejecución.

Para reportar una vulnerabilidad, sigue [SECURITY.md](SECURITY.md).

> **Aviso:** NVitals Drive es una herramienta de diagnóstico. Ayuda a detectar problemas, pero no garantiza la integridad de tus datos. Mantén siempre respaldos. El software se entrega «tal cual», sin garantías (ver las licencias).

## Compilar desde el código

Requisitos: Node 22.12+ con pnpm (`corepack enable`), Rust estable ([rustup](https://rustup.rs)) y smartmontools.

```bash
pnpm install
pnpm dev          # app nativa con datos reales (Tauri + Vite)
pnpm dev:web      # prototipo con datos simulados en el navegador (http://localhost:1420, ⇧D = escenarios)
pnpm build        # genera src-tauri/target/release/bundle/macos/NVitals Drive.app
```

### Calidad

```bash
pnpm check        # TypeScript + tests del dominio (vitest) + tests del núcleo (cargo test)
pnpm lint:rust    # clippy sin advertencias
pnpm parity       # paridad visual contra el prototipo (requiere pnpm dev:web y el servidor del prototipo)
```

Para el servidor del prototipo: `pnpm exec vite -c scripts/vite.prototype.config.mjs` (puerto 4174).

### Autopruebas del binario nativo

- `HDI_PDF_SELFTEST=/tmp/r.pdf [HDI_PDF_PAPER=a4] [HDI_PDF_KIND=quick|batch] ./healthdiskinfo`: exporta un reporte de ejemplo a PDF y termina.
- `HDI_DB_PATH=/tmp/t.db` (solo en desarrollo): usa otra base de datos para no tocar tus expedientes.
- `HDI_UI_SNAPSHOT_DIR=/tmp/ui HDI_UI_ROUTES="#/devices,#/device/disk0/overview" ./healthdiskinfo` (solo en desarrollo): recorre las rutas y guarda capturas PNG.

## Arquitectura

- **Interfaz:** `src/ui/screens/*`, traducidas del prototipo de diseño (`prototype-design/`, la fuente de verdad de la UI).
- **Controladores:** `src/ui/AppController.tsx` (modo simulado) y `src/ui/RealAppController.tsx` (datos reales).
- **Dominio** (`src/domain`): normalización de smartctl, veredicto y formatos, con tests y fixtures reales anonimizados.
- **Núcleo Rust** (`src-tauri/src`): smartctl (allowlist, sin shell), descubrimiento de discos, conexión en caliente, SQLite, PDF, escaneo de solo lectura y benchmark.
- **Reportes:** `src/report/*`.

Documentos: [plan de implementación](docs/IMPLEMENTATION_PLAN.md), [plan multiplataforma y de código abierto](docs/OPEN_SOURCE_PLAN.md), [mapeo del diseño](docs/DESIGN_MAPPING.md) y [desviaciones del diseño](docs/DESIGN_DEVIATIONS.md).

## Contribuir

Las contribuciones son bienvenidas: errores, reportes de hardware, traducciones y código. Lee [CONTRIBUTING.md](CONTRIBUTING.md) y el [código de conducta](CODE_OF_CONDUCT.md).

## Licencia

El código se distribuye bajo **MIT o Apache-2.0**, a tu elección ([LICENSE-MIT](LICENSE-MIT), [LICENSE-APACHE](LICENSE-APACHE)). Las dependencias están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

smartmontools y fio son programas externos con licencia GPL-2.0. La app los ejecuta como procesos aparte y no los incluye.

El nombre «NVitals Drive» y su logo tienen reglas de uso propias: ver [TRADEMARK.md](TRADEMARK.md).

Antes se llamaba **HealthDiskInfo**. Por compatibilidad se conservan el identificador `com.healthdiskinfo.app` (base de datos, ajustes y permisos) y el nombre interno del binario (`healthdiskinfo`).
