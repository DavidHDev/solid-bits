import code from '@content/TextAnimations/StrokeText/StrokeText.tsx?raw';
import css from '@content/TextAnimations/StrokeText/StrokeText.css?raw';
import { createCodeObject } from '@/types/code';

export const strokeText = createCodeObject(code, 'TextAnimations/StrokeText', {
  dependencies: 'gsap',
  usage: `import StrokeText from './StrokeText';

<StrokeText
  text="Draw Attention"
  strokeColor="#6ec9f7"
  strokeStyle="solid"
  strokeWidth={1.4}
  dashLength={10}
  drawDuration={1.6}
  fillDelay={0.2}
  stagger={0.05}
  ease="power2.out"
  trigger="mount"
  fillMode="wipe"
  wipeFrom="left"
  fontSize={128}
  fontWeight={500}
  letterSpacing={-4}
  marching={false}
  hoverRedraw={true}
  shadow={false}
/>`,
  css
});
