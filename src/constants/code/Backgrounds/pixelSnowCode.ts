import code from '@content/Backgrounds/PixelSnow/PixelSnow.tsx?raw';
import css from '@content/Backgrounds/PixelSnow/PixelSnow.css?raw';
import { createCodeObject } from '@/types/code';

export const pixelSnow = createCodeObject(code, 'Backgrounds/PixelSnow', {
  dependencies: '',
  usage: `import PixelSnow from './PixelSnow';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PixelSnow
    color="#ffffff"
    variant="snowflake"
    density={0.5}
    speed={1}
    wind={0.25}
    flakeSize={1}
    pixelSize={3}
    glow={0.8}
    mouseInteraction={true}
  />
</div>`,
  css
});
