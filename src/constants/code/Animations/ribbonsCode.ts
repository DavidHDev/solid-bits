import code from '@content/Animations/Ribbons/Ribbons.tsx?raw';
import css from '@content/Animations/Ribbons/Ribbons.css?raw';
import { createCodeObject } from '@/types/code';

export const ribbons = createCodeObject(code, 'Animations/Ribbons', {
  dependencies: '',
  usage: `import Ribbons from './Ribbons';

<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <Ribbons
    colors={['#0aa0ef', '#6ec9f7', '#c4def2']}
    thickness={30}
    length={1.4}
  />
</div>`,
  css
});
