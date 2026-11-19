import code from '@content/Animations/PixelTransition/PixelTransition.tsx?raw';
import css from '@content/Animations/PixelTransition/PixelTransition.css?raw';
import { createCodeObject } from '@/types/code';

export const pixelTransition = createCodeObject(code, 'Animations/PixelTransition', {
  dependencies: '',
  usage: `import PixelTransition from './PixelTransition';

<PixelTransition
  firstContent={
    <img
      src="/assets/demo/day-portrait.webp"
      alt=""
      style={{ width: '100%', height: '100%', 'object-fit': 'cover' }}
    />
  }
  secondContent={
    <img
      src="/assets/demo/night-portrait.webp"
      alt=""
      style={{ width: '100%', height: '100%', 'object-fit': 'cover' }}
    />
  }
  pixelColor="#ffffff"
  mosaic={0}
  gridSize={10}
  pixelShape="square"
  gap={0}
  pattern="random"
  pixelAnimation="pop"
  randomness={0.3}
  animationStepDuration={0.4}
  fps={0}
  trigger="hover"
  once={false}
  aspectRatio="125%"
  style={{ width: '300px' }}
/>`,
  css
});
