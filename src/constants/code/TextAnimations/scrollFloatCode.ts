import code from '@content/TextAnimations/ScrollFloat/ScrollFloat.tsx?raw';
import css from '@content/TextAnimations/ScrollFloat/ScrollFloat.css?raw';
import { createCodeObject } from '@/types/code';

export const scrollFloat = createCodeObject(code, 'TextAnimations/ScrollFloat', {
  dependencies: 'gsap',
  usage: `import ScrollFloat from './ScrollFloat';

<ScrollFloat
  effect="float"
  splitBy="chars"
  direction="up"
  order="start"
  fromColor="currentColor"
  animationDuration={1}
  ease="back.inOut(2)"
  scrollStart="center bottom+=50%"
  scrollEnd="bottom bottom-=40%"
  stagger={0.03}
  distance={120}
  stretch={2.3}
  smoothing={0}
>
  Solid Bits
</ScrollFloat>`,
  css
});
