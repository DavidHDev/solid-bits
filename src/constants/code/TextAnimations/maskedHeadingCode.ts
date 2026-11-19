import code from '@content/TextAnimations/MaskedHeading/MaskedHeading.tsx?raw';
import css from '@content/TextAnimations/MaskedHeading/MaskedHeading.css?raw';
import { createCodeObject } from '@/types/code';

export const maskedHeading = createCodeObject(code, 'TextAnimations/MaskedHeading', {
  dependencies: 'gsap',
  usage: `import MaskedHeading from './MaskedHeading';

<MaskedHeading
  text="Shot on location"
  mediaType="video"
  src="/reel.mp4"
  poster="/reel-poster.jpg"
  fillScale={1.3}
  parallax={34}
  reveal="scale"
  trigger="view"
  spotlight
  spotlightRadius={180}
  outline
/>`,
  css
});
