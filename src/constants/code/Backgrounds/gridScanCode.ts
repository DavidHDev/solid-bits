import code from '@content/Backgrounds/GridScan/GridScan.tsx?raw';
import css from '@content/Backgrounds/GridScan/GridScan.css?raw';
import { createCodeObject } from '@/types/code';

export const gridScan = createCodeObject(code, 'Backgrounds/GridScan', {
  dependencies: '',
  usage: `import GridScan from './GridScan';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GridScan
    linesColor="#4a4d52"
    scanColor="#7dd3fc"
    cells={8}
    depth={3}
    scanDuration={2.4}
    scanDelay={1.6}
    clickEffect="ping"
  />
</div>`,
  css
});
