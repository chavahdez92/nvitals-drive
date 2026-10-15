# HealthDiskInfo — Especificación

Prototipo navegable: `HealthDiskInfo.dc.html` (equivale a `index.html`). Sistema de diseño: `Design System.dc.html` (equivale a `design-system.html`). Plantilla del reporte: `Report Template.dc.html` (equivale a `report-template.html`; parámetros por hash: `#disk=disk4&paper=letter|a4&s=summary,identity,smart,temp,tests,logs,appendix&tech=…&client=…&notes=…&mask=1`). Tokens: `css/tokens.css` (fuente de verdad) y `tokens.json` (DTCG, generado desde el CSS). Datos: `js/mock-data.js`. Movimiento: `js/motion.js`. Íconos: `assets/icons.svg` (sprite) y `js/icons.js` (mismo sprite, inyectado inline para que funcione con `file://` y en WebKit).

> Nota de entorno: el prototipo se entrega como Design Component (un archivo HTML autocontenido con estilos en línea que referencian **solo** variables de `tokens.css`). Cada raíz de componente lleva `data-component`, `data-variant`, `data-state` y un comentario `<!-- @component … -->`, que es el contrato para traducirlo a React + TypeScript.

## 1. Mapa de pantallas y rutas

| Ruta | Pantalla | Estado |
|---|---|---|
| `#/onboarding` | Verificación del entorno (ok · smartctl no instalado · versión antigua) | ✓ |
| `#/devices` | Dispositivos: tarjetas / lista, filtros, orden, vacío, cargando | ✓ |
| `#/device/:id/overview` | Resumen | ✓ |
| `#/device/:id/smart` | Salud SMART | ✓ |
| `#/device/:id/temperature` | Temperatura en vivo | ✓ |
| `#/device/:id/tests` | Pruebas (tarjetas, hoja de confirmación, contraseña, en curso, resultado, historial) | ✓ |
| `#/device/:id/logs` | Registros (errores, autopruebas, lectura parcial) | ✓ |
| `#/device/:id/identity` | Identidad y capacidades | ✓ |
| `#/device/:id/console` | Consola (herramientas, modo experto, Vista/JSON/Texto, historial) | ✓ |
| `#/reports` | Lista de reportes (abrir, mostrar en Finder, eliminar) y estado vacío | ✓ |
| `#/reports/new` | Constructor: opciones + vista previa en vivo (iframe de la plantilla), Carta/A4, PDF/HTML/JSON; estados generando · guardado · error | ✓ |
| `#/history` | Discos vistos (incl. desconectados), tendencia, 4 gráficos por disco, instantáneas A/B | ✓ |
| `#/history/compare` | Comparación lado a lado con deltas ↑/↓ semánticos | ✓ |
| `#/settings` | General, smartctl, Monitoreo, Reportes, Pruebas, Umbrales avanzados, Datos, Acerca de | ✓ |

## 2. Atajos

⌘K paleta · ⌘R re-escanear/actualizar · ⌘E generar reporte · ⌘1…⌘7 pestañas (cambio instantáneo) · ⌘J consola · ⌘, ajustes · Esc cerrar (paleta → diálogo → popover → panel → volver) · ↑/↓/←/→ navegar discos · Enter abrir · ⇧D panel de escenarios (solo prototipo). Clic derecho en tarjetas e ítems de la barra lateral: menú contextual.

## 3. Inventario de componentes (implementados)

| Componente | Variantes | Estados | Dónde |
|---|---|---|---|
| Window / Sidebar / Toolbar | — | default, scrolled | shell |
| SidebarDeviceItem | — | default, selected, testing, disconnected | barra lateral |
| DeviceCard | grid, list | identifying, optimal, good, warning, critical, nodata, disconnected, selected | Dispositivos |
| LifeRing | S (14), H (40), M (64), L (176) | 5 veredictos + nodata (punteado) | tarjeta, encabezado, héroe |
| HealthBadge | sm, md, lg | optimal, good, warning, critical, nodata (ícono + texto siempre) | todas |
| ConnectionBadge | thunderbolt, usb4, usb, internal | — | tarjeta, encabezado |
| SegmentedControl | text, icon | default, selected | filtros, vistas, ventanas, intervalos |
| Tabs | underline | default, active, focus; indicador con spring | detalle |
| StatTile | default, meter, sparkline | ok, note, warning, critical | Resumen |
| Meter | life, spare (con marca de umbral) | ok, warning, critical | StatTile |
| Table | grouped | default, raw | SMART, Registros, Identidad |
| Switch | — | off, on, focus | SMART, escenarios |
| Chip | filter, flag | on, off (punteado) | Capacidades, modo experto |
| KeyValue | — | default, masked, copied | Identidad |
| LiveLineChart | temperature | live, paused | Temperatura |
| SpeedChart | position (LBA) | live, final | Pruebas |
| Progress | bar | determinate | Pruebas, tarjeta |
| TestCard | — | available, locked, disabled | Pruebas |
| TestRun | — | running, passed, errors, cancelled, interrupted | Pruebas |
| JsonViewer | — | expanded, collapsed, search | Consola |
| CommandBlock | — | default, copied | onboarding, consola |
| ConsoleItem / ConsoleDrawer | — | open, resizing | Consola, cajón ⌘J |
| Checklist | stepper | pending, active, done, warning, error | onboarding |
| EmptyState | devices, nosmart | listening | Dispositivos, pestañas sin SMART |
| Skeleton | card | shimmer | identificando / cargando |
| Banner | info, warning | — | detalle, registros |
| Popover / Menu / ContextMenu | — | open | “¿Cómo se determina?”, “…”, clic derecho |
| Dialog / Sheet | confirm, auth, warning, destructive | — | pruebas |
| Toast | — | default, paused (hover), swiping | global |
| Tooltip | — | delayed (500 ms), instant (recorrido) | global (`data-tip`) |
| CommandPalette / PaletteItem | — | open, empty; selected | ⌘K |
| ReportBuilder / SheetPreviewFrame | — | idle, generating, done, error; rising | Reportes |
| Select / TextField / Textarea / Checkbox / Stepper | — | default, focus, error, disabled | Constructor, Ajustes |
| SettingsGroup | — | — | Ajustes |
| ReportDocument (plantilla) | letter, a4 | 5 veredictos (ícono + texto, apto B/N) | `Report Template.dc.html` |

## 4. Tokens (resumen)

- **Neutrales**: `--gray-1…12` (grafito frío, h 255). Superficies `--surface-*`, texto `--text-primary/secondary/tertiary/disabled`, bordes `--border-subtle/default/strong`.
- **Acento “señal”**: `--accent` cian (oscuro `oklch(0.80 0.12 215)`, claro `oklch(0.54 0.12 228)`), `--accent-soft/-border/-fg/-hover/-pressed`, `--text-on-accent`.
- **Salud** (5 × 4): `--health-{optimal|good|warning|critical|nodata}-{fg|bg|border|solid}`. Óptimo verde 152, Bueno lima 122–128, Atención ámbar 62–78, Crítico rojo 25, Sin datos neutral.
- **Datos**: `--data-temp`, `--data-temp-2`, `--data-read`, `--data-write`, `--data-speed`, `--data-fill`, `--data-warn`, `--data-crit`, bandas `--band-warn`, `--band-crit`, `--chart-grid`, `--ring-track`.
- **Tipografía**: display 34/40 700 −0.022em · title1 24/30 650 −0.016em · title2 18/24 650 −0.010em · title3 15/20 600 −0.005em · body 13/18 400 · callout 12/16 · nota 11/14 · caption 10/13 600 +0.04em (mayúsculas) · mono 12/18 · metric 22/26 600 −0.018em. Todo en `tabular-nums`.
- **Espaciado** 4 px (`--sp-*`), **radios** `--r-xs…2xl`, `--r-window: 18px`, **elevación** `--shadow-1…3`, `--shadow-window`.
- **Materiales**: `--mat-window-*`, `--mat-toolbar-*`, `--mat-popover-*`, `--mat-sheet-*`; sólidos con `[data-transparency=reduced]` o `prefers-reduced-transparency`.
- **Capas**: base 0 · sticky 10 · sidebar 20 · drawer 30 · popover 40 · dialog 50 · toast 60 · palette 70 · scenario 80 · tooltip 90.
- **Movimiento**: `--dur-press 120` · `--dur-fast 160` · `--dur-base 220` · `--dur-moderate 320` · `--dur-data 900` · salidas `--dur-exit-* ≈ 70 %` · `--ease-out (0.23,1,0.32,1)` · `--ease-in-out (0.77,0,0.175,1)` · `--ease-drawer (0.32,0.72,0,1)` · spring layout `bounce 0, 0.38 s` (JS → `linear()`), spring tras gesto `bounce 0.15`. Todas las duraciones × `--motion-k` (1×, 0.5× → k=2, 0.25× → k=4).

## 5. Catálogo de animaciones

| # | Coreografía | Disparador | Propiedades | Duración / curva | Reduced motion |
|---|---|---|---|---|---|
| 1 | Arranque | fin del onboarding | tarjetas: opacity + translateY 8 px, stagger 40 ms (máx. 6); anillos 0→valor con contador sincronizado (rAF) | 320 ms ease-out; anillos 900 ms ease-out-quart; solo la primera vez | fundido 150 ms; anillos en valor final |
| 2 | Disco conectado | hot-plug | toast; tarjeta materializa (opacity, scale .96→1, blur 8→0); resto FLIP con spring; identificando → crossfade | 320 ms ease-out; FLIP spring 380 ms | fundido |
| 3 | Disco desconectado / expulsado | hot-plug / menú | grayscale + opacity .55 durante 1.2 s; salida opacity + scale .98; FLIP; banner en el detalle | 155 ms salida | fundido |
| 4 | Abrir disco | clic / Enter | elemento compartido: anillo de la tarjeta → anillo del encabezado (translate + scale); resto crossfade; volver hace el camino inverso | spring bounce 0, 400 ms | sin transform |
| 5 | Pestañas | clic | indicador translateX + scaleX con spring; contenido crossfade + 8 px en dirección del orden | 220 ms / spring 380 ms; con ⌘1…7 instantáneo | fundido |
| 6 | Actualizar | ⌘R / botón | ícono gira 360° una vez; valores con `data-flash` resaltan fondo y se desvanecen | 520 ms ease-out; flash 600 ms | sin giro; flash se mantiene (color) |
| 7 | Temperatura en vivo | cada intervalo | trazo desplazado con translateX lineal durante el intervalo; segmentos coloreados por banda (clipPath); pulso único del badge al cruzar umbral | intervalo (1/2/5 s) lineal; pulso 520 ms | sin desplazamiento ni pulso |
| 8 | Prueba en curso | inicio | barra scaleX lineal; números tabulares; latido del punto de actividad; mini anillo en la barra lateral y barra en la tarjeta | 250 ms lineal por tick; latido 1.4 s | sin latido |
| 9 | Prueba completada | fin | ícono de resultado pop + pulso único; toast; Notification del sistema si hay permiso | 220 ms + 520 ms | fundido |
| 10 | Consola | ⌘J | cajón translateY 100 %→0; arrastre para redimensionar; líneas nuevas fade | 320 ms ease-drawer; salida 225 ms; líneas 120 ms | fundido |
| 11 | Toasts | eventos | entrada translateX 24 px + scale .98; pila; hover pausa; deslizar > 80 px descarta | 220 ms; retorno spring 0.15 | fundido |
| 12 | Diálogos y hojas | acciones | diálogo scale .96→1 + opacity (origen centro); hoja baja 24 px desde el borde superior; fondo atenuado | 220 / 320 ms | fundido |
| 13 | Cambio de tema | selector | View Transitions API: crossfade de la raíz | 250 ms ease-out | instantáneo |
| 14 | Generar reporte | Exportar | checklist de 4 pasos (spinner → ✓ pop); la hoja de vista previa sube como papel (24 px + opacidad + sombra); el botón se transforma en «Guardado ✓ · Mostrar en Finder»; toast | 520 ms por paso; 320 ms ease-out | fundidos |
| 15 | Estado vacío | sin discos | dos anillos concéntricos “escuchando” (opacity + scale) desfasados | 3.6 s, bajo contraste | detenido |

Regla de frecuencia: la paleta ⌘K, la navegación con flechas y los atajos de pestañas no animan. Popovers y menús escalan desde su disparador (`transform-origin`). Ninguna entrada parte de `scale(0)`.

## 6. Decisiones de diseño

- **Acento cian “señal”** en vez de azul del sistema: se lee como instrumento de medición y no compite con ningún color de salud.
- **“Bueno” en lima** y no en verde claro: cinco estados distinguibles incluso con deficiencias de color, y siempre acompañados de ícono (escudo ✓, círculo ✓, triángulo, octágono, círculo punteado) y texto.
- **Una sola capa translúcida**: el marco de la ventana (con la barra lateral) usa el material; el contenido es sólido. Popovers, toasts y hojas flotan sobre superficie sólida, nunca sobre otro material.
- **Temperatura sin color de salud**: se dibuja con `--data-temp`; solo los segmentos sobre umbral usan ámbar/rojo, así el color de alerta conserva su significado.
- **Honestidad técnica visible**: autopruebas bloqueadas con candado y explicación; USB sin SMART como estado propio con alternativas; lectura parcial como aviso en la sección afectada, nunca como pantalla de error.
- **Contraseña**: la hoja de confirmación explica antes de que aparezca el diálogo nativo (simulado en el prototipo).

## 7. Copy clave

- Óptimo: “Excelente estado: 98 % de vida útil restante y sin errores de medios. 31.64 TB escritos en 2,164 h de uso.”
- Bueno: “Buen estado con desgaste moderado: 58 % de vida útil restante.”
- Atención: “Requiere atención: 3 errores de medios y 12 % de vida útil restante. Planifica su reemplazo y respalda tus datos.”
- Crítico: “Estado crítico: el repuesto (4 %) está por debajo del umbral (10 %) y hay 37 errores de medios. Respalda tus datos lo antes posible.”
- Sin datos: “No se pueden leer datos SMART por USB en macOS. Conecta el disco con un gabinete Thunderbolt o USB4.”
- Autoprueba bloqueada: “macOS no permite enviar el comando de autoprueba NVMe; disponible en discos SATA compatibles o en Linux.”
- Escaneo: “HealthDiskInfo nunca escribe en tu disco.” · “Tu Mac se mantendrá despierta durante la prueba.”
- Desconexión: “El disco se desconectó · mostrando los últimos datos leídos.” · Expulsión: “Ya puedes desconectarlo.”

## 8. Plantilla del reporte

Cuatro páginas con paginación explícita (`doc-page`), diseñadas para caber en Carta y A4: (1) encabezado, veredicto, métricas clave, identidad; (2) tabla SMART completa + advertencia crítica decodificada; (3) temperatura de la sesión, resultado del escaneo, velocidad por LBA con zonas ilegibles, SMART antes/después; (4) registros, observaciones y recomendaciones, apéndice técnico (smartctl, plataforma, comandos con hora y código de salida, SHA-256 real de la salida JSON). Pie con «Página N de M». Todo en escala de grises: los estados se distinguen por ícono + texto + peso.

## 9. Revisión contra la sección 13

- Pantallas y estados de la sección 6: todos navegables; los 12 escenarios del panel funcionan (incl. «Reporte generándose» y el interruptor «Simular error al exportar»).
- Temas: oscuro y claro completos vía `light-dark()`; selector Sistema/Oscuro/Claro en Ajustes y en el panel.
- Coreografías: las 15 implementadas y catalogadas arriba; reduced-motion sustituye todo por fundidos de 150 ms.
- Consistencia de datos: todas las cifras salen de `js/mock-data.js` (tarjeta, detalle, historial, reporte).

## 10. Pendiente / limitaciones conocidas

- Verificación manual en Safari a 1512 × 982 y 1100 × 720 (el prototipo se probó en Chrome; se evitaron APIs exclusivas de Chromium, pero `light-dark()` y `linear()` requieren Safari 17.2+).
- El prototipo es un Design Component (HTML con estilos en línea que leen solo tokens); no hay `components.css` separado: los estilos de cada componente están en su raíz marcada con `@component`.
- La notificación del sistema al terminar una prueba solo aparece si el navegador ya tiene permiso.
- El diálogo de contraseña de macOS y «Mostrar en Finder» son simulaciones.
- °F se aplica en tarjetas, barra lateral, encabezado, métricas, Temperatura, Pruebas e Historial; el reporte se mantiene en °C.
