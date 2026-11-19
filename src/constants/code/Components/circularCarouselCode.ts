import code from '@content/Components/CircularCarousel/CircularCarousel.tsx?raw';
import css from '@content/Components/CircularCarousel/CircularCarousel.css?raw';
import { createCodeObject } from '@/types/code';

export const circularCarousel = createCodeObject(code, 'Components/CircularCarousel', {
  dependencies: '',
  usage: `import CircularCarousel from './CircularCarousel';

const items = [
  { src: '/images/valley.jpg', alt: 'Mist drifting through a valley', title: 'Valley', subtitle: 'Landscape' },
  { src: '/images/portrait.jpg', alt: 'A studio portrait', title: 'Portrait', subtitle: 'Studio' },
  { src: '/images/towers.jpg', alt: 'Glass towers from street level', title: 'Towers', subtitle: 'Architecture' }
];

<div style={{ width: '100%', height: '560px', position: 'relative' }}>
  <CircularCarousel
    items={items}
    preset="cylinder"
    intro="rise"
    cardWidth={220}
    aspectRatio={1}
    speed={14}
    captions
  />
</div>`,
  css
});
