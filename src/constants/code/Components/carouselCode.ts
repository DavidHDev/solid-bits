import code from '@content/Components/Carousel/Carousel.tsx?raw';
import css from '@content/Components/Carousel/Carousel.css?raw';
import { createCodeObject } from '@/types/code';

export const carousel = createCodeObject(code, 'Components/Carousel', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import Carousel from './Carousel';

const items = [
  { title: 'Open fields', description: 'Bright skies over rapeseed in full bloom.', image: '/fields.jpg' },
  { title: 'Moonrise', description: 'The same field, quiet under a full moon.', image: '/moon.jpg' },
  { title: 'The pier', description: 'Clear water and a long walk out.', image: '/pier.jpg' }
];

<div style={{ height: '600px', position: 'relative' }}>
  <Carousel
    items={items}
    baseWidth={300}
    aspectRatio={1.25}
    effect="tilt"
    indicator="dots"
    frame={true}
    arrows={false}
    loop={false}
    autoplay={false}
    autoplayDelay={3000}
    pauseOnHover={false}
    theme="dark"
  />
</div>`,
  css
});
