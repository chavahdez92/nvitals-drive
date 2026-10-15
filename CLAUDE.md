# NVitals Drive (antes HealthDiskInfo)

App de escritorio para macOS (Apple Silicon) que diagnostica la salud de SSD NVMe usando `smartctl` por detrás. Stack: Tauri 2 (Rust) + React + TypeScript. Interfaz en español (es-MX).

## Marca
- Nombre visible: **NVitals Drive**. Ícono: `branding/nvitals/Icono de nvitals para app de discos.svg` (copiado a `public/assets/app-icon.svg` y `src/design-system/app-icon.svg`). Logo horizontal: `Logo de nvitals.svg` (en `public/assets/nvitals-logo.svg`, usado en los reportes).
- Íconos de la app: `branding/nvitals/generated/app-icon-1024.png` (plantilla de macOS: cuerpo de 824 px en un lienzo de 1024) → `pnpm tauri icon <png>` → `src-tauri/icons/`. Se borran las carpetas `android/` e `ios/` que genera.
- No se cambian el identificador `com.healthdiskinfo.app` (datos, ajustes y permiso TCC), el crate `healthdiskinfo` ni las claves `hdi-*`. `prototype-design/` conserva el nombre original (solo lectura).

## Documentos clave
- `docs/IMPLEMENTATION_PLAN.md`: plan por fases. Síguelo y respeta el orden y los criterios de aceptación.
- `docs/DESIGN_PROMPT.md`: prompt con el que se generó el prototipo.
- `prototype-design/`: **prototipo de diseño, fuente de verdad única de la UI.**

## Regla de oro del diseño
- Toda UI se basa **enteramente** en `prototype-design/`: layout, tokens, componentes, estados, copy, animaciones y atajos. Antes de implementar o modificar una pantalla, abre su equivalente en el prototipo y replícala.
- `prototype-design/` es de **solo lectura**. Nunca lo edites.
- No inventes estilos, componentes ni animaciones que el prototipo ya define.
- Si algo falta o hay que desviarse, regístralo en `docs/DESIGN_DEVIATIONS.md` y confírmalo con el usuario si es visible.
- La exactitud técnica (valores, unidades, reglas del veredicto) la manda el plan, secciones 6 y apéndices.
- No se construye UI antes de completar la Fase 1 (ingesta del prototipo).

## Arquitectura (implementada)
- `src/ui/screens/*.tsx`: pantallas traducidas del prototipo con `scripts/dc2tsx.mjs`. Ya son código fuente: se editan a mano y el conversor sin `--force` solo escribe en `.dc2tsx-out/` para comparar.
- `src/ui/AppController.tsx`: lógica del prototipo (view-model `renderVals`), usada en el modo mock (`pnpm dev:web`). **No cambies su comportamiento en modo mock:** es la referencia de paridad (`pnpm parity`).
- `src/ui/RealAppController.tsx`: sobreescribe los ganchos de datos con el núcleo real (`src/services/backend.ts`).
- `src/domain/`: normalización de smartctl, veredicto, formatos, `quickView` (reporte rápido y expedientes), `inventory` y `batchReport` (reporte rápido de varios discos), con vitest y fixtures en `fixtures/`.
- Expedientes: `src-tauri/src/inventory.rs` (SQLite, migración #2, y carpeta por serie) + `src/ui/screens/InventoryScreen.tsx`; su lógica vive en `RealAppController` (solo modo real).
- Reporte de varios discos: modo «Seleccionar» de Expedientes → `inventory_latest` (solo lectura) → plantilla `src/report/BatchReport.tsx` (`kind=batch`). Sale en el orden de la tabla de seleccionados (`sortInventory` en `src/domain/inventory.ts`, `order: 'given'`); el predeterminado es por gravedad.
- `src-tauri/src/`: `smartctl`, `devices`, `watcher`, `store`, `pdf`, `scan`, `scan_helper` (el binario actúa como helper con `--hdi-scan`) y `uitest` (capturas, solo en desarrollo).
- Verificación: `pnpm typecheck && pnpm test && pnpm test:rust && pnpm parity`.

## Hechos técnicos verificados (macOS 27, smartctl 7.5)
- smartctl está en `/opt/homebrew/bin/smartctl`. Las apps abiertas desde Finder no heredan el `PATH`, así que usa rutas absolutas.
- La lectura SMART de NVMe funciona **sin sudo**. `--json=o` devuelve JSON y además el texto clásico en `smartctl.output[]`.
- `--scan-open` devuelve rutas IOService. Para ejecutar, usa el `diskN` de `diskutil`; smartctl lo acepta.
- En macOS, NVMe solo admite Identify y Get Log Page. **No hay autopruebas (`-t`) ni `-X`.**
- Los puentes USB (JMicron, Realtek, ASMedia) **no entregan SMART en macOS**. Solo los gabinetes Thunderbolt o USB4 lo hacen.
- `exit_status = 4` puede venir con datos válidos (lectura parcial). Parsea siempre el JSON.

## Seguridad (no negociable)
- Nunca uses shell. Ejecuta con argumentos en vector y operaciones de una allowlist cerrada, sobre identificadores `^disk[0-9]+$` validados contra el registro.
- Nada de operaciones que escriban o modifiquen discos: ni `--set`, ni `-s`, `-S`, `-o`, formateo o firmware.
- El helper `hdi-scan` es de solo lectura y solo corre con privilegios tras la contraseña del usuario.
- Expedientes (`src-tauri/src/inventory.rs`): solo escriben archivos (PDF, JSON y HTML) dentro de la carpeta de expedientes. El serial se valida con `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`, los nombres de archivo con una lista cerrada de caracteres, y la ruta final siempre se arma en el núcleo (`<raíz>/<serie>/<archivo>`).
- Única excepción de escritura en discos analizados (pedida por el usuario): el benchmark (`src-tauri/src/bench.rs`) ejecuta `fio` sin privilegios sobre un archivo temporal `.hdi-bench.tmp` en un volumen montado que sale de `diskutil` (nunca rutas arbitrarias ni `/dev/*`), exige espacio libre y borra el archivo siempre.
