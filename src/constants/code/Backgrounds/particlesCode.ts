import code from '@content/Backgrounds/Particles/Particles.tsx?raw';
import css from '@content/Backgrounds/Particles/Particles.css?raw';
import { createCodeObject } from '@/types/code';

export const particles = createCodeObject(code, 'Backgrounds/Particles', {
  dependencies: '',
  usage: `import Particles from './Particles';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Particles
    particleColors={['#ffffff']}
    particleCount={200}
    particleSpread={10}
    speed={0.1}
    particleBaseSize={100}
    glow={0.5}
    twinkle={0.3}
    moveParticlesOnHover
    hoverEffect="parallax"
  />
</div>`,
  css
});
