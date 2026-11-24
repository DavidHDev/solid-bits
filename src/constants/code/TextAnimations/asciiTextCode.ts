import code from '@content/TextAnimations/ASCIIText/ASCIIText.tsx?raw';
import { createCodeObject } from '@/types/code';

export const asciiText = createCodeObject(code, 'TextAnimations/ASCIIText', {
  dependencies: '',
  usage: `import ASCIIText from './ASCIIText';

<div style={{ position: 'relative', width: '100%', height: '440px' }}>
  <ASCIIText
    text="Hey!"
    asciiFontSize={8}
    colors={['#ff6a5c', '#fc9867', '#66caff']}
    textScale={1}
    blocks={0.9}
    waves={1}
    waveSpeed={1}
    chroma={1}
    tilt={1}
    hueShift={1}
    scramble={0.6}
    clickRipple
    idle
    interactive
  />
</div>`
});
