import code from '@content/Components/CircularGallery/CircularGallery.tsx?raw';
import css from '@content/Components/CircularGallery/CircularGallery.css?raw';
import { createCodeObject } from '@/types/code';

export const circularGallery = createCodeObject(code, 'Components/CircularGallery', {
  dependencies: '',
  usage: `import CircularGallery from './CircularGallery';

<div style={{ height: '600px', position: 'relative' }}>
  <CircularGallery
    bend={3}
    textColor="#ffffff"
    borderRadius={0.05}
    scrollEase={0.05}
    onItemClick={(item, index) => console.log(item.text, index)}
  />
</div>`,
  css
});
