import code from '@content/Components/ScrollStack/ScrollStack.tsx?raw';
import css from '@content/Components/ScrollStack/ScrollStack.css?raw';
import { createCodeObject } from '@/types/code';

export const scrollStack = createCodeObject(code, 'Components/ScrollStack', {
  dependencies: '',
  usage: `import ScrollStack, { ScrollStackItem } from './ScrollStack';

<div style={{ height: '600px' }}>
  <ScrollStack>
    <ScrollStackItem>
      <h2>Card 1</h2>
      <p>This is the first card in the stack</p>
    </ScrollStackItem>
    <ScrollStackItem>
      <h2>Card 2</h2>
      <p>This is the second card in the stack</p>
    </ScrollStackItem>
    <ScrollStackItem>
      <h2>Card 3</h2>
      <p>This is the third card in the stack</p>
    </ScrollStackItem>
  </ScrollStack>
</div>`,
  css
});
