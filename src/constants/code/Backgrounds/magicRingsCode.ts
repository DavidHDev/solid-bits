import code from '@content/Backgrounds/MagicRings/MagicRings.tsx?raw';
import css from '@content/Backgrounds/MagicRings/MagicRings.css?raw';
import { createCodeObject } from '@/types/code';

export const magicRings = createCodeObject(code, 'Backgrounds/MagicRings', {
  dependencies: '',
  usage: `import MagicRings from './MagicRings';

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <MagicRings
    color="#6ec9f7"
    colorTwo="#0aa0ef"
    motion="pulse"
    ringCount={6}
    speed={1}
    lineThickness={2}
    glow={1}
    hoverScale={1.2}
    clickBurst={true}
  />
</div>`,
  css
});
