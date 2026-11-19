import code from '@content/Components/CardSwap/CardSwap.tsx?raw';
import css from '@content/Components/CardSwap/CardSwap.css?raw';
import { createCodeObject } from '@/types/code';

export const cardSwap = createCodeObject(code, 'Components/CardSwap', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import CardSwap, { Card } from './CardSwap';

const items = [
  { title: 'Golden hour', image: '/photos/sky.jpg' },
  { title: 'Canola field', image: '/photos/field.jpg' },
  { title: 'The pier', image: '/photos/pier.jpg' },
  { title: 'Pink drift', image: '/photos/clouds.jpg' }
];

<div style={{ height: '600px' }}>
  <CardSwap items={items} delay={4000} />
</div>

<div style={{ height: '600px' }}>
  <CardSwap width={420} height={300}>
    <Card>Your content</Card>
    <Card>Your content</Card>
    <Card>Your content</Card>
  </CardSwap>
</div>`,
  css
});
