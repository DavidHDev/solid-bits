import code from '@content/Animations/FadeContent/FadeContent.tsx?raw';
import { createCodeObject } from '@/types/code';

export const fadeContent = createCodeObject(code, 'Animations/FadeContent', {
  dependencies: 'gsap',
  usage: `import FadeContent from './FadeContent';

<FadeContent
  effect="mist"
  duration={1.8}
  ease="power2.out"
  stagger={0.1}
  threshold={0.1}
>
  <h2>Slow light over the bay</h2>
  <p>Every child fades in turn.</p>
</FadeContent>`
});
