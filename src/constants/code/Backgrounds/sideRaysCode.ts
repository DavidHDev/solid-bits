import code from '@content/Backgrounds/SideRays/SideRays.tsx?raw';
import css from '@content/Backgrounds/SideRays/SideRays.css?raw';
import { createCodeObject } from '@/types/code';

export const sideRays = createCodeObject(code, 'Backgrounds/SideRays', {
  dependencies: '',
  usage: `import SideRays from './SideRays';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SideRays
    rayColor1="#FFC46B"
    rayColor2="#96c8ff"
    origin="top-right"
    speed={2.5}
    intensity={2}
    spread={2}
    density={5}
    followMouse={true}
  />
</div>`,
  css
});
