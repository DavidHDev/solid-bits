import code from '@content/Micro/CodeSlots/CodeSlots.tsx?raw';
import css from '@content/Micro/CodeSlots/CodeSlots.css?raw';
import { createCodeObject } from '@/types/code';

export const codeSlots = createCodeObject(code, 'Micro/CodeSlots', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import { createSignal } from 'solid-js';
import CodeSlots, { type CodeSlotsStatus } from './CodeSlots';

const [status, setStatus] = createSignal<CodeSlotsStatus>('idle');

<CodeSlots
  length={6}
  status={status()}
  onChange={() => setStatus('idle')}
  onComplete={async code => {
    const ok = await verify(code);
    setStatus(ok ? 'success' : 'error');
  }}
  accentColor="#f5f5f5"
  inkColor="#f5f5f5"
  slotColor="#27272a"
  digitColor="#18181b"
  dangerColor="#ff3b30"
  slotSize={44}
  gap={8}
  radius={12}
  bounce={0.2}
  settle={0.3}
  rise={8}
  cascade={20}
/>`,
  css
});
