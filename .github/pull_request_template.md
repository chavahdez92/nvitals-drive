## Qué cambia y por qué

<!-- Enlaza el issue relacionado: Closes #… -->

## Cómo se probó

- [ ] `pnpm check`
- [ ] `pnpm lint:rust` y `pnpm fmt:rust`
- [ ] `pnpm parity` (si cambia la interfaz)
- [ ] Probado en: <!-- macOS / Windows / Linux, con qué disco -->

## Checklist

- [ ] Las desviaciones visibles del prototipo están en `docs/DESIGN_DEVIATIONS.md`.
- [ ] No hay operaciones que escriban en discos ni ejecución por shell.
- [ ] Los fixtures nuevos están anonimizados (`pnpm anonymize`).
- [ ] Si cambiaron dependencias: `pnpm notices`.
- [ ] Commits firmados con `git commit -s` (DCO).
