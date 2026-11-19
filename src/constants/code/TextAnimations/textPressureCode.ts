import code from '@content/TextAnimations/TextPressure/TextPressure.tsx?raw';
import { createCodeObject } from '@/types/code';

export const textPressure = createCodeObject(code, 'TextAnimations/TextPressure', {
  dependencies: '',
  usage: `import TextPressure from './TextPressure';

<div style={{ position: 'relative', height: '300px' }}>
  <TextPressure
    text="Hello!"
    flex={true}
    alpha={false}
    stroke={false}
    width={true}
    weight={true}
    italic={true}
    radius={0.5}
    smoothing={0.5}
    idle="wave"
    idleSpeed={1}
    clickRipple={true}
    strokeColor="#ff0000"
    strokeWidth={3}
    minFontSize={36}
  />
</div>`
});
