import code from '@content/Backgrounds/Ferrofluid/Ferrofluid.tsx?raw';
import css from '@content/Backgrounds/Ferrofluid/Ferrofluid.css?raw';
import { createCodeObject } from '@/types/code';

export const ferrofluid = createCodeObject(code, 'Backgrounds/Ferrofluid', {
  dependencies: '',
  usage: `import Ferrofluid from './Ferrofluid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Ferrofluid
    colors={['#ffffff', '#ffffff', '#ffffff']}
    spikeHeight={1}
    sharpness={2.5}
    tilt={48}
    mouseInteraction
    clickPulse
  />
</div>`,
  css
});
