import code from '@content/Backgrounds/SoftAurora/SoftAurora.tsx?raw';
import css from '@content/Backgrounds/SoftAurora/SoftAurora.css?raw';
import { createCodeObject } from '@/types/code';

export const softAurora = createCodeObject(code, 'Backgrounds/SoftAurora', {
  dependencies: '',
  usage: `import SoftAurora from './SoftAurora';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SoftAurora
    speed={0.6}
    scale={1.5}
    brightness={1}
    color1="#f7f7f7"
    color2="#6ec9f7"
    bandHeight={0.5}
    bandSpread={1}
    enableMouseInteraction
    mouseInfluence={0.25}
  />
</div>`,
  css
});
