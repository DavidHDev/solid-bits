import code from '@content/Animations/OrbitImages/OrbitImages.tsx?raw';
import css from '@content/Animations/OrbitImages/OrbitImages.css?raw';
import { createCodeObject } from '@/types/code';

export const orbitImages = createCodeObject(code, 'Animations/OrbitImages', {
  dependencies: '',
  usage: `import OrbitImages from './OrbitImages';

const images = [
  'https://picsum.photos/300/300?grayscale&random=1',
  'https://picsum.photos/300/300?grayscale&random=2',
  'https://picsum.photos/300/300?grayscale&random=3',
  'https://picsum.photos/300/300?grayscale&random=4',
  'https://picsum.photos/300/300?grayscale&random=5',
  'https://picsum.photos/300/300?grayscale&random=6'
];

<OrbitImages
  images={images}
  shape="ellipse"
  radiusX={340}
  radiusY={80}
  rotation={-8}
  duration={30}
  itemSize={90}
  depth={0.6}
  showPath
  centerContent={<h2>Moments</h2>}
/>`,
  css
});
