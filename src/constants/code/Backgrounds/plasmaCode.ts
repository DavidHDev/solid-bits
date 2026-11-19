import code from '@content/Backgrounds/Plasma/Plasma.tsx?raw';
import css from '@content/Backgrounds/Plasma/Plasma.css?raw';
import { createCodeObject } from '@/types/code';

export const plasma = createCodeObject(code, 'Backgrounds/Plasma', {
  dependencies: '',
  usage: `import Plasma from './Plasma';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Plasma
    color="#a5aaaf"
    speed={1}
    direction="forward"
    scale={1}
    twist={1}
    softness={0.5}
    shine={1}
    mouseInteractive={true}
  />
</div>`,
  css
});
