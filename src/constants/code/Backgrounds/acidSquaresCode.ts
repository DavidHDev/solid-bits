import code from '@content/Backgrounds/AcidSquares/AcidSquares.tsx?raw';
import css from '@content/Backgrounds/AcidSquares/AcidSquares.css?raw';
import { createCodeObject } from '@/types/code';

export const acidSquares = createCodeObject(code, 'Backgrounds/AcidSquares', {
  dependencies: '',
  usage: `import AcidSquares from './AcidSquares';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <AcidSquares
    color="#0c0f13"
    accentColor="#6ec9f7"
    secondaryColor="#0aa0ef"
    tileSize={1}
    gap={0.12}
    roundness={0.25}
    rotation={35}
    waves={1}
    pulse={1}
    lighting="split"
    tilt={0.7}
    grain={0.12}
    intro={true}
    mouseInteraction={true}
  />
</div>`,
  css
});
