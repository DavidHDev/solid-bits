import code from '@content/Backgrounds/Waves/Waves.tsx?raw';
import css from '@content/Backgrounds/Waves/Waves.css?raw';
import { createCodeObject } from '@/types/code';

export const waves = createCodeObject(code, 'Backgrounds/Waves', {
  dependencies: '',
  usage: `import Waves from './Waves';

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <Waves
    lineColor="#ffffff"
    spacing={10}
    amplitude={32}
    twist={1}
    speed={1}
    mouseRadius={175}
    mouseStrength={1}
  />
</div>`,
  css
});
