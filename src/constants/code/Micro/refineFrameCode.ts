import code from '@content/Micro/RefineFrame/RefineFrame.tsx?raw';
import css from '@content/Micro/RefineFrame/RefineFrame.css?raw';
import { createCodeObject } from '@/types/code';

export const refineFrame = createCodeObject(code, 'Micro/RefineFrame', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import RefineFrame from './RefineFrame';

<RefineFrame
  status={job.status}
  aspectRatio="4 / 3"
  width={320}
  radius={16}
  background="#27272a"
  color="#f5f5f5"
  stageDuration={400}
  sweep
  showStatus
  hideAfter={1200}
  retryLabel="Retry"
  onRetry={() => job.restart()}
>
  <img src={job.url} alt={job.prompt} crossorigin="anonymous" />
</RefineFrame>`,
  css
});
