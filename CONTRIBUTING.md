# Cómo contribuir

¡Gracias por tu interés en NVitals Drive! Puedes escribir en español o en inglés.

## Formas de ayudar

- **Reportar errores:** abre un issue con la plantilla «Error». Incluye tu sistema operativo, la versión de la app y la salida de `smartctl --version`.
- **Reportar hardware:** la plantilla «Reporte de hardware» registra qué funciona con cada disco, gabinete y puente USB. Es especialmente útil para Windows y Linux mientras avanza el port.
- **Código y documentación:** revisa los issues con las etiquetas `good first issue` o `platform:*`, y los milestones de [`docs/OPEN_SOURCE_PLAN.md`](docs/OPEN_SOURCE_PLAN.md).

Para cambios grandes, abre primero un issue o una discusión para acordar el enfoque.

## Entorno de desarrollo

Requisitos:
- Node 22.12+ y pnpm (`corepack enable` toma la versión de `packageManager` en `package.json`).
- Rust estable con rustup. `rust-toolchain.toml` instala rustfmt y clippy.
- smartmontools (`brew install smartmontools` en macOS). fio es opcional (benchmark).
- Dependencias de Tauri de tu sistema: <https://v2.tauri.app/start/prerequisites/>.

```bash
pnpm install
pnpm dev:web      # interfaz con datos simulados en el navegador
pnpm dev          # app nativa con datos reales
```

## Antes de abrir un pull request

```bash
pnpm check        # typecheck + vitest + cargo test
pnpm lint:rust    # clippy sin advertencias
pnpm fmt:rust     # formato de Rust
pnpm notices      # si cambiaste dependencias: regenera THIRD_PARTY_NOTICES.md
```

Si tocaste la interfaz, corre también `pnpm parity` (necesita `pnpm dev:web` y el servidor del prototipo, ver el README).

## Reglas del proyecto

### Diseño
- `prototype-design/` es la **fuente de verdad** de la interfaz y es de **solo lectura**. Antes de cambiar una pantalla, revisa su equivalente en el prototipo.
- No inventes estilos, componentes ni animaciones que el prototipo ya define.
- Toda desviación visible se registra en [`docs/DESIGN_DEVIATIONS.md`](docs/DESIGN_DEVIATIONS.md) y se discute en el pull request.
- El modo simulado (`pnpm dev:web`, `src/ui/AppController.tsx`) es la referencia de paridad: no cambies su comportamiento.

### Seguridad
- Nunca se usa shell. Los procesos se ejecutan con argumentos en vector y operaciones de una lista cerrada, sobre identificadores de disco validados.
- Nada que escriba o modifique discos: ni `--set`, `-s`, `-S`, `-o`, formateo ni firmware.
- Los cambios en los procesos con privilegios (escaneo) o en la allowlist de smartctl requieren tests y una revisión cuidadosa.

### Datos personales en fixtures
Las salidas de smartctl, `system_profiler`, `lsblk` o WMI contienen números de serie y UUID. Antes de agregarlas a `fixtures/`, anonimízalas:

```bash
pnpm anonymize fixtures/ruta/archivo.json            # muestra los reemplazos
pnpm anonymize fixtures/ruta/archivo.json --write    # los aplica
```

### Estilo
- Interfaz y mensajes de error en español (es-MX).
- Rust: `cargo fmt` con `src-tauri/rustfmt.toml` y clippy sin advertencias.
- TypeScript: sigue el estilo del archivo que editas.
- Commits pequeños con mensajes descriptivos.

## Firma de commits (DCO)

Al contribuir certificas que tienes derecho a enviar tu código bajo la licencia del proyecto ([Developer Certificate of Origin](https://developercertificate.org/)). Agrega la línea `Signed-off-by` a tus commits:

```bash
git commit -s -m "Describe el cambio"
```

## Licencia de las contribuciones

Salvo que indiques lo contrario, toda contribución que envíes se licencia como el proyecto: MIT o Apache-2.0, a elección de quien la use, sin términos adicionales.
