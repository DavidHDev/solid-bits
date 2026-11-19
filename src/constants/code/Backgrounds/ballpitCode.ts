import code from '@content/Backgrounds/Ballpit/Ballpit.tsx?raw';
import { createCodeObject } from '@/types/code';

export const ballpit = createCodeObject(code, 'Backgrounds/Ballpit', {
  dependencies: '',
  usage: `import Ballpit from './Ballpit';

<div style={{ position: 'relative', overflow: 'hidden', height: '500px', width: '100%' }}>
  <Ballpit
    count={200}
    colors={['#ffffff']}
    material="satin"
    gravity={0}
    drift={0.4}
    followCursor
    grab
    clickEffect="burst"
  />
</div>`
});
