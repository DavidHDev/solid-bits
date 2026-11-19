import code from '@content/Backgrounds/SlicedWaves/SlicedWaves.tsx?raw';
import css from '@content/Backgrounds/SlicedWaves/SlicedWaves.css?raw';
import { createCodeObject } from '@/types/code';

export const slicedWaves = createCodeObject(code, 'Backgrounds/SlicedWaves', {
  dependencies: '',
  usage: `import SlicedWaves from './SlicedWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <SlicedWaves
    color1="#ffd9a8"
    color2="#6ec9f7"
    color3="#2aa0e8"
    ribbons={3}
    spacing={28}
    perspective={0.45}
    blur={0.6}
    glow={1}
    position={0.78}
    mouseInteraction={true}
  />
</div>`,
  css
});
