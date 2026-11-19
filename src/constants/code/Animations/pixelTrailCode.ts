import code from '@content/Animations/PixelTrail/PixelTrail.tsx?raw';
import css from '@content/Animations/PixelTrail/PixelTrail.css?raw';
import { createCodeObject } from '@/types/code';

export const pixelTrail = createCodeObject(code, 'Animations/PixelTrail', {
  dependencies: '',
  usage: `import PixelTrail from './PixelTrail';

<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <PixelTrail
    gridSize={50}
    trailSize={0.1}
    maxAge={500}
    interpolate={5}
    color="#6ec9f7"
  />
</div>`,
  css
});
