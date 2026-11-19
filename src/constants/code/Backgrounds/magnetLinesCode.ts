import code from '@content/Backgrounds/MagnetLines/MagnetLines.tsx?raw';
import css from '@content/Backgrounds/MagnetLines/MagnetLines.css?raw';
import { createCodeObject } from '@/types/code';

export const magnetLines = createCodeObject(code, 'Backgrounds/MagnetLines', {
  dependencies: '',
  usage: `import MagnetLines from './MagnetLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <MagnetLines
    lineColor="#efefef"
    spacing={30}
    lineWidth={2}
    lineHeight={18}
    mode="orbit"
    shape="line"
    radius={200}
    fade={0.65}
  />
</div>`,
  css
});
