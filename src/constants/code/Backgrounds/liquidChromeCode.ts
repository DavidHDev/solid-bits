import code from '@content/Backgrounds/LiquidChrome/LiquidChrome.tsx?raw';
import css from '@content/Backgrounds/LiquidChrome/LiquidChrome.css?raw';
import { createCodeObject } from '@/types/code';

export const liquidChrome = createCodeObject(code, 'Backgrounds/LiquidChrome', {
  dependencies: '',
  usage: `import LiquidChrome from './LiquidChrome';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LiquidChrome
    color="#ffffff"
    speed={0.2}
    amplitude={0.3}
    detail={4}
    thickness={1}
    interactive={true}
  />
</div>`,
  css
});
