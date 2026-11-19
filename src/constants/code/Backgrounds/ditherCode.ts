import code from '@content/Backgrounds/Dither/Dither.tsx?raw';
import css from '@content/Backgrounds/Dither/Dither.css?raw';
import { createCodeObject } from '@/types/code';

export const dither = createCodeObject(code, 'Backgrounds/Dither', {
  dependencies: '',
  usage: `import Dither from './Dither';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Dither
    waveColor="#bcbcbc"
    backgroundColor="#0c0f13"
    ditherMode="bayer"
    colorNum={4}
    pixelSize={2}
    waveSpeed={0.05}
    waveFrequency={3}
    waveAmplitude={0.3}
    mouseEffect="erase"
    mouseRadius={0.3}
  />
</div>`,
  css
});
