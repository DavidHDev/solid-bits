import code from '@content/Animations/ClickSpark/ClickSpark.tsx?raw';
import { createCodeObject } from '@/types/code';

export const clickSpark = createCodeObject(code, 'Animations/ClickSpark', {
  dependencies: '',
  usage: `import ClickSpark from './ClickSpark';

<ClickSpark
  sparkColor="#fff"
  shape="line"
  sparkCount={8}
  sparkSize={14}
  sparkRadius={30}
  duration={500}
>
  <button type="button">Like</button>
</ClickSpark>`
});
