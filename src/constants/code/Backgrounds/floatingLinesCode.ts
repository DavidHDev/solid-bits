import code from '@content/Backgrounds/FloatingLines/FloatingLines.tsx?raw';
import css from '@content/Backgrounds/FloatingLines/FloatingLines.css?raw';
import { createCodeObject } from '@/types/code';

export const floatingLines = createCodeObject(code, 'Backgrounds/FloatingLines', {
  dependencies: '',
  usage: `import FloatingLines from './FloatingLines';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <FloatingLines
    linesGradient={['#6ec9f7', '#ffffff']}
    enabledWaves={['top', 'middle', 'bottom']}
    lineCount={10}
    lineDistance={6}
    bendStrength={-0.5}
    interactive
    clickSwirl
  />
</div>`,
  css
});
