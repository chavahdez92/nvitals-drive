// Traducido desde prototype-design/HealthDiskInfo.dc.html con scripts/dc2tsx.mjs.
// El prototipo es la fuente de verdad visual: cualquier cambio debe mantener la paridad.
import { css, cx, pc } from '../runtime/styles';
import type { VM } from '../vm';

export function Tooltip({ vm }: { vm: VM }) {
  return (
    <>
      <div data-component="Tooltip" role="tooltip" style={css(`position:fixed;left:${vm.tip?.x ?? ''}px;top:${vm.tip?.y ?? ''}px;transform:translateX(-50%);z-index:var(--z-tooltip);max-width:320px;padding:5px 8px;border-radius:var(--r-sm);background:var(--gray-12);color:var(--gray-1);font-size:var(--type-note-size);line-height:var(--type-note-lh);pointer-events:none;box-shadow:var(--shadow-2);white-space:pre-line;text-wrap:pretty;word-break:break-word`)}>
        {vm.tip?.text}
      </div>
    </>
  );
}
