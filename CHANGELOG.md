# Changelog

Todos los cambios relevantes se documentan aquí. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

## [1.0.0] - 2026-10-15

Primera versión pública, para macOS 14 o posterior (binario universal: Apple Silicon e Intel).

### Agregado
- Dispositivos con conexión en caliente, salud SMART con veredicto, temperatura en vivo, cadena de conexión (PCIe, Thunderbolt/USB4, puente USB) y consola de smartctl con lista cerrada de operaciones.
- Escaneo de lectura de la superficie y benchmark con fio.
- Reportes (PDF, HTML, JSON), historial, comparación y expedientes con reportes de varios discos.
- Código abierto bajo `MIT OR Apache-2.0`: README en español e inglés, guía de contribución, código de conducta, política de seguridad y avisos de terceros.
- CI en GitHub Actions: TypeScript, tests, clippy, formato y licencias.
- `scripts/anonymize-fixture.mjs` para anonimizar salidas de smartctl y del sistema antes de agregarlas como fixtures.
- Flujo de release: `.dmg` universal, `SHA256SUMS` y atestación de procedencia en GitHub Releases.

### Seguridad
- lopdf 0.42 (RUSTSEC-2026-0187).

### Limitaciones conocidas
- La app no está firmada con un certificado de Apple: la primera vez hay que abrirla desde Ajustes del Sistema → Privacidad y seguridad.
- La interfaz está solo en español.

[Sin publicar]: https://github.com/chavahdez92/nvitals-drive/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/chavahdez92/nvitals-drive/releases/tag/v1.0.0
