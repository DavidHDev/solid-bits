import code from '@content/Backgrounds/GradientWaves/GradientWaves.tsx?raw';
import css from '@content/Backgrounds/GradientWaves/GradientWaves.css?raw';
import { createCodeObject } from '@/types/code';

export const gradientWaves = createCodeObject(code, 'Backgrounds/GradientWaves', {
  dependencies: '',
  usage: `import GradientWaves from './GradientWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientWaves
    horizonColor="#0aa0ef"
    waveColor="#9fd3ff"
    crestColor="#FFFFFF"
    speed={0.4}
    amplitude={2.5}
    relief={1}
    lightAngle={120}
    mouseInteraction
    swellOnClick
  />
</div>`,
  css
});
