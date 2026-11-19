import code from '@content/Backgrounds/Lightning/Lightning.tsx?raw';
import css from '@content/Backgrounds/Lightning/Lightning.css?raw';
import { createCodeObject } from '@/types/code';

export const lightning = createCodeObject(code, 'Backgrounds/Lightning', {
  dependencies: '',
  usage: `import Lightning from './Lightning';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Lightning
    color="#0aa0ef"
    bolts={1}
    spread={0.6}
    branches={0.5}
    xOffset={0}
    angle={0}
    size={1}
    thickness={1}
    glow={1}
    intensity={1}
    speed={1}
    flicker={0.6}
    mouseInteraction={true}
    mouseStrength={1}
    clickStrike={true}
    intro={true}
    fade={0}
    opacity={1}
    lightMode={false}
  />
</div>`,
  css
});
