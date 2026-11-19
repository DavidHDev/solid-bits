import code from '@content/Animations/ElasticMesh/ElasticMesh.tsx?raw';
import css from '@content/Animations/ElasticMesh/ElasticMesh.css?raw';
import { createCodeObject } from '@/types/code';

export const elasticMesh = createCodeObject(code, 'Animations/ElasticMesh', {
  dependencies: '',
  usage: `import ElasticMesh from './ElasticMesh';

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <ElasticMesh
    text="Squish"
    material="balloon"
    color="#3b8fe0"
    inflate={1}
    stiffness={0.5}
    wobble={0.6}
    theme="dark"
  />
</div>

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <ElasticMesh src="/logo.svg" material="chrome" imageColors={false} />
</div>`,
  css
});
