import code from '@content/Micro/PeekRating/PeekRating.tsx?raw';
import css from '@content/Micro/PeekRating/PeekRating.css?raw';
import { createCodeObject } from '@/types/code';

export const peekRating = createCodeObject(code, 'Micro/PeekRating', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import PeekRating from './PeekRating';

<PeekRating
  defaultValue={3}
  count={5}
  shape="star"
  labels={['Poor', 'Fair', 'Good', 'Great', 'Superb']}
  activeColor="#f5b400"
  idleColor="#52525b"
  tipColor="#27272a"
  tipTextColor="#f5f5f5"
  size={32}
  lift={7}
  magnify={1.15}
  riseDuration={320}
  popScale={1.3}
  showTip
  allowClear
  onChange={value => console.log('rated', value)}
/>`,
  css
});
