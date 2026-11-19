import code from '@content/Animations/ImageTrail/ImageTrail.tsx?raw';
import css from '@content/Animations/ImageTrail/ImageTrail.css?raw';
import { createCodeObject } from '@/types/code';

export const imageTrail = createCodeObject(code, 'Animations/ImageTrail', {
  dependencies: 'gsap',
  usage: `import ImageTrail from './ImageTrail';

<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>
  <ImageTrail
    items={[
      'https://picsum.photos/id/287/300/300',
      'https://picsum.photos/id/1001/300/300',
      'https://picsum.photos/id/1025/300/300',
      'https://picsum.photos/id/1026/300/300',
      'https://picsum.photos/id/1027/300/300',
      'https://picsum.photos/id/1028/300/300',
      'https://picsum.photos/id/1029/300/300',
      'https://picsum.photos/id/1030/300/300'
    ]}
    size={190}
    threshold={80}
    appearScale={0}
    zoom={2.4}
    flash={0.6}
  />
</div>`,
  css
});
