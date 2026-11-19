import code from '@content/Backgrounds/LiquidEther/LiquidEther.tsx?raw';
import css from '@content/Backgrounds/LiquidEther/LiquidEther.css?raw';
import { createCodeObject } from '@/types/code';

export const liquidEther = createCodeObject(code, 'Backgrounds/LiquidEther', {
  dependencies: '',
  usage: `import LiquidEther from './LiquidEther';

<div style={{ width: '100%', height: 600, position: 'relative' }}>
  <LiquidEther
    colors={['#0aa0ef', '#6ec9f7', '#b4c8da']}
    mouseForce={20}
    cursorSize={100}
    persistence={0.75}
    autoDemo={true}
    autoSpeed={0.5}
    autoIntensity={2.2}
  />
</div>`,
  css
});
