# Changelog

Todos los cambios relevantes se documentan aquí. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

Primera versión pública (1.0.0), para macOS con Apple Silicon.

### Agregado
- Dispositivos con conexión en caliente, salud SMART con veredicto, temperatura en vivo, cadena de conexión (PCIe, Thunderbolt/USB4, puente USB) y consola de smartctl con lista cerrada de operaciones.
- Escaneo de lectura de la superficie y benchmark con fio.
- Reportes (PDF, HTML, JSON), historial, comparación y expedientes con reportes de varios discos.
- Código abierto bajo `MIT OR Apache-2.0`: README en español e inglés, guía de contribución, código de conducta, política de seguridad y avisos de terceros.
- CI en GitHub Actions: TypeScript, tests, clippy, formato y licencias.
- `scripts/anonymize-fixture.mjs` para anonimizar salidas de smartctl y del sistema antes de agregarlas como fixtures.

[Sin publicar]: https://github.com/chavahdez92/nvitals-drive/commits/main
