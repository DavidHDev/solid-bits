import code from '@content/Components/Counter/Counter.tsx?raw';
import css from '@content/Components/Counter/Counter.css?raw';
import { createCodeObject } from '@/types/code';

export const counter = createCodeObject(code, 'Components/Counter', {
  dependencies: '',
  usage: `import Counter from './Counter';

<Counter
  value={1284}
  fontSize={80}
  fontWeight={500}
/>`,
  css
});
