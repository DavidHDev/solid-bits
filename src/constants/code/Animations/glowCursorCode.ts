import code from '@content/Animations/GlowCursor/GlowCursor.tsx?raw';
import css from '@content/Animations/GlowCursor/GlowCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const glowCursor = createCodeObject(code, 'Animations/GlowCursor', {
  dependencies: '',
  usage: `import GlowCursor from './GlowCursor';

<div style={{ position: 'relative', width: '100%', height: '500px' }}>
  <GlowCursor
    color="#5f8bff"
    intensity={1.3}
    trailWidth={3}
    linger={1.4}
    glow={1.2}
    clickBurst
    theme="dark"
  >
    <YourContent />
  </GlowCursor>
</div>`,
  css
});
