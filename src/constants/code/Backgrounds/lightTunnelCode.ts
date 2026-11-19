import code from '@content/Backgrounds/LightTunnel/LightTunnel.tsx?raw';
import css from '@content/Backgrounds/LightTunnel/LightTunnel.css?raw';
import { createCodeObject } from '@/types/code';

export const lightTunnel = createCodeObject(code, 'Backgrounds/LightTunnel', {
  dependencies: '',
  usage: `import LightTunnel from './LightTunnel';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <LightTunnel
    cableColor="#ffffff"
    pulseColor="#ffffff"
    cableCount={56}
    pulseDensity={0.5}
    flowDirection="inward"
    mouseInteraction
    clickSurge
  />
</div>`,
  css
});
