import code from '@content/Backgrounds/GhostFibers/GhostFibers.tsx?raw';
import css from '@content/Backgrounds/GhostFibers/GhostFibers.css?raw';
import { createCodeObject } from '@/types/code';

export const ghostFibers = createCodeObject(code, 'Backgrounds/GhostFibers', {
  dependencies: '',
  usage: `import GhostFibers from './GhostFibers';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GhostFibers
    glowColor="#6ec9f7"
    layers={3}
    twist={1.2}
    threads={72}
    fiberStyle="dots"
    depthOfField={0.85}
    hoverEffect="focus"
    intro={true}
    mouseInteraction={true}
  />
</div>`,
  css
});
