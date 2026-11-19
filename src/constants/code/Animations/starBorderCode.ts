import code from '@content/Animations/StarBorder/StarBorder.tsx?raw';
import css from '@content/Animations/StarBorder/StarBorder.css?raw';
import { createCodeObject } from '@/types/code';

export const starBorder = createCodeObject(code, 'Animations/StarBorder', {
  dependencies: '',
  usage: `import StarBorder from './StarBorder';

<StarBorder
  color="#ffffff"
  trailColor="#ffffff"
  duration={4}
  direction="clockwise"
  stars={1}
  trailLength={0.3}
  thickness={1}
  radius={12}
  glow={0.6}
  hover="lap"
  sparkle={false}
  clickPulse
  theme="dark"
>
  Get started
</StarBorder>`,
  css
});
