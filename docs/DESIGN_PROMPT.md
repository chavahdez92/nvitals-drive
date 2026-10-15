# Prompt de diseño: prototipo HTML y sistema de diseño de HealthDiskInfo

Este archivo contiene el prompt para generar, en una herramienta externa de diseño con IA (por ejemplo Claude, v0, Figma Make, Stitch o Lovable), el **sistema de diseño** y el **prototipo HTML navegable** de la app.

El resultado se guarda en `prototype-design/` y se convierte en la **fuente de verdad visual y de interacción** de la implementación (ver `docs/IMPLEMENTATION_PLAN.md`, sección 0).

---

## Cómo usarlo

1. **(Opcional, recomendado)** Si quieres elegir primero entre direcciones visuales, pega el *Prompt 0* (sección "Prompts de seguimiento") al final del mismo mensaje que el prompt maestro. La herramienta propondrá 3 direcciones y esperará tu elección antes de construir todo.
2. Copia el **prompt maestro** completo (el bloque de abajo) y pégalo en tu herramienta.
   - El prompt maestro es largo (~42,000 caracteres). Si la herramienta tiene límite de longitud, envíalo en 4 mensajes, cortando en las marcas `✂ FIN DE LA PARTE…`. Antes de la parte 1 escribe: *"Te enviaré el encargo en 4 partes. No generes nada hasta recibir la parte 4; responde solo «Recibido»."*
3. Itera con los **prompts de seguimiento** hasta cubrir todo.
4. Descarga el código y colócalo en `prototype-design/`, respetando la estructura de la sección 12 del prompt. Si tu herramienta entrega otra estructura (por ejemplo, un proyecto React), guárdala tal cual. La Fase 1 del plan se encarga de mapearla.
5. Antes de copiarlo, revisa el **checklist de aceptación** al final de este archivo.

---

## Prompt maestro

````markdown
# Encargo: sistema de diseño + prototipo HTML de alta fidelidad de "HealthDiskInfo" (app de escritorio para macOS)

> Las marcas «✂ FIN DE LA PARTE…» solo sirven para dividir este encargo en varios mensajes; ignóralas.

## 0. Tu rol y lo que debes entregar
Actúa como diseñador(a) de producto senior y design engineer. Tu especialidad son las apps profesionales nativas de macOS, la visualización de datos técnicos y el motion design de interfaces.

Entrega DOS piezas coherentes entre sí:
1. **Sistema de diseño** documentado en una página HTML: tokens, componentes, estados y especificación de movimiento, con demos interactivas.
2. **Prototipo HTML navegable** de alta fidelidad: todas las pantallas, estados, transiciones y animaciones, con datos mock realistas.

Este prototipo será la **fuente de verdad** de la implementación real, hecha con Tauri 2 + React + TypeScript. La app se renderiza en WebKit (WKWebView de macOS). Por eso el prototipo tiene que ser preciso y consistente, cubrir todos los estados y poder traducirse a componentes sin ambigüedad. Prioriza la calidad y la coherencia sobre la cantidad de efectos.

## 1. El producto
HealthDiskInfo es una app de escritorio para macOS (MacBook Pro con Apple Silicon M5 Pro). Sirve para **ver, revisar, probar y documentar la salud de SSD NVMe M.2** conectados a la Mac, casi siempre mediante gabinetes externos Thunderbolt, USB4 o USB. Por detrás ejecuta la herramienta de línea de comandos **smartctl** (smartmontools 7.5) con salida JSON y muestra los resultados de forma visual, clara y animada. Sustituye el flujo actual del usuario, que abre la Terminal y lee el texto plano de `smartctl`.

**Usuario principal:** técnico o entusiasta que prueba SSD nuevos y usados para compras de segunda mano, garantías, clientes o inventario. Conecta de 1 a 4 discos a la vez. Sus sesiones van de 1 minuto (chequeo rápido) a más de 1 hora (pruebas largas). Necesita identificar rápido cada disco, tener un veredicto claro de salud, llegar al detalle técnico cuando lo pida y generar un reporte profesional para compartir.

**Principios del producto:**
- **Veredicto primero, detalle después.** En 3 segundos se entiende si un disco está bien. El detalle técnico queda a un clic.
- **Transparencia total.** Cada dato sale de un comando real. La UI siempre deja ver qué comando se ejecutó, su código de salida y la salida cruda.
- **Honestidad técnica.** Si algo no se puede hacer en macOS o con cierto gabinete, la UI lo dice con claridad, explica por qué y ofrece la alternativa. Nunca lo oculta ni lo finge.
- **Calma y precisión.** Estética de instrumento de medición profesional, sin alarmismo. Los estados críticos sí deben destacar sin ambigüedad.

## 2. Realidades técnicas que el diseño DEBE reflejar
1. **Tipos de conexión:**
   - **Interno** (SSD de Apple): hay datos SMART, aunque algunos pueden llegar incompletos.
   - **Thunderbolt 3/4/5 y USB4.** Son gabinetes con túnel PCIe (por ejemplo, ASMedia ASM2464PD o controladores Intel). El SSD aparece como NVMe nativo, así que hay **datos SMART completos**. Se puede mostrar el enlace PCIe, por ejemplo: "PCIe Gen4 ×4 · 16 GT/s".
   - **USB 3.x** (puentes JMicron JMS583, Realtek RTL9210, ASMedia ASM2362). **macOS no permite leer SMART a través de USB.** El disco aparece con nombre y capacidad, pero con el estado "SMART no disponible", la explicación y la recomendación: "usa un gabinete Thunderbolt/USB4".
2. **En macOS, smartctl solo puede LEER datos NVMe** (identidad y logs de salud, errores y autopruebas). **No puede iniciar autopruebas NVMe** (`smartctl -t short/long`). Muestra las autopruebas como opciones **visibles pero bloqueadas**, con la explicación: "macOS no permite enviar el comando de autoprueba NVMe; disponible en discos SATA compatibles o en Linux". Muestra también el **historial de autopruebas** que el disco tenga guardado.
3. **Pruebas que sí funcionan en macOS** (complementan a smartctl):
   - **Escaneo de lectura completo.** Lee toda la superficie del disco sin escribir nada, detecta zonas ilegibles y mide la velocidad sostenida. Requiere la contraseña de administrador (diálogo nativo de macOS). Tarda de minutos a horas según la capacidad, por ejemplo ~12 min para 2 TB a ~2.8 GB/s.
   - **Escaneo rápido (muestreo).** Lee bloques repartidos por todo el disco (~2 % del total) en 1 o 2 minutos.
   - Toda prueba registra la **temperatura en vivo** para detectar estrangulamiento térmico. También toma una **instantánea SMART antes y otra después** para mostrar qué cambió.
   - El escaneo no está disponible para el disco interno de arranque. Aparece deshabilitado y con el motivo.
4. **Lecturas parciales.** Algunos discos no entregan todos los logs. Por ejemplo, el SSD de Apple no deja leer el log de errores. La UI muestra lo que sí está disponible y un aviso discreto en la sección afectada. Una falla parcial nunca produce una pantalla de error completa.
5. **Códigos de salida de smartctl.** Son una máscara de bits que la UI decodifica en chips legibles: 0 "Sin problemas", 2 "No se pudo abrir el dispositivo", 4 "Lectura parcial: un comando falló", 8 "SMART: disco fallando", 64 "El log de errores tiene registros", 128 "El log de autopruebas tiene errores".
6. **Conexión en caliente.** Los discos se conectan y desconectan en cualquier momento. La UI reacciona en vivo (en 2 s o menos) con animación y aviso.
7. **Identidad persistente.** Un disco se reconoce por su modelo y número de serie aunque cambie su identificador (por ejemplo, de disk4 a disk6). Por eso cada disco tiene historial.
8. **Cómo se determina el veredicto.** Son reglas, y la app las explica en un popover "¿Cómo se determina?":
   - **Crítico:** el disco reporta una advertencia crítica (repuesto bajo el umbral, fiabilidad degradada, modo solo lectura o falla del respaldo), el estado SMART es fallido, el repuesto está por debajo del umbral o hay 10 o más errores de medios.
   - **Atención:** hay de 1 a 9 errores de medios, el repuesto baja y está a 10 puntos o menos del umbral, o la vida útil restante es del 20 % o menos.
   - **Óptimo:** no hay alertas y la vida útil restante es del 80 % o más.
   - **Bueno:** no hay alertas y la vida útil restante está entre 21 % y 79 %.
   - **Sin datos:** SMART no está disponible.
   - El **anillo principal muestra la vida útil restante** (100 − "Percentage Used" de NVMe) con el color del veredicto. Hay notas informativas que no cambian el veredicto: apagados inseguros, entradas del log de errores y tiempo histórico sobre la temperatura de advertencia. La temperatura alta del momento se muestra como una alerta térmica aparte.

## 3. Plataforma, ventana y formato
- **App de escritorio macOS.** La barra de título es unificada y transparente, con los **botones de semáforo** de macOS arriba a la izquierda. Reserva sobre la barra lateral una zona de ~80 × 52 px sin contenido interactivo. Toda la franja superior (52 px) sirve para arrastrar la ventana.
- **Tamaño de diseño principal: 1512 × 982 px** (MacBook Pro de 14"). Debe funcionar desde **1100 × 720** hasta **1728 × 1117** (16"). El diseño es fluido; no es una app móvil.
- **Primero el tema oscuro**, pero el tema claro también va completo; los dos son de primera clase. Respeta `prefers-color-scheme` y ofrece un selector: Sistema / Oscuro / Claro.
- La barra lateral usa el **material translúcido nativo de macOS** (vibrancy); el área de contenido es una superficie sólida. En el prototipo simúlalo con `backdrop-filter` sobre un fondo de escritorio abstracto y desenfocado detrás de la ventana. Incluye un interruptor para ver la ventana sobre fondos claros y oscuros.
- **Lenguaje visual del macOS actual** (Liquid Glass, macOS 26 o posterior): esquinas generosas, barra lateral flotante con margen interior y controles limpios. La jerarquía se construye con tipografía y espacio más que con bordes.
- **Tipografía del sistema:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`. Monoespaciada: `"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace`. **Todos los números van en tabular** (`font-variant-numeric: tabular-nums`). No hay fuentes web externas obligatorias.
- **Idioma de la interfaz: español de Latinoamérica.**
  - Conserva los términos técnicos: SMART, NVMe, TBW, LBA, firmware, namespace.
  - Usa "disco", "reporte", "prueba" y "escaneo".
  - Números con formato es-MX: 2,164 h y 31.64 TB.
  - Unidades: TB decimales (1 TB = 10¹² bytes), °C (con opción de °F) y horas con su equivalente en días.
- **Motor final: WebKit (Safari).** El prototipo debe verse y animarse igual en Safari que en Chrome. Evita funciones exclusivas de Chromium y usa `backdrop-filter` con moderación, porque es costoso en WebKit.

## 4. Dirección visual
- **Personalidad: instrumento de precisión.** Confiable, sereno, técnico y moderno. Referentes de espíritu, no para copiar: apps pro de macOS, herramientas de desarrollo de alta calidad e instrumentos de laboratorio.
- **Color:**
  - Neutrales grafito ligeramente fríos, en una escala de 10 a 12 pasos, para ambos temas.
  - **Un acento propio** para foco, selección y acciones primarias. Propón uno; como sugerencia, un cian o teal tipo "señal" o un azul eléctrico. No uses un color de salud como acento.
  - **Paleta semántica de salud** con 5 estados: **Óptimo · Bueno · Atención · Crítico · Sin datos**. Cada estado tiene variantes de fondo, texto, borde e ícono, con contraste AA en ambos temas. El estado **nunca** se comunica solo con color: siempre lleva ícono y texto.
  - **Paleta para datos** (gráficos de temperatura, velocidad, lectura y escritura), coherente con la anterior, con bandas de umbral (advertencia y crítico) legibles.
- **Iconografía:** trazo lineal de ~1.5 px, al estilo de SF Symbols. Puedes usar Lucide como sustituto, en un sprite SVG local. Íconos específicos: SSD M.2, gabinete externo, Thunderbolt, USB, chip o controlador, termómetro, escudo de salud, reloj, rayo de encendido, registro, prueba y reporte.
- **Profundidad:**
  - Sombras suaves y cortas.
  - Los materiales translúcidos solo van en capas flotantes: barra lateral, barra superior al hacer scroll, popovers y hojas.
  - Nunca apiles una capa translúcida sobre otra.
  - En lugar de divisores duros bajo las barras fijas, usa un desvanecido o blur en el borde cuando el contenido pasa por debajo.
- **Marca:** propón un símbolo simple (por ejemplo, un módulo M.2 con una línea de pulso), un wordmark "HealthDiskInfo" y el **ícono de la app para macOS** (1024 × 1024, con la forma de los íconos actuales de macOS).
- **Evita:** glassmorphism excesivo, gradientes arcoíris, neón saturado, sombras pesadas, la estética genérica de "dashboard admin", emojis en la UI e ilustraciones infantiles.

## 5. Arquitectura de información
- **Barra lateral,** de arriba abajo:
  1. Zona de los semáforos.
  2. **Dispositivos:** lista viva de los discos conectados. Cada uno muestra un punto de salud, su nombre corto y su temperatura. Si tiene una prueba en curso, muestra un mini indicador de progreso.
  3. **Reportes.**
  4. **Historial.**
  5. Al fondo: **Ajustes** y el estado de smartctl ("smartctl 7.5 · listo").
- **Barra superior del contenido:** título o breadcrumb, acciones contextuales, botón "Re-escanear" (⌘R) y acceso a la paleta de comandos (⌘K).
- **Consola global:** cajón inferior plegable (⌘J) con el historial de comandos ejecutados.

✂ ─── FIN DE LA PARTE 1 DE 4 ───

## 6. Pantallas y estados (diseña TODAS, con todos sus estados)

### 6.1 Verificación del entorno (primer arranque, y cada vez que algo falle)
- Checklist animada de 4 pasos que se validan en secuencia:
  1. smartctl encontrado (`/opt/homebrew/bin/smartctl`, versión 7.5).
  2. Salida JSON soportada.
  3. Acceso a datos SMART sin privilegios.
  4. N dispositivos detectados.
- Al terminar, transición a Dispositivos.
- Estados:
  - Todo OK.
  - **smartctl no instalado:** tarjeta con el comando `brew install smartmontools`, botón para copiarlo, botón "Volver a verificar" y la nota "¿No tienes Homebrew?".
  - Versión antigua: advertencia con opción de continuar de todos modos.
- Panel educativo breve "¿Qué gabinetes funcionan?": Thunderbolt/USB4 ✓ datos completos · USB 3.x ✗ sin SMART en macOS.

### 6.2 Dispositivos (inicio)
- **Franja de resumen**, por ejemplo: "6 discos · 1 crítico · 1 requiere atención · temp. máx. 67 °C".
- **Controles:** filtros (Todos / Externos / Internos), alternar vista (Tarjetas / Lista) y ordenar (por salud, nombre o temperatura).
- **Tarjeta de dispositivo** (el componente estrella):
  - Contenido: anillo de vida útil con el color del veredicto, badge del veredicto, modelo, capacidad, badge de conexión (Thunderbolt · USB4 · USB 3.2 · Interno) con el detalle del enlace, temperatura en vivo con mini sparkline, TB escritos y horas de uso.
  - Hover: elevación sutil. Clic: abre el detalle con una transición de elemento compartido.
  - Estados:
    - Identificando: skeleton y "Leyendo datos SMART…".
    - Óptimo, Bueno, Atención y Crítico.
    - **Sin datos SMART:** con el motivo, por ejemplo "Puente USB Realtek RTL9210: macOS no permite leer SMART por USB", y el CTA "Ver alternativas".
    - Desconectado: atenuada, con "Desconectado hace 5 s".
    - Seleccionado.
- **Estado vacío:** ilustración sobria de un SSD M.2 y un gabinete, el texto "Conecta un SSD NVMe para empezar", una animación sutil de "escuchando" y un consejo de compatibilidad.
- **Estado cargando:** skeletons con shimmer suave.
- **Disco interno:** aparece marcado como "Interno"; hay un ajuste para ocultarlo.

### 6.3 Detalle del dispositivo
**Encabezado fijo.** Al hacer scroll se vuelve translúcido y compacto. Contiene:
- Nombre o modelo y capacidad.
- Badge de conexión con el enlace, por ejemplo "Thunderbolt · PCIe Gen4 ×4".
- Badge del veredicto y temperatura en vivo.
- Acciones: Actualizar (⌘R), Generar reporte (⌘E) y el menú "…" con Copiar resumen, Copiar JSON, Expulsar disco y Ver en Historial.

**Pestañas:** Resumen · Salud SMART · Temperatura · Pruebas · Registros · Identidad · Consola (⌘1…⌘7).

**a) Resumen**
- **Héroe:**
  - Anillo grande de vida útil (0–100 %) con el badge del veredicto.
  - Una frase en lenguaje natural. Ejemplos de copy por estado:
    - Óptimo: "Excelente estado: 98 % de vida útil restante y sin errores de medios. 31.64 TB escritos en 2,164 h de uso."
    - Bueno: "Buen estado con desgaste moderado: 58 % de vida útil restante."
    - Atención: "Requiere atención: 3 errores de medios y 12 % de vida útil restante. Planifica su reemplazo y respalda tus datos."
    - Crítico: "Estado crítico: el repuesto (4 %) está por debajo del umbral (10 %) y hay 37 errores de medios. Respalda tus datos lo antes posible."
    - Sin datos: "No se pueden leer datos SMART por USB en macOS. Conecta el disco con un gabinete Thunderbolt o USB4."
  - Enlace "¿Cómo se determina?", que abre un popover con las reglas de la sección 2.8.
- **Mosaico de métricas clave.** Cada tile lleva ícono, valor, unidad, contexto y estado:
  - Vida útil restante.
  - Repuesto disponible, comparado con el umbral mediante un medidor.
  - Datos escritos y datos leídos.
  - Horas de encendido, con su equivalente en días.
  - Ciclos de encendido y apagados inseguros.
  - Errores de medios y entradas en el log de errores.
  - Temperatura: actual, con sparkline y umbrales.
- **Alertas priorizadas** (si las hay), cada una con explicación y acción recomendada, por ejemplo "Respalda tus datos ahora".
- **Comparación con la revisión anterior**, por ejemplo: "Desde la última revisión (hace 12 días): +0.8 TB escritos · +26 h · sin errores nuevos".
- **Acciones rápidas:** Iniciar escaneo rápido · Monitorear temperatura · Generar reporte.

**b) Salud SMART**
- Tabla completa del log de salud NVMe, agrupada en Desgaste · Uso · Integridad · Térmico · Energía. Cada fila muestra el nombre en español, el valor formateado, el valor crudo, la unidad, un indicador de estado y un tooltip "¿Qué significa?" con una explicación simple.
- **Advertencia crítica decodificada:** 6 banderas en forma de checklist, cada una con ✓ verde o ✕ rojo:
  1. Repuesto bajo el umbral.
  2. Temperatura fuera de rango.
  3. Fiabilidad degradada.
  4. Modo solo lectura.
  5. Falla del respaldo de memoria volátil.
  6. Región de memoria persistente no confiable.
- Interruptor "Mostrar valores crudos".

**c) Temperatura**
- Gráfico grande en vivo:
  - Ventanas de 5, 15 y 60 min.
  - Bandas de umbral de advertencia y crítico.
  - El valor actual en grande.
  - Mínimo, máximo y promedio.
  - Sensores individuales (Sensor 1, Sensor 2…).
- Controles: intervalo (1 s / 2 s / 5 s), pausar y reanudar, reiniciar y exportar CSV.
- Historial térmico del disco: minutos sobre la temperatura de advertencia y sobre la crítica, e indicador de estrangulamiento térmico.
- Consejo según el contexto, por ejemplo: "Sobre 70 °C sostenidos: considera un gabinete con disipador".
- Si el disco no reporta umbrales (el SSD de Apple), usa umbrales estimados de 70/80 °C marcados como "estimados".

**d) Pruebas**
- **Tarjetas de prueba.** Cada una dice qué hace, cuánto tarda (estimado), qué requiere, y tiene el botón Iniciar:
  1. Autoprueba SMART corta (`smartctl -t short`): **bloqueada en macOS**, con candado, explicación y "Más información".
  2. Autoprueba SMART extendida (`smartctl -t long`): **bloqueada en macOS**.
  3. Escaneo de lectura completo: no destructivo; requiere la contraseña de administrador.
  4. Escaneo rápido (muestreo).
- **Antes de iniciar un escaneo:** diálogo de confirmación que explica la duración, que la prueba no escribe nada y que macOS pedirá la contraseña ("HealthDiskInfo nunca escribe en tu disco").
- **Prueba en curso.** Es una vista dedicada dentro de la pestaña y muestra:
  - Progreso grande en porcentaje, tiempo transcurrido y tiempo restante.
  - Velocidad actual (MB/s) con un gráfico de velocidad según la posición en el disco (0–100 % de los LBA).
  - Temperatura en vivo y un contador de errores.
  - Botón Cancelar y la nota "Tu Mac se mantendrá despierta durante la prueba".
  - Sigue visible (mini indicador en la barra lateral y en la tarjeta) aunque el usuario navegue a otra pantalla.
- **Resultado:** Aprobado / Con errores / Cancelado / Interrumpido (disco desconectado). El resumen incluye:
  - Duración.
  - Velocidad promedio, mínima y máxima.
  - Temperatura máxima.
  - Zonas ilegibles, en lista con su rango de LBA.
  - Tabla "SMART antes vs. después" con las diferencias resaltadas.
  - Botón "Agregar al reporte".
- **Historial de pruebas del disco.** Incluye las entradas del log de autopruebas guardado en el propio disco, por ejemplo: "Corta · Completada sin errores · a las 1,998 h".

**e) Registros**
- **Log de información de errores:** tabla con #, conteo, SQID, CMDID, estado, LBA y NSID.
  - Estado vacío: "Sin errores registrados".
  - Estado de lectura parcial: "Este disco no permite leer el log de errores (GetLogPage falló)".
- **Log de autopruebas:** tabla con tipo, resultado, horas de encendido y segmento o LBA con falla.

**f) Identidad y capacidades**
- **Identidad:** pares clave-valor, cada uno con botón para copiar:
  - Modelo.
  - Número de serie, **enmascarado por defecto** y con botón para revelarlo.
  - Firmware.
  - Proveedor PCI (por ejemplo, Samsung · 0x144D) y OUI IEEE.
  - Versión NVMe.
  - Capacidad total y tamaño de bloque lógico.
  - Namespaces e ID de controlador.
  - Conexión y enlace PCIe.
  - Puente o gabinete, si se conoce.
  - Identificador (`disk4`) y ruta IOService, copiable y truncada con elipsis al centro.
- **Capacidades:**
  - Comandos admin opcionales, como chips activos o inactivos: Autoprueba, Format NVM, Descarga de firmware, Security send/receive, Gestión de namespaces…
  - Comandos NVM: Dataset Management/TRIM, Write Zeroes…
  - Umbrales de temperatura.
  - Tabla de estados de energía (PS0–PS4, con potencia máxima y latencias).
  - Formatos LBA.

**g) Consola**
- **Botones de herramientas de smartctl:** Información (`-i`), Salud (`-H`), Atributos (`-A`), Capacidades (`-c`), Log de errores (`-l error`), Log de autopruebas (`-l selftest`) y Todo (`-x`).
- **Modo experto:** constructor de comandos con chips de las opciones permitidas, vista previa del comando exacto (`smartctl -x -j disk4`) y botón Ejecutar. No admite texto libre.
- **Salida en 3 vistas:**
  - **Vista:** formateada.
  - **JSON:** con resaltado de sintaxis, árbol plegable, búsqueda y botón para copiar.
  - **Texto:** la salida clásica de smartctl en monoespaciada.
- **Historial de comandos:** hora, duración, chip con el código de salida decodificado, y botones para volver a ejecutar y copiar.

### 6.4 Reportes
- **Lista de reportes generados:** fecha, disco, veredicto y formato, con acciones para abrir, mostrar en Finder y eliminar. Incluye su estado vacío.
- **Constructor de reporte.** Se abre desde el detalle (⌘E) o desde la lista:
  - Columna izquierda con las opciones:
    - Disco.
    - Secciones a incluir: Resumen, Identidad, Salud SMART, Temperatura, Pruebas, Registros y Apéndice técnico.
    - Nombre del técnico, cliente o referencia, y notas.
    - Enmascarar el número de serie.
    - Tamaño de papel: Carta o A4.
  - A la derecha, la **vista previa en vivo** de la hoja, con el número de páginas.
  - Exportar: **PDF** (principal), HTML o JSON.
- **Estados:**
  - Generando: pasos animados.
  - Éxito: el botón se transforma en "Guardado ✓ · Mostrar en Finder".
  - Error.

### 6.5 Plantilla del reporte (documento imprimible)
Diseña el documento en sí, en Carta y A4, con tema claro y apto para imprimir en blanco y negro. Contiene:
- Encabezado con el logo, el título "Reporte de salud de SSD", el ID del reporte y la fecha.
- Bloque grande de veredicto: estado, vida útil y la frase en lenguaje natural.
- Identidad del disco y métricas clave.
- Tabla SMART completa.
- Gráficos de temperatura y de velocidad del escaneo.
- Resultados de las pruebas y diferencias SMART.
- Registros.
- Observaciones y recomendaciones.
- Apéndice técnico: versión de smartctl, plataforma, comandos ejecutados con su hora y código de salida, y hash SHA-256 de los datos crudos.
- Pie de página con la numeración.

Los estados de salud deben distinguirse también sin color (ícono + texto).

### 6.6 Historial
- **Discos vistos,** incluidos los desconectados. Cada uno se identifica por su modelo y su serie enmascarada, con la fecha de la última revisión y la tendencia.
- **Por disco:** línea de tiempo (gráfico) de la vida útil, los TB escritos, los errores de medios y la temperatura máxima, más la lista de instantáneas.
- **Comparar dos instantáneas:** vista lado a lado con los cambios (↑/↓ con color semántico), por ejemplo: "+1.2 TB escritos · +14 h · +0 errores de medios".

### 6.7 Ajustes
- **General:** tema; movimiento (Sistema / Reducido / Completo); unidades (°C o °F); mostrar u ocultar el disco interno.
- **smartctl:** ruta detectada, versión y botón "Volver a detectar".
- **Monitoreo:** intervalo y notificaciones (al conectar un disco, al terminar una prueba y al detectar un estado crítico).
- **Reportes:** nombre del técnico, empresa, logo, papel y enmascarar la serie por defecto.
- **Pruebas:** mantener la Mac despierta y sonido al terminar.
- **Umbrales avanzados:** errores de medios, margen del repuesto y umbrales de temperatura estimados.
- **Datos:** exportar o borrar el historial.
- **Acerca de.**

### 6.8 Paleta de comandos (⌘K)
- Busca acciones y discos, por ejemplo: "Generar reporte de Samsung 990 PRO", "Iniciar escaneo rápido", "Ir a Temperatura", "Re-escanear".
- Resultados agrupados, manejo 100 % con teclado y atajos visibles.

### 6.9 Capas y avisos
- Toasts: disco conectado o desconectado, disco expulsado ("Ya puedes desconectarlo"), prueba completada y reporte guardado.
- Banners en línea: información, éxito, advertencia y crítico.
- Diálogos de confirmación.
- **Aviso de desconexión durante una prueba.**
- Explicación previa a la solicitud de contraseña.
- Tooltips.

✂ ─── FIN DE LA PARTE 2 DE 4 ───

## 7. Sistema de diseño (página `design-system.html`)
Documenta con ejemplos vivos, en ambos temas:

**Fundamentos:**
- Color: neutrales, acento, los 5 estados de salud con sus variantes, colores de datos y bandas de umbral.
- Tipografía: la escala completa (display, títulos, cuerpo, callout, nota, caption y mono), con tamaño, peso, interlineado y tracking de cada nivel. El tracking es negativo en tamaños grandes y cercano a 0 en el cuerpo.
- Espaciado (rejilla de 4 px), radios y sombras o elevación.
- Materiales: barra lateral, barra superior, popover y hoja, cada uno con su alternativa sólida para `prefers-reduced-transparency`.
- Bordes y divisores, anillo de foco, iconografía y capas (z-index).
- Tokens de movimiento, con **demos reproducibles** de cada curva, duración y spring.

**Componentes.** Documenta cada uno con sus variantes y con los estados default, hover, active, focus, disabled, loading y error cuando apliquen:
- **Botones y selección:** Button (primario, secundario, fantasma, destructivo y solo ícono, en varios tamaños), SegmentedControl, Tabs con indicador deslizante, Switch, Checkbox y Radio.
- **Entradas:** Select/Menú, campo de texto, buscador y textarea.
- **Capas flotantes:** Tooltip, Popover, menú contextual, Dialog, Sheet, Toast y Banner.
- **Estado y etiquetas:** **HealthBadge** (5 estados), **ConnectionBadge**, Chip (filtro y bandera) y KeyValue.
- **Métricas:** **StatTile** (con delta y sparkline), **LifeRing** (anillo de vida útil en tamaños S/M/L), medidor lineal (repuesto vs. umbral, vida útil), indicador de temperatura y progreso (anillo y barra, determinado e indeterminado).
- **Gráficos:** Sparkline, gráfico de línea en vivo y gráfico de velocidad por posición.
- **Datos y consola:** Table (con orden y encabezado fijo), JsonViewer, CommandBlock (con botón copiar) e ítem de consola.
- **Dispositivos:** **DeviceCard** (con todos sus estados) e ítem de dispositivo de la barra lateral.
- **Estados y utilidades:** EmptyState, Skeleton, Checklist/Stepper animado, ítem de la paleta de comandos, indicador de atajo (Kbd) y marco de vista previa de hoja.

## 8. Movimiento e interacción (especificación obligatoria)
La animación debe **comunicar** (estado, causa y efecto, continuidad espacial), nunca decorar por decorar. Debe sentirse nativa de macOS: rápida, física e interrumpible.

**Reglas:**
1. **La frecuencia decide.**
   - Acciones de teclado y acciones que se repiten cientos de veces (abrir o cerrar la paleta ⌘K, navegar listas con las flechas, cambiar de pestaña con un atajo): **sin animación**, o 100 ms o menos y solo de opacidad.
   - Eventos ocasionales (conectar un disco, abrir una hoja, toasts): animación estándar.
   - Eventos raros (primer arranque, prueba completada): pueden tener un toque de deleite.
2. Anima solo `transform` y `opacity`. Se permite `filter: blur` de 8 px o menos en casos puntuales. Nunca animes ancho, alto ni márgenes directamente; usa técnicas FLIP o de escala.
3. Nada aparece desde `scale(0)`: las entradas parten de `scale(0.96)` con `opacity: 0`.
4. Usa curvas personalizadas y **nunca `ease-in`** en la UI. Las salidas son ~30 % más rápidas que las entradas.
5. Todo debe ser **interrumpible**: usa transiciones o springs que partan del valor actual.
6. Los popovers y menús escalan desde su disparador (`transform-origin` en el trigger). Los diálogos, desde el centro.
7. Los botones y tarjetas pulsables se reducen a `scale(0.97)` al presionar (100–120 ms). El hover solo aplica con `(hover: hover) and (pointer: fine)`.
8. Tooltips: el primero aparece con retardo (~500 ms); los siguientes aparecen al instante mientras el usuario recorre la barra.
9. Consistencia espacial: lo que entra por un lado sale por el mismo.

**Tokens.** Propón los valores finales y documéntalos. Punto de partida:
- **Duraciones:**
  - `--dur-press: 120ms`
  - `--dur-fast: 160ms` (hover y tooltip)
  - `--dur-base: 220ms` (menús, pestañas y popovers)
  - `--dur-moderate: 320ms` (hojas, cajones y cambio de vista)
  - `--dur-data: 900ms` (barrido inicial de anillos y gráficos)
- **Curvas:**
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
- **Springs** (para layout y elementos compartidos): por defecto sin rebote (`bounce 0`, `duration ≈ 0.35–0.4 s`). Un rebote leve (`bounce ≤ 0.2`) solo después de gestos con inercia, como arrastrar y soltar.
- **Escalonado (stagger):** 40 ms entre elementos, con un máximo de 6 elementos. Nunca bloquea la interacción.

**Coreografías que debes prototipar (todas):**
1. **Arranque:** la barra lateral y el contenido aparecen con opacidad y un desplazamiento de 8 px. Las tarjetas entran escalonadas. Los anillos barren de 0 a su valor con un contador numérico sincronizado (solo la primera vez).
2. **Disco conectado:**
   - Aparece el toast "Disco conectado · Samsung 990 PRO 2TB · Thunderbolt".
   - La tarjeta nueva "se materializa" (opacidad, `scale 0.96→1` y blur de 8→0 px) mientras las demás se reacomodan con un spring de layout.
   - La tarjeta aparece primero en estado "identificando" y pasa al contenido con un crossfade.
   - El ítem entra en la barra lateral.
3. **Disco desconectado o expulsado:**
   - La tarjeta se desatura y muestra "Desconectado" durante ~1.2 s.
   - Después sale (opacidad y `scale 0.98`) y la cuadrícula se reacomoda.
   - Si su detalle estaba abierto, aparece el banner "El disco se desconectó · mostrando los últimos datos leídos".
4. **Abrir un disco:** transición de elemento compartido. La tarjeta se transforma en el encabezado del detalle (el anillo viaja a su nueva posición) y el resto hace un crossfade. Volver recorre exactamente el camino inverso.
5. **Pestañas:** el indicador se desliza con un spring. El contenido cambia con un crossfade y un desplazamiento de 6–8 px en la dirección del orden de las pestañas. Con atajo de teclado, el cambio es instantáneo.
6. **Actualizar datos:** el ícono gira una vez. Los valores que cambiaron interpolan del valor anterior al nuevo y muestran un resaltado breve de fondo que se desvanece (600 ms).
7. **Gráfico de temperatura en vivo:** el trazo avanza con suavidad, sin redibujos bruscos. Al cruzar un umbral, el segmento cambia de color y el badge de temperatura hace un solo pulso.
8. **Prueba en curso:** el progreso avanza de forma continua (lineal). La velocidad y el tiempo restante cambian sin que el texto cambie de ancho (números tabulares). Hay un latido sutil en el indicador de actividad y un mini indicador persistente en la barra lateral.
9. **Prueba completada:** el anillo se completa y se transforma en ✓ (éxito) o en un ícono de alerta (con errores). Hace un solo pulso de brillo y se envía una notificación del sistema.
10. **Consola:** el cajón sube desde abajo (`--ease-drawer`, 320 ms) y se redimensiona arrastrando. Las líneas nuevas entran con un fundido de 120 ms.
11. **Toasts:** entran desde arriba a la derecha y se apilan. Se descartan deslizándolos, y el temporizador se pausa con el hover.
12. **Diálogos y hojas:** el diálogo entra con `scale 0.96→1` y opacidad, y el fondo se atenúa. La hoja baja desde el borde superior de la ventana, al estilo de macOS.
13. **Cambio de tema:** crossfade de 250 ms, sin destello.
14. **Generar reporte:**
    - La checklist de pasos se anima.
    - La hoja de vista previa "sube" como papel: 24 px, opacidad y una sombra que crece.
    - El botón de exportar se transforma en "Guardado ✓ · Mostrar en Finder".
15. **Estado vacío:** pulso de "escuchando" muy sutil, lento y de bajo contraste.

**Accesibilidad del movimiento:**
- Con `prefers-reduced-motion: reduce`, sustituye los desplazamientos, escalas, blur y springs por fundidos de 150 ms. Los anillos y gráficos aparecen directamente en su valor final y el pulso del estado vacío se detiene.
- Soporta también `prefers-reduced-transparency` (materiales sólidos) y `prefers-contrast: more` (bordes definidos).

## 9. Interacción, teclado y accesibilidad
- **Atajos:**
  - ⌘K: paleta de comandos.
  - ⌘R: re-escanear o actualizar.
  - ⌘E: generar reporte.
  - ⌘1…⌘7: pestañas.
  - ⌘J: consola.
  - ⌘,: ajustes.
  - Esc: cerrar.
  - ↑/↓: navegar entre discos.
  - Enter: abrir.
- **Menús contextuales** (clic derecho) en tarjetas y filas: copiar valor, copiar comando, generar reporte y expulsar.
- **Copiar:** todo valor técnico se puede copiar. Los identificadores largos se truncan al centro y muestran el valor completo en un tooltip.
- **Accesibilidad:**
  - Foco visible y consistente.
  - Navegación completa por teclado.
  - Roles y etiquetas ARIA.
  - `aria-live` para el progreso de las pruebas y los avisos de conexión.
  - Contraste WCAG AA como mínimo (texto y elementos de estado) en ambos temas.
- **Tono del copy:** claro, sereno y específico. Explica la consecuencia y el siguiente paso. Nada de alarmismo, salvo en el estado Crítico ("Respalda tus datos lo antes posible").

## 10. Datos mock (úsalos tal cual, con las mismas cifras en todas las pantallas)
1. **Samsung SSD 990 PRO 2TB** · `disk4`
   - Conexión: Thunderbolt 5 · PCIe Gen4 ×4.
   - Veredicto: **Óptimo** · vida útil **98 %**.
   - Uso: usado 2 % · 31.64 TB escritos · 24.68 TB leídos · 2,164 h (≈90 días) · 318 ciclos.
   - Integridad: repuesto 100 % (umbral 10 %) · 0 errores de medios · 0 entradas en el log · 27 apagados inseguros.
   - Temperatura: 41 °C (sensores 41/52 °C; umbrales 82/85 °C).
   - Firmware 4B2QJXD7 · NVMe 2.0.
2. **WD_BLACK SN850X 1TB** · `disk6`
   - Conexión: USB4 40 Gb/s (ASM2464PD) · PCIe Gen4 ×4.
   - Veredicto: **Bueno** · vida útil **58 %**.
   - Uso: usado 42 % · 312.4 TB escritos · 9,870 h.
   - Integridad: repuesto 100 % · 0 errores de medios · 211 apagados inseguros (nota).
   - Temperatura: 67 °C (umbrales 84/88 °C), con 38 min históricos sobre la temperatura de advertencia (nota térmica).
3. **Kingston KC3000 1TB** · `disk8`
   - Conexión: Thunderbolt 4 · PCIe Gen3 ×4.
   - Veredicto: **Atención** · vida útil **12 %**.
   - Uso: usado 88 % · 704.2 TB escritos · 14,322 h.
   - Integridad: 3 errores de medios · repuesto 97 % (umbral 10 %).
   - Temperatura: 52 °C.
4. **SK hynix Platinum P41 2TB** · `disk5`
   - Conexión: Thunderbolt 3 · PCIe Gen3 ×4.
   - Veredicto: **Crítico** · vida útil **9 %**.
   - Advertencia crítica 0x05 (repuesto bajo el umbral + fiabilidad degradada).
   - Uso: usado 91 % · 1,352 TB escritos · 21,870 h.
   - Integridad: repuesto 4 % (umbral 10 %) · 37 errores de medios · 1,284 entradas en el log.
   - Temperatura: 49 °C.
5. **Crucial P3 Plus 4TB** · `disk7`
   - Conexión: USB 3.2 Gen 2 (puente Realtek RTL9210B).
   - Veredicto: **Sin datos**.
   - Solo se conocen el nombre y la capacidad (4.0 TB); SMART no está disponible por USB en macOS.
6. **APPLE SSD AP1024Z** · `disk0`
   - Conexión: Interno (Apple Fabric).
   - Veredicto: **Óptimo** · vida útil **99 %**.
   - Uso: usado 1 % · 7.83 TB escritos · 4.85 TB leídos · 228 h · 139 ciclos · 9 apagados inseguros.
   - Integridad: repuesto 100 % (umbral 99 %).
   - Log de errores no disponible (lectura parcial, código de salida 4). Autoprueba no soportada.
   - Temperatura: 37 °C. Sin umbrales de temperatura, así que usa los estimados de 70/80 °C.

**Escenarios de prueba mock:**
- **Escaneo completo del disco 1:** 11 min 38 s · promedio de 2,870 MB/s (mínimo 2,410 / máximo 3,050) · temperatura máxima 58 °C · 0 errores → Aprobado.
- **Escaneo del disco 4:**
  - 12 zonas ilegibles, por ejemplo LBA 1,204,518,912–1,204,520,959.
  - La velocidad cae a ~40 MB/s en esas zonas.
  - Los errores de medios pasan de 37 a 49 después de la prueba.
  - Resultado: Con errores.

Extracto del JSON (`smartctl -x -j disk4`) para las vistas JSON y Consola:
```json
{
  "smartctl": { "version": [7, 5], "platform_info": "Darwin 27.0.0 arm64", "exit_status": 0 },
  "device": { "name": "disk4", "type": "nvme", "protocol": "NVMe" },
  "model_name": "Samsung SSD 990 PRO 2TB",
  "serial_number": "S7DNNJ0W••••••",
  "firmware_version": "4B2QJXD7",
  "nvme_pci_vendor": { "id": 5197, "subsystem_id": 5197 },
  "nvme_version": { "string": "2.0", "value": 131072 },
  "user_capacity": { "blocks": 3907029168, "bytes": 2000398934016 },
  "smart_status": { "passed": true, "nvme": { "value": 0 } },
  "nvme_smart_health_information_log": {
    "critical_warning": 0, "temperature": 41, "available_spare": 100,
    "available_spare_threshold": 10, "percentage_used": 2,
    "data_units_read": 48211923, "data_units_written": 61802245,
    "host_reads": 512349871, "host_writes": 901234567,
    "controller_busy_time": 1432, "power_cycles": 318, "power_on_hours": 2164,
    "unsafe_shutdowns": 27, "media_errors": 0, "num_err_log_entries": 0,
    "warning_temp_time": 0, "critical_comp_time": 0, "temperature_sensors": [41, 52]
  },
  "temperature": { "current": 41 },
  "spare_available": { "current_percent": 100, "threshold_percent": 10 },
  "endurance_used": { "current_percent": 2 },
  "power_on_time": { "hours": 2164 },
  "power_cycle_count": 318
}
```
Una "data unit" equivale a 512,000 bytes: 61,802,245 × 512,000 = 31.64 TB.

**Simulaciones dentro del prototipo:**
- La temperatura varía ±1 °C cada 2 s.
- El progreso de las pruebas va acelerado: 1 min real equivale a 10 min simulados.
- Botones para simular conexión y desconexión.

✂ ─── FIN DE LA PARTE 3 DE 4 ───

## 11. Requisitos técnicos del prototipo
- **HTML + CSS + JavaScript vanilla**, sin build ni frameworks.
- Debe abrirse con **doble clic** (`file://`). Por eso usa `<script>` clásicos: nada de ES modules ni `fetch` de archivos locales.
- Sin dependencias de red. Los íconos van en un sprite SVG local.
- **Todos** los valores visuales salen de tokens: CSS custom properties en `tokens.css`, con tema claro y oscuro mediante `[data-theme]` y `prefers-color-scheme`. Ningún color ni medida "mágica" suelta en los componentes.
- Clases con prefijo y nomenclatura por componente (por ejemplo, `.hdi-device-card` y `.hdi-device-card__metric`), más los atributos `data-component`, `data-variant` y `data-state` en la raíz de cada componente.
- Antes de cada componente, un comentario como este: `<!-- @component DeviceCard | variants: grid, list | states: identifying, optimal, good, warning, critical, nodata, disconnected, selected -->`.
- Una ruta por hash para cada pantalla y pestaña: `#/onboarding`, `#/devices`, `#/device/disk4/overview`, `#/device/disk4/tests`, `#/reports`, `#/reports/new`, `#/history`, `#/history/compare`, `#/settings`, etc.
- **Panel de escenarios.** Es solo para el prototipo; se abre con `Shift + D` o con un botón discreto. Permite:
  - Cambiar de escenario: Sin discos · Cargando · 1 disco óptimo · 6 discos mixtos (los mocks) · smartctl no instalado · Lectura parcial · Prueba en curso · Prueba completada OK · Prueba con errores · Desconexión durante una prueba · Reporte generándose.
  - Simular una conexión o desconexión.
  - Cambiar entre tema claro y oscuro.
  - Activar reducir movimiento y reducir transparencia.
  - Cambiar el fondo de escritorio entre claro y oscuro.
  - Ajustar la velocidad global de animación (1×, 0.5×, 0.25×).
- Anima con transiciones CSS o con la Web Animations API. Implementa los springs en JS ligero sin librerías, o documéntalos como spring (con sus parámetros) si los aproximas con curvas. Todas las duraciones y curvas referencian los tokens de movimiento.

## 12. Entregables y estructura de archivos
```
prototype-design/
├── index.html              ← prototipo navegable completo (la app)
├── design-system.html      ← fundamentos, componentes, estados y demos de movimiento
├── report-template.html    ← plantilla del reporte (Carta y A4, lista para imprimir)
├── css/
│   ├── tokens.css          ← TODOS los tokens (oscuro + claro)
│   ├── base.css            ← reset, tipografía, utilidades
│   ├── components.css      ← estilos de componentes
│   └── motion.css          ← transiciones, keyframes y reduced-motion
├── js/
│   ├── app.js              ← router por hash, estado e interacciones
│   ├── mock-data.js        ← datos mock (con la forma real del JSON de smartctl)
│   ├── scenarios.js        ← panel de escenarios y simulaciones
│   └── motion.js           ← utilidades de animación y springs
├── assets/
│   ├── icons.svg           ← sprite de íconos
│   ├── app-icon.svg        ← ícono de la app (1024 × 1024)
│   └── illustrations/      ← estado vacío, logo, etc.
├── tokens.json             ← tokens en formato W3C Design Tokens (DTCG)
└── SPEC.md                 ← especificación (ver abajo)
```
`SPEC.md` debe contener:
- El mapa de pantallas y sus rutas.
- El inventario de componentes, con sus variantes, estados y dónde se usa cada uno.
- La tabla de tokens.
- El **catálogo de animaciones**: disparador, propiedades, duración, curva o spring, y versión reduced-motion de cada una.
- Los atajos de teclado.
- Las decisiones de diseño y su razón.
- El copy clave.

Si tu entorno solo genera un proyecto React/Tailwind o un único archivo, mantén la misma organización lógica y entrega de todos modos `tokens.css`, `tokens.json` y `SPEC.md`.

## 13. Criterios de aceptación
- Todas las pantallas y estados de la sección 6 existen y se puede navegar a ellos. Todos los escenarios del panel funcionan.
- Ambos temas están completos, con contraste AA, foco visible y navegación por teclado.
- Las 15 coreografías de la sección 8 están implementadas y documentadas, y la versión reduced-motion funciona.
- La consistencia es total: cada pantalla usa solo componentes y tokens del sistema de diseño.
- Se ve igual en Safari y en Chrome a 1512 × 982, y funciona a 1100 × 720.
- Los datos mock coinciden en todas las pantallas: las mismas cifras en la tarjeta, el detalle, el historial y el reporte.

**Orden de trabajo:**
1. Sistema de diseño: tokens y componentes base.
2. Dispositivos.
3. Detalle, con todas sus pestañas.
4. Pruebas.
5. Reportes y su plantilla.
6. Historial.
7. Ajustes.
8. Paleta de comandos.
9. Coreografías y panel de escenarios.

Al terminar, revisa tu entrega contra la sección 13 y enumera lo que quede pendiente.
````

---

## Prompts de seguimiento

Úsalos en la misma conversación de la herramienta, después del prompt maestro.

**Prompt 0: explorar direcciones (opcional; pégalo al final del mismo mensaje que el prompt maestro o que su última parte)**
```text
Antes de construir todo, propón 3 direcciones visuales claramente distintas (paleta con acento, uso de materiales, densidad, tratamiento de gráficos y del anillo de vida útil), aplicadas solo a la pantalla Dispositivos y al Resumen del disco "Samsung SSD 990 PRO 2TB", en tema oscuro, a 1512 × 982. Explica en 3 líneas la intención de cada una. No avances con el resto hasta que elija una.
```

**Prompt 1: completar la cobertura**
```text
Compara lo entregado con las secciones 6, 7 y 13 del encargo. Haz una tabla de cobertura (pantalla / estado / componente → hecho o pendiente) y completa todo lo pendiente. Agrega una página índice #/index con enlaces a cada pantalla, pestaña y escenario.
```

**Prompt 2: pulir el movimiento**
```text
Revisa cada una de las 15 coreografías de la sección 8 a 0.25× de velocidad y corrige:
- elementos que aparecen de la nada;
- curvas ease-in;
- salidas más lentas que las entradas;
- animaciones en acciones de teclado;
- saltos de layout;
- números que cambian de ancho;
- transiciones que no se pueden interrumpir.
Verifica la versión reduced-motion de cada una. Actualiza el catálogo de animaciones de SPEC.md con los valores finales (duración, curva o spring y propiedades).
```

**Prompt 3: paridad con Safari/WebKit**
```text
Revisa el prototipo en Safari y corrige cualquier diferencia con Chrome: backdrop-filter (prefijo -webkit-), rendimiento del blur, fuentes del sistema, scrollbars, :focus-visible, SVG y @starting-style. Si algún blur afecta la fluidez, redúcelo y documéntalo.
```

**Prompt 4: datos y copy**
```text
Verifica que las cifras de los 6 discos sean idénticas en todas las pantallas (tarjeta, barra lateral, detalle, historial, reporte) y que el veredicto de cada uno cumpla las reglas de la sección 2.8. Revisa ortografía, acentos, el formato de números es-MX y que el tono siga la sección 9.
```

**Prompt 5: el reporte imprimible**
```text
Refina report-template.html para Carta y A4 con @page: márgenes, encabezado y pie repetidos, "Página X de Y", sin cortar tablas ni gráficos entre páginas, y legible en escala de grises. Incluye dos ejemplos completos: el disco Óptimo (Samsung) y el Crítico (SK hynix) con su prueba con errores.
```

**Prompt 6: la entrega final**
```text
Prepara la entrega con la estructura exacta de la sección 12. Verifica que index.html, design-system.html y report-template.html abren con doble clic, sin servidor ni red. Completa SPEC.md y enumera los archivos entregados, con una línea de descripción para cada uno.
```

---

## Checklist de aceptación (antes de copiar a `prototype-design/`)

- [ ] `index.html` abre con doble clic y navega a todas las pantallas (idealmente con un índice `#/index`).
- [ ] `design-system.html` documenta los tokens, todos los componentes con sus estados y las demos de movimiento.
- [ ] `report-template.html` existe en Carta y A4 y se imprime bien en escala de grises.
- [ ] Existen `css/tokens.css`, `tokens.json` y `SPEC.md` (con el catálogo de animaciones).
- [ ] El panel de escenarios funciona: vacío, cargando, 6 discos, smartctl ausente, lectura parcial, las pruebas (en curso, OK, con errores, desconexión) y la generación de reporte.
- [ ] Tema oscuro y claro completos; reducir movimiento y reducir transparencia funcionan.
- [ ] Se ve igual en Safari que en Chrome.
- [ ] Las cifras de los discos coinciden en todas las pantallas.
- [ ] Incluye el ícono de la app (`assets/app-icon.svg`).

Cuando esté listo, colócalo en `prototype-design/` y pide: **"Inicia la Fase 1 del plan"**.
