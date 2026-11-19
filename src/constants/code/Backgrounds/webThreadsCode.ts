import code from '@content/Backgrounds/WebThreads/WebThreads.tsx?raw';
import css from '@content/Backgrounds/WebThreads/WebThreads.css?raw';
import { createCodeObject } from '@/types/code';

export const webThreads = createCodeObject(code, 'Backgrounds/WebThreads', {
  dependencies: '',
  usage: `import WebThreads from './WebThreads';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <WebThreads
    colors={['#0aa0ef', '#6ec9f7']}
    coreColor="#FFFFFF"
    threadCount={6}
    spread={0.18}
  />
</div>`,
  css
});
