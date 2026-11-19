import code from '@content/Backgrounds/CRTWarp/CRTWarp.tsx?raw';
import css from '@content/Backgrounds/CRTWarp/CRTWarp.css?raw';
import { createCodeObject } from '@/types/code';

export const crtWarp = createCodeObject(code, 'Backgrounds/CRTWarp', {
  dependencies: '',
  usage: `import CRTWarp from './CRTWarp';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <CRTWarp
    color="#6ec9f7"
    backgroundColor="#0c0f13"
    mask="aperture"
    curvature={0.25}
    persistence={0.4}
  />
</div>`,
  css
});
