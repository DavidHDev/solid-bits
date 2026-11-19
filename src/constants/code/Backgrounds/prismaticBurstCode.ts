import code from '@content/Backgrounds/PrismaticBurst/PrismaticBurst.tsx?raw';
import css from '@content/Backgrounds/PrismaticBurst/PrismaticBurst.css?raw';
import { createCodeObject } from '@/types/code';

export const prismaticBurst = createCodeObject(code, 'Backgrounds/PrismaticBurst', {
  dependencies: '',
  usage: `import PrismaticBurst from './PrismaticBurst';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <PrismaticBurst
    colors={['#6ec9f7', '#0aa0ef', '#0771a6']}
    animationType="rotate3d"
    intensity={2}
    speed={0.5}
    zoom={1}
    rayWidth={1}
    twist={0}
    mouseInteraction
    clickBurst
    intro
  />
</div>`,
  css
});
