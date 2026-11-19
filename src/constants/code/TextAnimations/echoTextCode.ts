import code from '@content/TextAnimations/EchoText/EchoText.tsx?raw';
import css from '@content/TextAnimations/EchoText/EchoText.css?raw';
import { createCodeObject } from '@/types/code';

export const echoText = createCodeObject(code, 'TextAnimations/EchoText', {
  dependencies: '',
  usage: `import EchoText from './EchoText';

<EchoText
  text="Motion Echo"
  echoes={12}
  lag={0.24}
  offset={36}
  direction="right"
  fade={0.72}
  blur={3}
  tint="#7dd3fc"
  echoStyle="solid"
  echoScale={1}
  mode="both"
  trail="pointer"
  clickBurst
  cursorRadius={320}
  duration={900}
  ease="ease-out"
  fontSize="clamp(3rem, 9vw, 7rem)"
  fontWeight={500}
/>`,
  css
});
