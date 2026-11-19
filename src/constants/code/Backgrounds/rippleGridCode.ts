import code from '@content/Backgrounds/RippleGrid/RippleGrid.tsx?raw';
import css from '@content/Backgrounds/RippleGrid/RippleGrid.css?raw';
import { createCodeObject } from '@/types/code';

export const rippleGrid = createCodeObject(code, 'Backgrounds/RippleGrid', {
  dependencies: '',
  usage: `import RippleGrid from './RippleGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <RippleGrid color="#ffffff" cellSize={48} rippleStrength={1} autoRipple="center" />
</div>`,
  css
});
