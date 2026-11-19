import code from '@content/Components/Lanyard/Lanyard.tsx?raw';
import css from '@content/Components/Lanyard/Lanyard.css?raw';
import { createCodeObject } from '@/types/code';

export const lanyard = createCodeObject(code, 'Components/Lanyard', {
  dependencies: 'three',
  usage: `import Lanyard from './Lanyard';

<div style={{ width: '100%', height: '600px' }}>
  <Lanyard frontImage="/card-front.png" backImage="/card-back.png" strapImage="/band.png" />
</div>`,
  css
});
