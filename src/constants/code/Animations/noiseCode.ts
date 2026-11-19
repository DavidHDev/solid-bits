import code from '@content/Animations/Noise/Noise.tsx?raw';
import css from '@content/Animations/Noise/Noise.css?raw';
import { createCodeObject } from '@/types/code';

export const noise = createCodeObject(code, 'Animations/Noise', {
  dependencies: '',
  usage: `import Noise from './Noise';

<div style={{ position: 'relative', width: '100%', height: '500px' }}>
  <img src="/photo.jpg" alt="" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} />
  <Noise
    opacity={0.2}
    size={1}
    fps={24}
    blendMode="overlay"
    contrast={0.6}
    colored={false}
    dust={0}
    scratches={0}
    scanlines={0}
    flicker={0}
  />
</div>`,
  css
});
