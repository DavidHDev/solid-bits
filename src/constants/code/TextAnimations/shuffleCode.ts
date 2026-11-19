import code from '@content/TextAnimations/Shuffle/Shuffle.tsx?raw';
import css from '@content/TextAnimations/Shuffle/Shuffle.css?raw';
import { createCodeObject } from '@/types/code';

export const shuffle = createCodeObject(code, 'TextAnimations/Shuffle', {
  dependencies: 'gsap',
  usage: `import Shuffle from './Shuffle';

<Shuffle
  text="Hello World"
  effect="slide"
  shuffleDirection="right"
  duration={0.35}
  animationMode="evenodd"
  shuffleTimes={1}
  ease="power3.out"
  stagger={0.03}
  threshold={0.1}
  triggerOnce={true}
  triggerOnHover={true}
  hoverRadius={0}
  motionBlur={false}
  respectReducedMotion={true}
/>`,
  css
});
