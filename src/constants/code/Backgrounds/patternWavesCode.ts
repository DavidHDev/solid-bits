import code from '@content/Backgrounds/PatternWaves/PatternWaves.tsx?raw';
import css from '@content/Backgrounds/PatternWaves/PatternWaves.css?raw';
import { createCodeObject } from '@/types/code';

export const patternWaves = createCodeObject(code, 'Backgrounds/PatternWaves', {
  dependencies: 'ogl',
  usage: `import PatternWaves from './PatternWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PatternWaves
    preset="silk"
    color="#ffffff"
    backgroundColor="#000000"
    fade="edges"
    interactive
    cursorSize={50}
    cursorStrength={0.6}
  />
</div>`,
  css
});
