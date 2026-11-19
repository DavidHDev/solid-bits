import code from '@content/TextAnimations/GlitchText/GlitchText.tsx?raw';
import css from '@content/TextAnimations/GlitchText/GlitchText.css?raw';
import { createCodeObject } from '@/types/code';

export const glitchText = createCodeObject(code, 'TextAnimations/GlitchText', {
  dependencies: '',
  usage: `import GlitchText from './GlitchText';

<GlitchText
  mode="slices"
  trigger="always"
  speed={1}
  intensity={0.5}
  burstDuration={0.6}
  offset={10}
  skew={0}
  flicker={false}
  fontWeight={500}
  enableShadows={true}
  shadowColors={['#ff0000', '#00ffff']}
  className="custom-class"
>
  Solid Bits
</GlitchText>`,
  css
});
