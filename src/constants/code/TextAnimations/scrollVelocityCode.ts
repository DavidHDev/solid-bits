import code from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.tsx?raw';
import css from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.css?raw';
import { createCodeObject } from '@/types/code';

export const scrollVelocity = createCodeObject(code, 'TextAnimations/ScrollVelocity', {
  dependencies: 'motion',
  usage: `import ScrollVelocity from './ScrollVelocity';

<ScrollVelocity
  texts={['Solid Bits', 'Scroll Down']}
  velocity={100}
  skewWithVelocity={16}
  scaleWithVelocity={0.18}
  draggable
  fontSize={104}
  fontWeight={500}
  className="custom-scroll-text"
/>`,
  css
});
