import code from '@content/TextAnimations/TextCursor/TextCursor.tsx?raw';
import css from '@content/TextAnimations/TextCursor/TextCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const textCursor = createCodeObject(code, 'TextAnimations/TextCursor', {
  dependencies: '',
  usage: `import TextCursor from './TextCursor';

<div style={{ height: '400px', position: 'relative' }}>
  <TextCursor
    text="Hello"
    mode="stamp"
    fontSize={28}
    spacing={88}
    maxPoints={7}
    shrink={0.5}
    fade={0.6}
    smoothing={0.3}
    exitDuration={0.5}
    removalInterval={30}
    followMouseDirection={true}
    keepUpright={true}
    randomFloat={true}
    popIn={true}
  />
</div>`,
  css
});
