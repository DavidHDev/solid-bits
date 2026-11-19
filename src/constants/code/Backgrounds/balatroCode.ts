import code from '@content/Backgrounds/Balatro/Balatro.tsx?raw';
import css from '@content/Backgrounds/Balatro/Balatro.css?raw';
import { createCodeObject } from '@/types/code';

export const balatro = createCodeObject(code, 'Backgrounds/Balatro', {
  dependencies: '',
  usage: `import Balatro from './Balatro';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Balatro
    color1="#DE443B"
    color2="#006BB4"
    color3="#162325"
    swirl={0.25}
    pixelSize={1.5}
    mouseInteraction
  />
</div>`,
  css
});
