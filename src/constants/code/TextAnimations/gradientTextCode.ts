import code from '@content/TextAnimations/GradientText/GradientText.tsx?raw';
import css from '@content/TextAnimations/GradientText/GradientText.css?raw';
import { createCodeObject } from '@/types/code';

export const gradientText = createCodeObject(code, 'TextAnimations/GradientText', {
  dependencies: '',
  usage: `import GradientText from './GradientText';

<GradientText
  colors={['#0aa0ef', '#6ec9f7', '#b4d4ec']}
  animationSpeed={8}
  variant="flow"
  glow={0.4}
>
  Add a splash of color!
</GradientText>`,
  css
});
