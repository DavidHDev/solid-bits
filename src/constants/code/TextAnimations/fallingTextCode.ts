import code from '@content/TextAnimations/FallingText/FallingText.tsx?raw';
import css from '@content/TextAnimations/FallingText/FallingText.css?raw';
import { createCodeObject } from '@/types/code';

export const fallingText = createCodeObject(code, 'TextAnimations/FallingText', {
  dependencies: 'matter-js',
  usage: `import FallingText from './FallingText';

<div style={{ height: '400px', position: 'relative' }}>
  <FallingText
    text="Some sentences are built to last. This one falls apart on contact."
    highlightWords={['falls', 'apart']}
    trigger="hover"
    fontSize="2rem"
    gravity={1}
    restoreDelay={2}
  />
</div>`,
  css
});
