import code from '@content/Backgrounds/Scanner/Scanner.tsx?raw';
import css from '@content/Backgrounds/Scanner/Scanner.css?raw';
import { createCodeObject } from '@/types/code';

export const scanner = createCodeObject(code, 'Backgrounds/Scanner', {
  dependencies: '',
  usage: `import Scanner from './Scanner';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Scanner
    color1="#0aa0ef"
    color2="#6ec9f7"
    color3="#FFFFFF"
    speed={0.5}
    sweepSpeed={0.25}
    sweepWidth={1.6}
    trail={0.5}
    ripple={0.22}
    bandDensity={11}
    glow={0.6}
    scanDirection="vertical"
    colorSpread={0.7}
    scanline
    scanlineIntensity={0.5}
    mouseInteraction
    clickEffect="ping"
  />
</div>`,
  css
});
