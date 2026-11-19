import code from '@content/TextAnimations/CircularText/CircularText.tsx?raw';
import css from '@content/TextAnimations/CircularText/CircularText.css?raw';
import { createCodeObject } from '@/types/code';

export const circularText = createCodeObject(code, 'TextAnimations/CircularText', {
  dependencies: 'motion',
  usage: `import CircularText from './CircularText';

<CircularText
  text="SOLID*BITS*COMPONENTS*"
  onHover="speedUp"
  direction="clockwise"
  spinDuration={20}
  size={200}
  fontSize={24}
  draggable
  hoverTilt={20}
  className="custom-class"
/>`,
  css
});
