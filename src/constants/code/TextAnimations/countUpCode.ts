import code from '@content/TextAnimations/CountUp/CountUp.tsx?raw';
import { createCodeObject } from '@/types/code';

export const countup = createCodeObject(code, 'TextAnimations/CountUp', {
  dependencies: 'motion',
  usage: `import CountUp from './CountUp';

<CountUp
  from={0}
  to={100}
  mode="count"
  easing="easeOut"
  format="standard"
  separator=","
  prefix=""
  suffix=""
  direction="up"
  duration={1}
  delay={0}
  trigger="view"
  replayOnHover
  className="count-up-text"
/>`
});
