import code from '@content/Animations/DitherVeil/DitherVeil.tsx?raw';
import css from '@content/Animations/DitherVeil/DitherVeil.css?raw';
import { createCodeObject } from '@/types/code';

export const ditherVeil = createCodeObject(code, 'Animations/DitherVeil', {
  dependencies: 'ogl',
  usage: `import DitherVeil from './DitherVeil';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DitherVeil
    src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
    pattern="floyd"
    pixelSize={2}
    inkColor="#0c0f13"
    paperColor="#f4f1ea"
    revealRadius={200}
    softness={0.6}
    linger={1}
  />
</div>`,
  css
});
