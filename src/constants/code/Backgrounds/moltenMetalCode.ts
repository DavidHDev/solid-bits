import code from '@content/Backgrounds/MoltenMetal/MoltenMetal.tsx?raw';
import css from '@content/Backgrounds/MoltenMetal/MoltenMetal.css?raw';
import { createCodeObject } from '@/types/code';

export const moltenMetal = createCodeObject(code, 'Backgrounds/MoltenMetal', {
  dependencies: '',
  usage: `import MoltenMetal from './MoltenMetal';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <MoltenMetal
    colors={['#0aa0ef', '#6ec9f7']}
    coreColor="#FFFFFF"
    speed={0.35}
    scale={4}
    detail={3}
    glow={1.6}
    thickness={1}
    haze={0.75}
    mouseInteraction
    flareOnClick
  />
</div>`,
  css
});
