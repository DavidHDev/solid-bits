import code from '@content/Backgrounds/Grainient/Grainient.tsx?raw';
import css from '@content/Backgrounds/Grainient/Grainient.css?raw';
import { createCodeObject } from '@/types/code';

export const grainient = createCodeObject(code, 'Backgrounds/Grainient', {
  dependencies: '',
  usage: `import Grainient from './Grainient';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Grainient
    colors={['#0c0f13', '#2a0f0a', '#9a3412', '#16abf9', '#fed7aa']}
    angle={55}
    flow={0.8}
    silk={0.35}
    grainAmount={0.08}
  />
</div>`,
  css
});
