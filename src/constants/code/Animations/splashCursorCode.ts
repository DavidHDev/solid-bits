import code from '@content/Animations/SplashCursor/SplashCursor.tsx?raw';
import css from '@content/Animations/SplashCursor/SplashCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const splashCursor = createCodeObject(code, 'Animations/SplashCursor', {
  dependencies: '',
  usage: `import SplashCursor from './SplashCursor';

<SplashCursor
  rainbow
  size={1}
  force={1}
  swirl={3}
  trail={1}
  clickSplash
/>`,
  css
});
