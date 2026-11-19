import code from '@content/Animations/ScrollExpand/ScrollExpand.tsx?raw';
import css from '@content/Animations/ScrollExpand/ScrollExpand.css?raw';
import { createCodeObject } from '@/types/code';

export const scrollExpand = createCodeObject(code, 'Animations/ScrollExpand', {
  dependencies: '',
  usage: `import ScrollExpand from './ScrollExpand';

<ScrollExpand
  src="/hero.jpg"
  alt="Product hero"
  title="Built to scale"
  scrollHint="Scroll"
  useWindowScroll
>
  <h2>Every pixel, everywhere</h2>
  <p>The frame opens up as you scroll and hands the whole stage to your media.</p>
</ScrollExpand>

<div style={{ height: '520px' }}>
  <ScrollExpand src="/hero.jpg" title="Built to scale" mediaZoom={1.35} />
</div>`,
  css
});
