import code from '@content/Micro/SwipeToast/SwipeToast.tsx?raw';
import css from '@content/Micro/SwipeToast/SwipeToast.css?raw';
import { createCodeObject } from '@/types/code';

export const swipeToast = createCodeObject(code, 'Micro/SwipeToast', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import { createSignal, For } from 'solid-js';
import SwipeToast from './SwipeToast';

const [open, setOpen] = createSignal(true);

<SwipeToast
  open={open()}
  onClose={reason => setOpen(false)}
  title="File archived"
  description="Moved to Archive"
  actionLabel="Undo"
  onAction={() => restore()}
  background="#27272a"
  color="#f5f5f5"
  fuseColor="#24adf5"
  width={356}
  radius={12}
  slideMs={400}
  settleBounce={0.2}
  swipeDistance={40}
  duration={4000}
  fuse="bottom"
  pauseOnHover
  closeButton={false}
/>

const [toasts, setToasts] = createSignal<{ id: number }[]>([]);
const notify = () => setToasts(t => [...t, { id: Date.now() }]);

<div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-end', gap: '10px' }}>
  <For each={toasts()}>
    {t => (
      <SwipeToast inline title="Link copied" duration={2500} onClose={() => setToasts(s => s.filter(x => x.id !== t.id))} />
    )}
  </For>
</div>`,
  css
});
