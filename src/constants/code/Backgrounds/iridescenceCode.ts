import code from '@content/Backgrounds/Iridescence/Iridescence.tsx?raw';
import css from '@content/Backgrounds/Iridescence/Iridescence.css?raw';
import { createCodeObject } from '@/types/code';

export const iridescence = createCodeObject(code, 'Backgrounds/Iridescence', {
  dependencies: '',
  usage: `import Iridescence from './Iridescence';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Iridescence
    color="#80a6cc"
    hueShift={0}
    saturation={1}
    brightness={1.5}
    contrast={1}
    speed={1}
    scale={1}
    detail={8}
    warp={1}
    rotation={0}
    mouseReact={true}
    amplitude={0.1}
    stir={0.5}
    sheen={0.3}
    clickSwirl={true}
    grain={0}
    fade={0}
  />
</div>`,
  css
});
