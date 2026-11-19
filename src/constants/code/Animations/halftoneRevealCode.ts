import code from '@content/Animations/HalftoneReveal/HalftoneReveal.tsx?raw';
import css from '@content/Animations/HalftoneReveal/HalftoneReveal.css?raw';
import { createCodeObject } from '@/types/code';

export const halftoneReveal = createCodeObject(code, 'Animations/HalftoneReveal', {
  dependencies: '',
  usage: `import HalftoneReveal from './HalftoneReveal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <HalftoneReveal
    src="https://images.unsplash.com/photo-1693250707557-a846a014b321?q=80&w=1400&auto=format&fit=crop"
    mode="mono"
    shape="dot"
    cellSize={6}
    angle={45}
    inkColor="#0c0f13"
    paperColor="#ffffff"
    revealRadius={160}
  />
</div>`,
  css
});
