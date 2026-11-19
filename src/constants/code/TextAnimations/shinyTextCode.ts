import code from '@content/TextAnimations/ShinyText/ShinyText.tsx?raw';
import css from '@content/TextAnimations/ShinyText/ShinyText.css?raw';
import { createCodeObject } from '@/types/code';

export const shinyText = createCodeObject(code, 'TextAnimations/ShinyText', {
  dependencies: '',
  usage: `import ShinyText from './ShinyText';

<ShinyText
  text="Shiny Text Effect"
  color="#b5b5b5"
  shineColor="#ffffff"
  speed={2}
  shineWidth={40}
  softness={0.8}
  trigger="loop"
/>`,
  css
});
