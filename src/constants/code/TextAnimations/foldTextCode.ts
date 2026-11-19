import code from '@content/TextAnimations/FoldText/FoldText.tsx?raw';
import css from '@content/TextAnimations/FoldText/FoldText.css?raw';
import { createCodeObject } from '@/types/code';

export const foldText = createCodeObject(code, 'TextAnimations/FoldText', {
  dependencies: 'gsap',
  usage: `import FoldText from './FoldText';

<FoldText
  text="Launch with clarity"
  foldStyle="paper"
  splitBy="char"
  hinge="top"
  trigger="scroll"
  foldAngle={92}
  duration={0.65}
  stagger={0.045}
  staggerFrom="start"
  ease="power3.out"
  loopDelay={1.4}
  hoverRefold={true}
  refoldRadius={140}
  refoldAngle={45}
  perspective={700}
  creaseShading={0.55}
  fontSize="clamp(3rem, 10vw, 7rem)"
  fontWeight={500}
/>`,
  css
});
