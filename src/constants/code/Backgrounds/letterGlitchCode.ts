import code from '@content/Backgrounds/LetterGlitch/LetterGlitch.tsx?raw';
import css from '@content/Backgrounds/LetterGlitch/LetterGlitch.css?raw';
import { createCodeObject } from '@/types/code';

export const letterGlitch = createCodeObject(code, 'Backgrounds/LetterGlitch', {
  dependencies: '',
  usage: `import LetterGlitch from './LetterGlitch';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LetterGlitch
    glitchColors={['#ffffff', '#61dca3']}
    glitchAmount={0.5}
    speed={1}
    flow={0.5}
    clickEffect="tear"
  />
</div>`,
  css
});
