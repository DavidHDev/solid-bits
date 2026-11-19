import code from '@content/Backgrounds/Aurora/Aurora.tsx?raw';
import css from '@content/Backgrounds/Aurora/Aurora.css?raw';
import { createCodeObject } from '@/types/code';

export const aurora = createCodeObject(code, 'Backgrounds/Aurora', {
  dependencies: '',
  usage: `import Aurora from './Aurora';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Aurora
    colorStops={['#0aa0ef', '#7cff67', '#0aa0ef']}
    amplitude={1}
    blend={0.5}
    height={0.45}
    speed={1}
    glow={0.6}
  />
</div>`,
  css
});
