import code from '@content/Micro/PulseHeart/PulseHeart.tsx?raw';
import css from '@content/Micro/PulseHeart/PulseHeart.css?raw';
import { createCodeObject } from '@/types/code';

export const pulseHeart = createCodeObject(code, 'Micro/PulseHeart', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import PulseHeart from './PulseHeart';

<PulseHeart
  count={1204}
  defaultLiked={false}
  onChange={(liked, count) => console.log(liked, count)}
  showCount
  icon="heart"
  idleOutline
  size={40}
  corner={32}
  likedColor="#ff4d6d"
  idleColor="#8d8f94"
  pillColor="#222428"
  textColor="#f5f5f5"
  duration={560}
  dotSize={0.3}
  overshoot={1.7}
  beat={3}
  rollDuration={350}
/>`,
  css
});
