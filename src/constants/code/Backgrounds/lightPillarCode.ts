import code from '@content/Backgrounds/LightPillar/LightPillar.tsx?raw';
import css from '@content/Backgrounds/LightPillar/LightPillar.css?raw';
import { createCodeObject } from '@/types/code';

export const lightPillar = createCodeObject(code, 'Backgrounds/LightPillar', {
  dependencies: '',
  usage: `import LightPillar from './LightPillar';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LightPillar
    topColor="#0aa0ef"
    bottomColor="#6ec9f7"
    intensity={1}
    glowAmount={0.002}
    bloom={0.5}
    pillarWidth={3}
    pillarHeight={0.4}
    pillarRotation={25}
    rotationSpeed={0.3}
    interactive
    clickPulse
    intro
    quality="high"
    mixBlendMode="screen"
  />
</div>`,
  css
});
