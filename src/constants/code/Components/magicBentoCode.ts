import code from '@content/Components/MagicBento/MagicBento.tsx?raw';
import css from '@content/Components/MagicBento/MagicBento.css?raw';
import { createCodeObject } from '@/types/code';

export const magicBento = createCodeObject(code, 'Components/MagicBento', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import MagicBento from './MagicBento';

<MagicBento
  columns={4}
  rowHeight={200}
  gap={12}
  radius={20}
  enableBorderGlow={true}
  enableSpotlight={true}
  spotlightRadius={300}
  clickEffect={true}
/>`,
  css
});
