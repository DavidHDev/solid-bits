import code from '@content/Backgrounds/Antigravity/Antigravity.tsx?raw';
import css from '@content/Backgrounds/Antigravity/Antigravity.css?raw';
import { createCodeObject } from '@/types/code';

export const antigravity = createCodeObject(code, 'Backgrounds/Antigravity', {
  dependencies: '',
  usage: `import Antigravity from './Antigravity';

<div style={{ width: '100%', height: '400px', position: 'relative' }}>
  <Antigravity
    colors={['#0aa0ef', '#6ec9f7', '#a7c8e8']}
    count={1500}
    magnetRadius={9}
    ringRadius={7}
    particleSize={0.9}
    autoAnimate={true}
  />
</div>`,
  css
});
