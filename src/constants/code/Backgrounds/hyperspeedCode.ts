import code from '@content/Backgrounds/Hyperspeed/Hyperspeed.tsx?raw';
import css from '@content/Backgrounds/Hyperspeed/Hyperspeed.css?raw';
import { createCodeObject } from '@/types/code';

export const hyperspeed = createCodeObject(code, 'Backgrounds/Hyperspeed', {
  dependencies: 'three',
  usage: `import Hyperspeed from './Hyperspeed';

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <Hyperspeed
    curve="winding"
    curvature={1}
    speed={1}
    boost={3}
    fov={90}
    boostFov={130}
    lanes={3}
    roadWidth={10}
    medianWidth={2}
    density={40}
    trailLength={1}
    lightSize={1}
    poles={20}
    dust={100}
    glow={0.6}
    reflections={0.5}
    roadOpacity={0.1}
    steer={0.35}
    tailColors={['#6ec9f7', '#0aa0ef', '#5a8fc4']}
    headColors={['#03b3c3', '#0e5ea5', '#324555']}
    poleColors={['#03b3c3']}
    interactive
  />
</div>`,
  css
});
