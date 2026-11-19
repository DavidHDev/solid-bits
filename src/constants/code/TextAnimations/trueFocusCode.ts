import code from '@content/TextAnimations/TrueFocus/TrueFocus.tsx?raw';
import css from '@content/TextAnimations/TrueFocus/TrueFocus.css?raw';
import { createCodeObject } from '@/types/code';

export const trueFocus = createCodeObject(code, 'TextAnimations/TrueFocus', {
  dependencies: 'motion',
  usage: `import TrueFocus from './TrueFocus';

<TrueFocus
  sentence="True Focus"
  manualMode={false}
  focusStyle="brackets"
  easing="smooth"
  order="sequential"
  blurAmount={5}
  focusScale={1}
  unfocusedOpacity={1}
  borderColor="#0aa0ef"
  cornerSize={16}
  borderWidth={3}
  animationDuration={0.5}
  pauseBetweenAnimations={1}
/>`,
  css
});
