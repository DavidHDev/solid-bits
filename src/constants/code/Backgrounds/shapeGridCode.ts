import code from '@content/Backgrounds/ShapeGrid/ShapeGrid.tsx?raw';
import css from '@content/Backgrounds/ShapeGrid/ShapeGrid.css?raw';
import { createCodeObject } from '@/types/code';

export const shapeGrid = createCodeObject(code, 'Backgrounds/ShapeGrid', {
  dependencies: '',
  usage: `import ShapeGrid from './ShapeGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <ShapeGrid
    shape="square"
    direction="diagonal"
    lineColor="#27292d"
    hoverColor="#ffffff"
    hoverFillColor="#ffffff"
    fillOpacity={0.15}
    cellSize={40}
    speed={0.5}
    tiltX={0}
    tiltY={0}
    rainbow={false}
  />
</div>`,
  css
});
