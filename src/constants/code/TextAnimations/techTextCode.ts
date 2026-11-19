import code from '@content/TextAnimations/TechText/TechText.tsx?raw';
import css from '@content/TextAnimations/TechText/TechText.css?raw';
import { createCodeObject } from '@/types/code';

export const techText = createCodeObject(code, 'TextAnimations/TechText', {
  dependencies: '',
  usage: `import TechText from './TechText';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <TechText
    text="Solid Bits"
    fontWeight={500}
    fontSize={150}
    reveal="letter"
    dashLength={4}
    dashGap={2}
    specks={15}
    intro="none"
    introDuration={2}
    clickKick
    guides={false}
  />
</div>`,
  css
});
