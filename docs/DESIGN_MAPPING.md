# Mapeo prototipo → código (Fase 1)

El prototipo llegó como *Design Component*: una plantilla HTML con estilos en línea que solo leen tokens (`HealthDiskInfo.dc.html`), una clase de lógica que construye el view-model y un runtime basado en React (`support.js`). Como el prototipo ya es React por dentro, la implementación lo traduce casi 1:1 en lugar de reinterpretarlo.

## Estrategia

| Pieza del prototipo | Implementación | Cómo se obtuvo |
|---|---|---|
| Plantilla (`<x-dc>`, `{{ }}`, `<sc-if>`, `<sc-for>`, `style-hover`) | `src/ui/screens/*.tsx` (25 componentes) | `scripts/dc2tsx.mjs` (traducción automática, luego código fuente) |
| Lógica (`<script data-dc-script>`, `renderVals`) | `src/ui/AppController.tsx` | Port literal + ganchos para la app real |
| Datos simulados (`js/mock-data.js`) | `src/ui/mock/mockData.ts` (modo mock) | `scripts/sync-design.mjs` |
| Datos reales | `src/ui/RealAppController.tsx` + `src/domain/*` + núcleo Rust | Nuevo; misma forma de datos que el mock |
| Tokens (`css/tokens.css`) | `src/design-system/tokens.css` (copia 1:1) | `sync-design` |
| Estilos globales (`<helmet>`) | `src/design-system/global.css` | Copia + reglas de ventana nativa |
| Movimiento (`js/motion.js`) | `src/ui/runtime/motion.ts` | Port 1:1 a TS |
| Íconos (`js/icons.js`) | `src/design-system/icons.svg` (sprite en línea) | `sync-design` |
| Plantilla del reporte (`Report Template.dc.html`) | `src/report/ReportTemplate.tsx` + `ReportController.tsx` | `dc2tsx` + port de la lógica |
| `<doc-page>` (`doc-page.js`) | `src/report/vendor/doc-page.js` | Copia sin cambios |

`css()` y `pc()` (`src/ui/runtime/styles.ts`) reproducen exactamente cómo el runtime del prototipo convierte los estilos en línea y las pseudo-clases (`:hover`, `:active`, `:focus` con `!important`).

## Pantallas → componentes

| Ruta | Componente |
|---|---|
| `#/onboarding` | `OnboardingScreen` |
| `#/devices` | `DevicesScreen` |
| `#/device/:id/:tab` | `DeviceDetailScreen` + `OverviewTab`, `SmartTab`, `TemperatureTab`, `TestsTab`, `LogsTab`, `IdentityTab`, `ConsoleTab` |
| `#/reports`, `#/reports/new` | `ReportsScreen`, `ReportBuilderScreen` |
| `#/history`, `#/history/compare` | `HistoryScreen`, `CompareScreen` |
| `#/settings` | `SettingsScreen` |
| Capas | `Sidebar`, `Toolbar`, `ConsoleDrawer`, `ToastStack`, `DialogLayer`, `CommandPalette`, `ContextMenu`, `Tooltip`, `ScenarioPanel` (solo mock) |

## Coreografías

Las 15 coreografías del catálogo (`prototype-design/SPEC.md` §5) usan el mismo código del prototipo (`motion.ts` + los disparadores de `AppController`), así que conservan duraciones, curvas y springs. La velocidad global (`--motion-k`) y el movimiento reducido funcionan igual.

## Escenarios del prototipo

`pnpm dev:web` ejecuta el prototipo traducido con sus datos simulados y el panel de escenarios (⇧D): es la referencia para la revisión de paridad.

## Paridad visual

`pnpm parity` compara la app (modo mock) con el prototipo en WebKit a 1512 × 982, en tema oscuro y claro. Resultado actual: 0.00–0.23 % de píxeles distintos en las 16 pantallas × 2 temas. La diferencia residual es la temperatura simulada, que varía entre cargas.
