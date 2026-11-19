import code from '@content/TextAnimations/CurvedLoop/CurvedLoop.tsx?raw';
import css from '@content/TextAnimations/CurvedLoop/CurvedLoop.css?raw';
import { createCodeObject } from '@/types/code';

export const curvedLoop = createCodeObject(code, 'TextAnimations/CurvedLoop', {
  dependencies: '',
  usage: `import CurvedLoop from './CurvedLoop';

<CurvedLoop
  marqueeText="Be ✦ Creative ✦ With ✦ Solid ✦ Bits ✦"
  shape="arc"
  speed={2}
  curveAmount={400}
  direction="left"
  fontSize={96}
  fontWeight={500}
  letterSpacing={0}
  separator=""
  outline={false}
  scrollBoost={0}
  edgeFade={0}
  interactive={true}
  pauseOnHover={false}
/>`,
  css
});
