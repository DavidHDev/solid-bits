import code from '@content/Backgrounds/PlasmaWave/PlasmaWave.tsx?raw';
import css from '@content/Backgrounds/PlasmaWave/PlasmaWave.css?raw';
import { createCodeObject } from '@/types/code';

export const plasmaWave = createCodeObject(code, 'Backgrounds/PlasmaWave', {
  dependencies: '',
  usage: `import PlasmaWave from './PlasmaWave';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PlasmaWave
    colors={['#0aa0ef', '#06B6D4']}
    speed={1}
    bend1={1}
    bend2={0.5}
    thickness={0.3}
    glow={1}
    core={0.6}
    mouseInteraction={true}
  />
</div>`,
  css
});
