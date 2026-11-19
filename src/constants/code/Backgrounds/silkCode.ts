import code from '@content/Backgrounds/Silk/Silk.tsx?raw';
import css from '@content/Backgrounds/Silk/Silk.css?raw';
import { createCodeObject } from '@/types/code';

export const silkCode = createCodeObject(code, 'Backgrounds/Silk', {
  dependencies: '',
  usage: `import Silk from './Silk';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Silk
    color="#0aa0ef"
    sheenColor="#ffffff"
    speed={5}
    scale={1}
    rotation={0}
    sheen={0.5}
    depth={0.5}
    glow={0.3}
    noiseIntensity={1.5}
    mouseInteraction
    clickRipple
    intro
  />
</div>`,
  css
});
