import code from '@content/Animations/PixelSwap/PixelSwap.tsx?raw';
import css from '@content/Animations/PixelSwap/PixelSwap.css?raw';
import { createCodeObject } from '@/types/code';

export const pixelSwap = createCodeObject(code, 'Animations/PixelSwap', {
  dependencies: '',
  usage: `import PixelSwap from './PixelSwap';

<div style={{ width: '560px' }}>
  <PixelSwap
    firstContent={
      <img
        src="/assets/demo/day-sky.webp"
        alt=""
        style={{ width: '100%', height: '100%', 'object-fit': 'cover' }}
      />
    }
    secondContent={
      <img
        src="/assets/demo/night-sky.webp"
        alt=""
        style={{ width: '100%', height: '100%', 'object-fit': 'cover' }}
      />
    }
    pattern="pointer"
    pixelSize={48}
    pixelRadius={0}
    duration={400}
    pixelDuration={350}
    randomness={0.2}
    bounce={0.3}
    trigger="hover"
    style={{ 'border-radius': '18px' }}
  />
</div>`,
  css
});
