import code from '@content/Animations/Magnet/Magnet.tsx?raw';
import { createCodeObject } from '@/types/code';

export const magnet = createCodeObject(code, 'Animations/Magnet', {
  dependencies: '',
  usage: `import Magnet from './Magnet';

<Magnet padding={100} magnetStrength={2}>
  <button>Star Solid Bits on GitHub</button>
</Magnet>`
});
