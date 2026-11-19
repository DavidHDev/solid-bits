import code from '@content/Backgrounds/GradientASCII/GradientASCII.tsx?raw';
import css from '@content/Backgrounds/GradientASCII/GradientASCII.css?raw';
import { createCodeObject } from '@/types/code';

export const gradientASCII = createCodeObject(code, 'Backgrounds/GradientASCII', {
  dependencies: '',
  usage: `import GradientASCII from './GradientASCII';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientASCII
    colors={['#1462c8', '#f6f8ff', '#a5d8ff', '#38bdf8']}
    shape="horizon"
    characters=" =+xX0S8#@"
    cellSize={18}
    density={0.8}
  />
</div>`,
  css
});
