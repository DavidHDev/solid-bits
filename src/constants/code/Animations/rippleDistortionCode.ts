import code from '@content/Animations/RippleDistortion/RippleDistortion.tsx?raw';
import css from '@content/Animations/RippleDistortion/RippleDistortion.css?raw';
import { createCodeObject } from '@/types/code';

export const rippleDistortion = createCodeObject(code, 'Animations/RippleDistortion', {
  dependencies: 'ogl',
  usage: `import RippleDistortion from './RippleDistortion';

<div style={{ width: '600px', height: '400px' }}>
  <RippleDistortion
    src="/hero.jpg"
    brushSize={150}
    strength={0.2}
    swirl={1}
    rings={4}
    grayscale
  />
</div>`,
  css
});
