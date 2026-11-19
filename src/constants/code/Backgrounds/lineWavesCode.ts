import code from '@content/Backgrounds/LineWaves/LineWaves.tsx?raw';
import css from '@content/Backgrounds/LineWaves/LineWaves.css?raw';
import { createCodeObject } from '@/types/code';

export const lineWaves = createCodeObject(code, 'Backgrounds/LineWaves', {
  dependencies: '',
  usage: `import LineWaves from './LineWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LineWaves
    color1="#ffffff"
    color2="#ffffff"
    color3="#ffffff"
    speed={0.3}
    lineCount={72}
    lineWidth={1.3}
    highlight={1}
    warpIntensity={1}
    rotation={-33}
    enableMouseInteraction={true}
  />
</div>`,
  css
});
