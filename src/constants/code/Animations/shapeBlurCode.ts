import code from '@content/Animations/ShapeBlur/ShapeBlur.tsx?raw';
import css from '@content/Animations/ShapeBlur/ShapeBlur.css?raw';
import { createCodeObject } from '@/types/code';

export const shapeBlur = createCodeObject(code, 'Animations/ShapeBlur', {
  dependencies: '',
  usage: `import ShapeBlur from './ShapeBlur';

<div style={{ position: 'relative', height: '500px' }}>
  <ShapeBlur
    size={0.6}
    fill={true}
    color="#ffffff"
    blur={16}
    lensSize={0.3}
    lensSoftness={0.7}
    chroma={0.3}
    idle={true}
  />
</div>`,
  css
});
