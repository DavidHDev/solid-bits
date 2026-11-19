import code from '@content/Components/ModelViewer/ModelViewer.tsx?raw';
import { createCodeObject } from '@/types/code';

export const modelViewer = createCodeObject(code, 'Components/ModelViewer', {
  dependencies: 'three',
  usage: `import ModelViewer from './ModelViewer';

<ModelViewer
  url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb"
  width={500}
  height={500}
  environment="studio"
  autoRotate
/>`
});
