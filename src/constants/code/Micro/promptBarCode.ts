import code from '@content/Micro/PromptBar/PromptBar.tsx?raw';
import css from '@content/Micro/PromptBar/PromptBar.css?raw';
import { createCodeObject } from '@/types/code';

export const promptBar = createCodeObject(code, 'Micro/PromptBar', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import { createSignal } from 'solid-js';
import { Attachment01Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import PromptBar from './PromptBar';

const [busy, setBusy] = createSignal(false);
let controller: AbortController | null = null;

const send = async (text, { attachments, model, effort }) => {
  setBusy(true);
  controller = new AbortController();
  await ask({ text, attachments, model: model?.key, effort, signal: controller.signal }).catch(() => {});
  setBusy(false);
};

<PromptBar
  placeholder="Ask anything"
  sources={[
    { key: 'files', name: 'Photos & files', description: 'Upload from this device', icon: Attachment01Icon, attach: true },
    { key: 'web', name: 'Web search', description: 'Live results', icon: Globe02Icon }
  ]}
  commands={[{ key: 'summarize', name: '/summarize', description: 'Digest the thread so far' }]}
  models={[
    { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
    { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' }
  ]}
  efforts={['Low', 'Medium', 'High', 'Extra', 'Max']}
  busy={busy()}
  onSend={send}
  onStop={() => controller?.abort()}
  onAttach={() => pickFiles()}
  onDictate={() => transcribe()}
  background="#27292b"
  color="#f5f5f5"
  menuBackground="#313437"
  sparkColor="#6ec9f7"
  sparkBoost={1}
  width={400}
  radius={16}
  maxRows={5}
  morphDuration={240}
  squash={0.12}
  tilt={8}
  pressScale={0.96}
/>`,
  css
});
