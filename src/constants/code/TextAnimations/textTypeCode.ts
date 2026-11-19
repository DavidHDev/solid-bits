import code from '@content/TextAnimations/TextType/TextType.tsx?raw';
import css from '@content/TextAnimations/TextType/TextType.css?raw';
import { createCodeObject } from '@/types/code';

export const textType = createCodeObject(code, 'TextAnimations/TextType', {
  dependencies: 'gsap',
  usage: `import TextType from './TextType';

<TextType
  text={['Text typing effect', 'for your websites', 'Happy coding!']}
  typingSpeed={75}
  pauseDuration={1500}
  deletingSpeed={50}
  deleteMode="backspace"
  typeEffect="fade"
  mistakes={0.2}
  cursorStyle="bar"
  cursorGlide
  showCursor
/>`,
  css
});
