import code from '@content/Backgrounds/DarkVeil/DarkVeil.tsx?raw';
import css from '@content/Backgrounds/DarkVeil/DarkVeil.css?raw';
import { createCodeObject } from '@/types/code';

export const darkVeil = createCodeObject(code, 'Backgrounds/DarkVeil', {
  dependencies: '',
  usage: `import DarkVeil from './DarkVeil';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DarkVeil />
</div>`,
  css
});
