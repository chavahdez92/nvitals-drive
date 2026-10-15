# Matriz de capacidades (Fase 0)

Qué funciona con cada tipo de disco y gabinete. Verificado el 25-sep-2026 en macOS 27.0 con smartctl 7.5.

| Caso | SMART | Autopruebas `-t` | Escaneo de lectura | Estado de la verificación |
|---|---|---|---|---|
| SSD interno Apple (disk0) | ✅ completo, salvo el log de errores (`GetLogPage failed`, exit 4) | ❌ `self_test: false` | ❌ deshabilitado por diseño | ✅ verificado con hardware real |
| NVMe en gabinete Thunderbolt / USB4 | ✅ esperado (NVMe nativo por túnel PCIe) | ❌ macOS solo permite Identify y Get Log Page | ✅ | ⏳ pendiente con tus gabinetes |
| NVMe en gabinete USB 3.x (JMicron, Realtek, ASMedia) | ❌ macOS no pasa comandos SCSI/SAT por USB | ❌ | ✅ (lectura del dispositivo en bruto) | ⏳ pendiente |
| Disco SATA | Parcial: el modelo de la UI está centrado en NVMe | Solo si el dispositivo expone la interfaz SMART de Apple | ✅ | ⏳ pendiente |

## Verificado en esta Mac

- `smartctl -x --json=o disk0` sin sudo. JSON + texto clásico en una sola ejecución.
- `diskutil list -plist physical` y `diskutil info -plist`. Nota: `OSInternalMedia` vale `false` incluso para disk0, así que el disco de arranque se detecta con `Internal`.
- `diskutil activity`: el formato `***DiskAppeared ('diskN', …)` se confirmó, junto con el marcador `***DAIdle` tras la enumeración inicial. Las imágenes de disco y los contenedores APFS también generan eventos, por eso el watcher compara contra la lista de discos físicos.
- **Helper de escaneo** (`healthdiskinfo --hdi-scan`) sobre una imagen de disco de 256 MB conectada sin montar: probados los modos completo y rápido, la cancelación y el heartbeat vencido.
- **Exportación PDF**: Carta y A4, 4 hojas a tamaño físico y texto vectorial, tanto en el binario de desarrollo como en el de release.

## Pendiente (necesita tu hardware)

1. Conecta cada gabinete (Thunderbolt/USB4 y USB 3.x) con la app abierta y comprueba la animación de conexión y desconexión.
2. Confirma las claves reales de `system_profiler` para el enlace PCIe (`spnvme_link*`) y el puente USB (`vendor_id`/`product_id`). El normalizador las busca de forma tolerante; guarda las salidas en `fixtures/` y agrégalas a los tests.
3. Haz un escaneo real de un disco de pruebas: diálogo de contraseña, progreso, cancelación y desconexión a mitad de la prueba.
4. En un disco NVMe externo, intenta `smartctl -t short diskN`. Se espera el error `NVMe admin command 0x14 is not supported`.

## Hallazgos con hardware real (25-sep-2026)

- **KINGSTON SNV2S1000G en gabinete Thunderbolt (disk6):** SMART completo sin sudo, con enlace PCIe Gen4 ×4 · 16 GT/s detectado.
- **Escaneo de lectura:** el helper, incluso como root, recibía `EPERM` al abrir `/dev/rdisk6`. La causa es la protección de privacidad de macOS (TCC): el acceso a discos en bruto requiere que la **app principal** tenga permiso de «Volúmenes extraíbles» o «Acceso total al disco», y el helper lo hereda. Fuente: foros de desarrolladores de Apple, hilo 802650.
  - Solución: la app abre el dispositivo antes de lanzar el helper para que macOS muestre su diálogo. Si ya se denegó, un diálogo explica cómo activarlo y abre Ajustes.
  - En desarrollo (`pnpm dev`), el permiso lo necesita la **Terminal** que ejecuta la app.
- **Touch ID:** el diálogo de `osascript … with administrator privileges` no ofrece huella. Si Touch ID está habilitado para `sudo` (`pam_tid.so` en `/etc/pam.d/sudo_local`), el helper se lanza con `sudo` y macOS pide la huella. Si falla, se usa el diálogo de contraseña.
- **Detección USB4:** `system_profiler` reporta `mode_key: "usb_four"` (no "usb4"), el chip por `vendor_id_key`/`device_id_key` (`0x174C`/`0x2463` = ASMedia ASM2464PD) y la velocidad negociada en `receptacle_upstream_ambiguous_tag.current_speed_key` ("40 Gb/s"). Los puertos libres de la Mac muestran su capacidad ("Up to 120 Gb/s", Thunderbolt 5). Fixture: `fixtures/system_profiler/usb4-asm2464-kingston.json`.
- **Benchmark (fio 3.43, `--ioengine=posixaio --direct=1`):** funciona sin sudo sobre un volumen APFS del disco externo; `direct=1` activa `F_NOCACHE`. Kingston SNV2S1000G por USB4: SEQ1M Q8T1 3,526 MB/s lectura / 1,630 MB/s escritura (93 % del techo práctico de ~3,800 MB/s del ASM2464PD); RND4K Q32T1 ~85 k IOPS lectura.
- **fio y memoria compartida:** cada proceso de fio reserva un segmento System V de ~1.5 MB, y macOS permite solo 4 MB en total (`kern.sysv.shmmax`/`shmall`). Si fio muere con `SIGKILL`, el segmento queda huérfano y, con dos huérfanos, fio falla con `failed to setup shm segment`. Por eso la app detiene fio con `SIGTERM` (y `SIGKILL` solo tras 3 s), registra los PID que lanza en `~/Library/Caches/com.healthdiskinfo.app/fio-pids` y, antes de cada benchmark, libera los segmentos sin procesos conectados cuyo creador sea uno de esos PID y ya no exista.
