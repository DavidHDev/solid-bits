import code from '@content/Components/FluidGlass/FluidGlass.tsx?raw';
import css from '@content/Components/FluidGlass/FluidGlass.css?raw';
import { createCodeObject } from '@/types/code';

export const fluidGlass = createCodeObject(code, 'Components/FluidGlass', {
  dependencies: '',
  usage: `import FluidGlass from './FluidGlass';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FluidGlass
    text="Look closer."
    src="/hero.jpg"
    shape="lens"
    size={260}
    refraction={1}
    dispersion={0.35}
    interaction="follow"
  />
</div>`,
  css
});
