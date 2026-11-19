import code from '@content/Backgrounds/FluxLines/FluxLines.tsx?raw';
import css from '@content/Backgrounds/FluxLines/FluxLines.css?raw';
import { createCodeObject } from '@/types/code';

export const fluxLines = createCodeObject(code, 'Backgrounds/FluxLines', {
  dependencies: '',
  usage: `import FluxLines from './FluxLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FluxLines
    colors={['#ffffff', '#ffffff', '#ffffff']}
    glow={2}
    rimWidth={0.2}
    lineWidth={1}
    flowDirection="down"
    mouseInteraction
    clickSwirl
  />
</div>`,
  css
});
