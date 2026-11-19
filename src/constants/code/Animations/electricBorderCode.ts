import code from '@content/Animations/ElectricBorder/ElectricBorder.tsx?raw';
import css from '@content/Animations/ElectricBorder/ElectricBorder.css?raw';
import { createCodeObject } from '@/types/code';

export const electricBorder = createCodeObject(code, 'Animations/ElectricBorder', {
  dependencies: '',
  usage: `import ElectricBorder from './ElectricBorder';

<ElectricBorder
  color="#7df9ff"
  speed={1}
  chaos={0.5}
  spread={0.6}
  strands={3}
  thickness={1.5}
  borderRadius={24}
>
  <div style={{ width: '300px', height: '360px', 'border-radius': '24px' }}>
    Your content
  </div>
</ElectricBorder>`,
  css
});
