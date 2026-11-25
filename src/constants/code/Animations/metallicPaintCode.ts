import code from '@content/Animations/MetallicPaint/MetallicPaint.tsx?raw';
import css from '@content/Animations/MetallicPaint/MetallicPaint.css?raw';
import { createCodeObject } from '@/types/code';

export const metallicPaint = createCodeObject(code, 'Animations/MetallicPaint', {
  dependencies: '',
  usage: `import MetallicPaint from './MetallicPaint';
import logo from './logo.svg';

<div style={{ width: '100%', height: '500px' }}>
  <MetallicPaint imageSrc={logo} />
</div>

<div style={{ width: '100%', height: '300px' }}>
  <MetallicPaint text="Liquid" color="#6bc3f2" edgeBend={0.9} />
</div>`,
  css
});
