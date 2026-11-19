import code from '@content/Backgrounds/PixelBlast/PixelBlast.tsx?raw';
import css from '@content/Backgrounds/PixelBlast/PixelBlast.css?raw';
import { createCodeObject } from '@/types/code';

export const pixelBlast = createCodeObject(code, 'Backgrounds/PixelBlast', {
  dependencies: '',
  usage: `import PixelBlast from './PixelBlast';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PixelBlast
    variant="square"
    pixelSize={3}
    color="#6ec9f7"
    patternScale={2}
    patternDensity={1}
    softness={0.6}
    glow={0.4}
    twinkle={0.25}
    drift={0.2}
    hoverEffect="reveal"
    enableRipples
    edgeFade={0.25}
  />
</div>`,
  css
});
