import code from '@content/Animations/CrystalizedBall/CrystalizedBall.tsx?raw';
import css from '@content/Animations/CrystalizedBall/CrystalizedBall.css?raw';
import { createCodeObject } from '@/types/code';

export const crystalizedBall = createCodeObject(code, 'Animations/CrystalizedBall', {
  dependencies: 'ogl',
  usage: `import CrystalizedBall from './CrystalizedBall';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <CrystalizedBall
    preset="plasma"
    color="#6ec9f7"
    size={0.7}
    crackle={0.85}
    fill={0.5}
    interactive
    hoverStrength={0.7}
  />
</div>`,
  css
});
