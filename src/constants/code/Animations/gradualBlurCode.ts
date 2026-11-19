import code from '@content/Animations/GradualBlur/GradualBlur.tsx?raw';
import css from '@content/Animations/GradualBlur/GradualBlur.css?raw';
import { createCodeObject } from '@/types/code';

export const gradualBlur = createCodeObject(code, 'Animations/GradualBlur', {
  dependencies: '',
  usage: `import GradualBlur from './GradualBlur';

<section style={{ position: 'relative', height: '500px', overflow: 'hidden' }}>
  <div style={{ height: '100%', 'overflow-y': 'auto' }}>
    <Content />
  </div>

  <GradualBlur
    position="bottom"
    height="6rem"
    strength={2}
    layers={8}
    curve="linear"
    exponential
    tint="rgba(16, 17, 19, 0.6)"
    autoHide
  />
</section>`,
  css
});
