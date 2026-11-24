import code from '@content/Backgrounds/Radar/Radar.tsx?raw';
import css from '@content/Backgrounds/Radar/Radar.css?raw';
import { createCodeObject } from '@/types/code';

export const radar = createCodeObject(code, 'Backgrounds/Radar', {
  dependencies: '',
  usage: `import Radar from './Radar';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Radar
    color="#3eb3f0"
    mode="sweep"
    speed={1}
    trail={0.35}
    scale={0.9}
    ringCount={6}
    spokeCount={12}
    targets={6}
    clutter={0.35}
    mouseInteraction={true}
  />
</div>`,
  css
});
