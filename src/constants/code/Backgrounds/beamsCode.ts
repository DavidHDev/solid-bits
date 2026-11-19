import code from '@content/Backgrounds/Beams/Beams.tsx?raw';
import css from '@content/Backgrounds/Beams/Beams.css?raw';
import { createCodeObject } from '@/types/code';

export const beams = createCodeObject(code, 'Backgrounds/Beams', {
  dependencies: '',
  usage: `import Beams from './Beams';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Beams
    color="#ffffff"
    beamWidth={140}
    rotation={30}
    speed={1}
    glow={0.6}
  />
</div>`,
  css
});
