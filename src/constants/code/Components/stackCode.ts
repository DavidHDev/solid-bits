import code from '@content/Components/Stack/Stack.tsx?raw';
import css from '@content/Components/Stack/Stack.css?raw';
import { createCodeObject } from '@/types/code';

export const stack = createCodeObject(code, 'Components/Stack', {
  dependencies: 'motion',
  usage: `import Stack from './Stack';

const images = [
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format'
];

<div style={{ width: '230px', height: '230px' }}>
  <Stack
    layout="fan"
    sendToBackOnClick
    cards={images.map((src, i) => <img src={src} alt={\`Card \${i + 1}\`} />)}
  />
</div>`,
  css
});
