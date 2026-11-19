import code from '@content/Animations/AnimatedContent/AnimatedContent.tsx?raw';
import { createCodeObject } from '@/types/code';

export const animatedContent = createCodeObject(code, 'Animations/AnimatedContent', {
  dependencies: 'gsap',
  usage: `import AnimatedContent from './AnimatedContent';

<AnimatedContent
  distance={100}
  direction="vertical"
  duration={0.8}
  ease="power3.out"
  blur={0}
  stagger={0.08}
  threshold={0.1}
>
  <h2>Ship it before lunch</h2>
  <p>Every child animates in turn.</p>
</AnimatedContent>`
});
