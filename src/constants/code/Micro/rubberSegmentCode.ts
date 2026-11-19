import code from '@content/Micro/RubberSegment/RubberSegment.tsx?raw';
import css from '@content/Micro/RubberSegment/RubberSegment.css?raw';
import { createCodeObject } from '@/types/code';

export const rubberSegment = createCodeObject(code, 'Micro/RubberSegment', {
  dependencies: 'motion',
  usage: `import RubberSegment from './RubberSegment';

<RubberSegment
  items={['Day', 'Week', 'Month', 'Year']}
  defaultValue="Week"
  onChange={(value, index) => console.log(value, index)}
  trackColor="#27272a"
  thumbColor="#fafafa"
  textColor="#fafafa"
  activeTextColor="#18181b"
  size="md"
  radius={10}
  inset={3}
  equalSlots
  stretch={100}
  squash={3}
  speed={1}
  glide={75}
  draggable
/>`,
  css
});
