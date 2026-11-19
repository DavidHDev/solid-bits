import code from '@content/Backgrounds/DotField/DotField.tsx?raw';
import css from '@content/Backgrounds/DotField/DotField.css?raw';
import { createCodeObject } from '@/types/code';

export const dotField = createCodeObject(code, 'Backgrounds/DotField', {
  dependencies: '',
  usage: `import DotField from './DotField';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotField
    gradientFrom="#0aa0ef"
    gradientTo="#6ec9f7"
    dotRadius={1.5}
    dotSpacing={14}
    cursorRadius={240}
    bulgeStrength={0.6}
    glowRadius={160}
  />
</div>`,
  css
});
