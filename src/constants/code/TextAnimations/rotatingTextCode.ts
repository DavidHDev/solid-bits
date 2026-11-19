import code from '@content/TextAnimations/RotatingText/RotatingText.tsx?raw';
import css from '@content/TextAnimations/RotatingText/RotatingText.css?raw';
import { createCodeObject } from '@/types/code';

export const rotatingText = createCodeObject(code, 'TextAnimations/RotatingText', {
  dependencies: 'motion',
  usage: `import RotatingText from './RotatingText';

<RotatingText
  texts={['Solid', 'Bits', 'Is', 'Cool!']}
  effect="slide"
  direction="up"
  highlight={true}
  highlightColor="#6ec9f7"
  staggerFrom="last"
  staggerDuration={0.025}
  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
  rotationInterval={2000}
/>`,
  css
});
