import code from '@content/Animations/GhostCursor/GhostCursor.tsx?raw';
import css from '@content/Animations/GhostCursor/GhostCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const ghostCursor = createCodeObject(code, 'Animations/GhostCursor', {
  dependencies: '',
  usage: `import GhostCursor from './GhostCursor';

<div style={{ height: '600px', position: 'relative' }}>
  <GhostCursor
    color="#6ec9f7"
    size={80}
    trailLength={50}
    inertia={0.5}
    turbulence={0.5}
    drift={0.3}
    bloomStrength={0.6}
    grainIntensity={0.05}
  />
</div>`,
  css
});
