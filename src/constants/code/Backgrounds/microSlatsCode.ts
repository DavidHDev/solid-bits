import code from '@content/Backgrounds/MicroSlats/MicroSlats.tsx?raw';
import css from '@content/Backgrounds/MicroSlats/MicroSlats.css?raw';
import { createCodeObject } from '@/types/code';

export const microSlats = createCodeObject(code, 'Backgrounds/MicroSlats', {
  dependencies: 'ogl',
  usage: `import MicroSlats from './MicroSlats';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <MicroSlats
    preset="swell"
    color="#6ec9f7"
    glintColor="#ffffff"
    backgroundColor="#000000"
    slatWidth={10}
    slatHeight={25}
    gap={3}
    roundness={0.75}
    interactive
    cursorStrength={1}
    cursorSize={40}
    swirl={0}
    trail={1.4}
    lean={0}
    intro
  />
</div>`,
  css
});
