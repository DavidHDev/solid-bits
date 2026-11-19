import code from '@content/Animations/Cubes/Cubes.tsx?raw';
import css from '@content/Animations/Cubes/Cubes.css?raw';
import { createCodeObject } from '@/types/code';

export const cubes = createCodeObject(code, 'Animations/Cubes', {
  dependencies: '',
  usage: `// CREDIT
// Component inspired from Can Tastemel's original work for the lambda.ai landing page
// https://cantastemel.com

import Cubes from './Cubes';

<div style={{ height: '600px', position: 'relative' }}>
  <Cubes
    gridSize={10}
    faceColor="#0c0f13"
    edgeColor="#ffffff"
    maxAngle={45}
    radius={3}
  />
</div>`,
  css
});
