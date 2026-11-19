import code from '@content/Components/FlyingPosters/FlyingPosters.tsx?raw';
import css from '@content/Components/FlyingPosters/FlyingPosters.css?raw';
import { createCodeObject } from '@/types/code';

export const flyingPosters = createCodeObject(code, 'Components/FlyingPosters', {
  dependencies: '',
  usage: `import FlyingPosters from './FlyingPosters';

const items = [
  '/assets/demo/day-portrait.webp',
  '/assets/demo/night-landscape.webp',
  '/assets/demo/day-landscape.webp',
  '/assets/demo/night-portrait.webp'
];

<div style={{ height: '600px', position: 'relative' }}>
  <FlyingPosters
    items={items}
    planeWidth={320}
    planeHeight={320}
    distortion={3}
    scrollEase={0.01}
    cameraFov={45}
    cameraZ={20}
  />
</div>`,
  css
});
