import code from '@content/Backgrounds/Orb/Orb.tsx?raw';
import css from '@content/Backgrounds/Orb/Orb.css?raw';
import { createCodeObject } from '@/types/code';

export const orb = createCodeObject(code, 'Backgrounds/Orb', {
  dependencies: '',
  usage: `import Orb from './Orb';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Orb
    colors={['#0aa0ef', '#4cc2e9', '#0771a6']}
    hoverIntensity={1}
    trail={1}
    rotateOnHover
    followCursor
  />
</div>`,
  css
});
