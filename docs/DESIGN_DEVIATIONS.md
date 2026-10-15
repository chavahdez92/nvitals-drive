# Desviaciones del prototipo

Cada diferencia visible entre la app y `prototype-design/`, con su motivo. Las marcadas con ✅ estaban aprobadas en el plan (§7.3) o las exige la realidad técnica; las marcadas con ❓ conviene que las confirmes.

| # | Desviación | Motivo | Estado |
|---|---|---|---|
| 1 | La ventana simulada (bordes redondeados, sombra, fondo de escritorio, semáforos dibujados) se sustituye por la ventana nativa de macOS: semáforos reales y material *sidebar* nativo detrás de la barra lateral. | Es una app nativa (plan §7.3). | ✅ |
| 2 | El panel de escenarios (⇧D) solo existe en el modo mock (`pnpm dev:web`). | Es una herramienta del prototipo. | ✅ |
| 3 | El diálogo de contraseña simulado se sustituye por el diálogo nativo de macOS (`osascript … with administrator privileges`). | El prototipo ya indicaba que era una simulación. | ✅ |
| 4 | "Abrir" un reporte lo abre con la app predeterminada (Vista Previa, navegador…); "Mostrar en Finder" revela el archivo real. | En el prototipo eran simulaciones. | ✅ |
| 5 | Los textos de verificación del entorno (ruta y versión de smartctl, número de discos) y el estado de la barra lateral muestran los datos reales. | Datos reales. | ✅ |
| 6 | La frase del estado Crítico enumera todas las causas (por ejemplo, añade "la fiabilidad está degradada" cuando el bit 2 está activo). | Exactitud técnica (plan §0.6). | ✅ |
| 7 | El nombre corto del disco interno es "Disco interno" (el prototipo usaba "Macintosh HD"). | diskutil no da el nombre del volumen para el disco físico. | ❓ |
| 8 | El historial de temperatura de la sesión empieza vacío y se llena con lecturas reales cada 1/2/5 s (el prototipo precargaba 30 min simulados). | Datos reales. | ✅ |
| 9 | El `aria-label` de los chips de capacidad ("Autoprueba: Compatible") se genera bien; en el prototipo quedaba vacío por un error de la plantilla. | Corrección de accesibilidad. | ✅ |
| 10 | Las estimaciones de duración del escaneo usan la velocidad típica según la conexión y, durante la prueba, se proyectan con el avance real. | Datos reales. | ✅ |
| 11 | El gráfico de velocidad por posición mantiene la escala del prototipo (0–3,200 MB/s). Un gabinete Thunderbolt 5 puede superar ese máximo. | Conservado del diseño. | ❓ Revisar con hardware TB5. |
| 12 | **Reporte rediseñado** (`src/report/ProReport.tsx`, `report-pro.css`): encabezado corporativo, bloque de veredicto con franja y color semántico, métricas con píldoras de estado, tabla SMART agrupada, gráficos con bandas de umbral, conclusiones destacadas y bloque de firma. Sustituye a la plantilla en escala de grises del prototipo; sigue siendo legible en B/N (ícono + texto). | Solicitado por el usuario (25-sep-2026): "PDF con mucho mejor diseño, más profesional". | ✅ Aprobado por el usuario |
| 13 | Constructor de reportes: solo la vista previa se desplaza; la columna de opciones queda fija. | Solicitado por el usuario: al desplazarse se perdía la columna Disco. | ✅ Aprobado por el usuario |
| 14 | Pruebas nuevas con la misma tarjeta del diseño: **estrés térmico** (lectura sostenida de 10 min) y **comparación antes/después de una carga**. Las autopruebas SMART se habilitan en discos SATA (vía IOKit). | Solicitado por el usuario: más pruebas útiles según la documentación de smartctl. | ✅ Aprobado por el usuario |
| 15 | Diálogo "macOS bloqueó el acceso al disco" (variante de advertencia del diseño) y fila "Autorización para escanear" en Ajustes → Pruebas (estado de Touch ID). | Requisito técnico: permiso de privacidad TCC y Touch ID. | ✅ |
| 16 | **Benchmark de lectura/escritura (fio)**: tarjeta en Pruebas, hoja de confirmación (volumen, tamaño 256 MB/1 GB/4 GB, velocidad nominal opcional), tabla de resultados por perfil (SEQ1M Q8T1, SEQ1M Q1T1, RND4K Q32T1, RND4K Q1T1) y panel nuevo **«Qué limita la velocidad»** (puerto de la Mac → gabinete/puente → enlace PCIe del SSD, con el cuello de botella resaltado y barras de medido vs. techo). Hechos con los tokens, la hoja y la tarjeta del diseño. El diálogo de permiso se ensanchó a 520 px y «Acceso total al disco» pasó a ser un enlace. | Solicitado por el usuario (25-sep-2026). **Excepción a la regla de solo lectura:** fio escribe un archivo temporal `.hdi-bench.tmp` en un volumen montado y lo borra al terminar, fallar o cancelar. | ✅ Aprobado por el usuario |
| 17 | **Benchmark en tiempo real** (`src/ui/screens/BenchView.tsx`):
- Durante la prueba:
  - línea de tiempo de las 8 pruebas en lugar de la barra de progreso;
  - medidor radial de MB/s con el techo de la conexión marcado;
  - gráfica en vivo con curva suave, escala automática, línea punteada del techo y punto guía con halo;
  - tarjetas por perfil que se elevan cuando están activas, con contador animado y mini-gráfica de estabilidad.
- Al terminar:
  - barras agrupadas que crecen escalonadas (secuencial en MB/s con el techo; aleatorio 4K en IOPS);
  - flujo animado entre los eslabones de la cadena mientras corre.
- Usa los tokens del prototipo (`--data-read`/`--data-write`, `--chart-*`, `--dur-*`, `--ease-out`) y las animaciones `hdi-listen`/`hdi-shimmer`. Agrega los keyframes `hdi-grow` y `hdi-flow`, que se desactivan con movimiento reducido. | Solicitado por el usuario (25-sep-2026): "mejor diseño, transiciones, animaciones y gráficos en tiempo real". | ✅ Aprobado por el usuario |
| 18 | **Reporte rápido de una hoja** (`src/report/QuickReport.tsx`, `report-quick.css`):
- Anillo grande de vida útil y veredicto como elemento dominante, con barras de vida útil y repuesto (marca del umbral).
- Uso: datos leídos y escritos, horas y ciclos, con barra de proporción lectura/escritura.
- Identidad compacta y chips de integridad: errores de medios, log de errores, apagados inseguros y advertencia crítica.
- Franja de pruebas (último benchmark y escaneo) solo si existen, y recomendación.

Se genera desde el constructor (nuevo selector «Tipo de reporte: Completo / Rápido»; en modo rápido las secciones se atenúan) y desde «Reporte rápido (PDF)» en el menú ⋯ del disco y en el menú contextual de la barra lateral. Verificado en Carta y A4: siempre 1 hoja, incluso en el peor caso (crítico + pruebas). | Solicitado por el usuario (28-sep-2026). | ✅ Aprobado por el usuario |
| 19 | **Expedientes** (`src/ui/screens/InventoryScreen.tsx`):
- Ítem «Expedientes» en la barra lateral y pantalla nueva con lista (búsqueda por serie, modelo, lote o destino; filtros por estado y lote) y ficha visual: héroe de salud y vida útil, uso, identidad, integridad, pruebas guardadas, datos comerciales editables y línea de tiempo de revisiones.
- Hoja «Agregar al expediente» y modo «Recibir lote» con barra flotante.
- Botón «Agregar al expediente / En expediente» en el Resumen del disco y en los menús ⋯ y contextual.
- Resultados de expedientes en ⌘K y grupo «Expedientes» en Ajustes.

Solo existe en modo real; el modo mock no cambia. | Solicitado por el usuario (28-sep-2026): llevar un expediente por número de serie de los discos que compra y revende. | ✅ Aprobado por el usuario |
| 20 | **Nueva marca: NVitals Drive.**
- Nombre visible en ventana, onboarding, ajustes, diálogos, notificaciones, reportes y carpeta de Documentos.
- Ícono nuevo en la app, el Dock y el favicon.
- Logo horizontal en el encabezado de los reportes, en lugar de ícono + nombre.
- Cambia también en el modo mock, por lo que la paridad muestra diferencias en las pantallas con nombre o ícono.

El identificador del bundle y los nombres internos se conservan. | Solicitado por el usuario (28-sep-2026). | ✅ Aprobado por el usuario |
| 21 | **Reporte rápido de varios discos** (Expedientes):
- Botón «Seleccionar» / «Listo» en la lista (se oculta «Recibir lote» mientras se selecciona). Aparecen la Checkbox del prototipo en cada fila y la fila «Seleccionar los N» / «Quitar selección», que respeta la búsqueda y los filtros de estado y lote. ⌘-clic en una fila entra al modo, ⇧-clic marca un rango, ⌘A marca los visibles y Esc sale.
- Panel derecho `BatchPanel` en lugar de la ficha: conteo por veredicto, vida útil promedio y mínima, lista de discos elegidos (con ×), Referencia, Técnico, Papel (Carta/A4) e interruptor «Incluir estado, lote y destino», más el botón «Generar PDF».
- Plantilla `src/report/BatchReport.tsx` + `report-batch.css` (`kind=batch`): encabezado del reporte rápido, fichas por veredicto con barra de proporción, recuadro «Requieren atención» (hasta 5 + «+N más») y tabla de una fila por disco (salud, vida útil, repuesto, errores de medios, uso y fecha de revisión), ordenada por gravedad y paginada con filas de alto fijo. La columna «Apagados inseguros» del plan se quitó por espacio: no cambia el veredicto.
- Entrada en ⌘K: «Reporte rápido de varios discos».

Solo en modo real; el modo mock no cambia. El costo y el precio nunca se imprimen. | Solicitado por el usuario (30-sep-2026): reporte rápido de varios discos del expediente con lo más relevante de su salud. | ✅ Aprobado por el usuario |
| 22 | **Expedientes: horas de uso, tabla de seleccionados y orden del reporte**:
- Lista lateral: las horas de uso de la última revisión aparecen a la derecha del número de serie, bajo la vida útil. Si no hay datos SMART no se muestran. El núcleo las saca de `disk_json` con `json_extract` (`inventory_list`, sin migración).
- Modo «Seleccionar»: el panel derecho tiene el SegmentedControl «Tabla · Reporte PDF». «Tabla» (la vista por defecto) muestra los discos elegidos como la vista de lista de Dispositivos, con las columnas #, Salud, Modelo, Serie, Vida, Horas, Escritos, Estado, Lote (solo si algún disco tiene lote) y Revisión, más × para quitar. Al hacer clic en un encabezado se ordena (`aria-sort` y flecha); otro clic invierte el sentido. Los vacíos siempre quedan al final.
- «Reporte PDF»: se agrega la fila «Orden» (Select con las mismas columnas y botón de sentido), que comparte el orden con la tabla. La lista de elegidos va numerada en ese orden.
- El PDF sale en el orden de la tabla (`sortInventory` → `inventory_latest` → `order: 'given'`). El orden por defecto («Salud», lo más grave primero) es el mismo de #21. El resumen y «Requieren atención» siguen ordenados por gravedad.

Solo en modo real; el modo mock no cambia. | Solicitado por el usuario (12-oct-2026): ver las horas en la lista, comparar los discos elegidos sin exportar y elegir el orden del reporte de varios discos. | ✅ Aprobado por el usuario |
| 23 | **Serial ficticio en los datos de ejemplo** (excepción única a la regla de solo lectura de `prototype-design/`): el serial del SSD interno Apple en `prototype-design/js/mock-data.js` y en `src/ui/mock/mockData.ts` pasa de un valor real a uno ficticio con la misma forma (`7fb04e4b76d0f918`). Los fixtures se anonimizaron con `scripts/anonymize-fixture.mjs`. No cambia nada más del prototipo; la paridad no se afecta porque ambos archivos usan el mismo valor. | Publicación del repositorio como código abierto (`docs/OPEN_SOURCE_PLAN.md`, decisión D3, 14-oct-2026). | ✅ Aplicada al iniciar la Fase A |
