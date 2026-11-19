import code from '@content/Animations/ElectricLogo/ElectricLogo.tsx?raw';
import css from '@content/Animations/ElectricLogo/ElectricLogo.css?raw';
import { createCodeObject } from '@/types/code';

export const electricLogo = createCodeObject(code, 'Animations/ElectricLogo', {
  dependencies: 'ogl',
  usage: `import ElectricLogo from './ElectricLogo';

<div style={{ width: '100%', height: '480px', position: 'relative' }}>
  <ElectricLogo
    src="/logo.svg"
    color="#c7e7ff"
    glowColor="#6ec9f7"
    scale={0.7}
    strands={4}
    bend={0.6}
    crackle={1.5}
    arcs={1}
    speed={2.5}
    interactive
  />
</div>`,
  css
});
