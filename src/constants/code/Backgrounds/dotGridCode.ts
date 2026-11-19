import code from '@content/Backgrounds/DotGrid/DotGrid.tsx?raw';
import css from '@content/Backgrounds/DotGrid/DotGrid.css?raw';
import { createCodeObject } from '@/types/code';

export const dotGrid = createCodeObject(code, 'Backgrounds/DotGrid', {
  dependencies: '',
  usage: `import DotGrid from './DotGrid';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <DotGrid
    baseColor="#36383b"
    activeColor="#ffffff"
    shape="circle"
    dotSize={5}
    gap={18}
    proximity={140}
    strength={1}
    bounce={0.6}
    tension={0.4}
    returnDuration={0.8}
    shockRadius={320}
    shockStrength={5}
    swell={0.8}
    stretch={0.5}
    glow={0.5}
    fade={0}
    intro={true}
  />
</div>`,
  css
});
