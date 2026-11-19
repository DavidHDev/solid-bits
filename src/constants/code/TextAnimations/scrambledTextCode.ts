import code from '@content/TextAnimations/ScrambledText/ScrambledText.tsx?raw';
import css from '@content/TextAnimations/ScrambledText/ScrambledText.css?raw';
import { createCodeObject } from '@/types/code';

export const scrambledText = createCodeObject(code, 'TextAnimations/ScrambledText', {
  dependencies: 'gsap',
  usage: `import ScrambledText from './ScrambledText';

<ScrambledText
  className="scrambled-text-demo"
  effect="scramble"
  radius={100}
  strength={1}
  trail={0.6}
  duration={1.2}
  speed={0.5}
  scrambleChars=".:"
  clickBurst
  intro
>
  Lorem ipsum dolor sit amet consectetur adipisicing elit.
  Similique pariatur dignissimos porro eius quam doloremque
  et enim velit nobis maxime.
</ScrambledText>`,
  css
});
