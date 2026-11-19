import code from '@content/Micro/SlingButton/SlingButton.tsx?raw';
import css from '@content/Micro/SlingButton/SlingButton.css?raw';
import { createCodeObject } from '@/types/code';

export const slingButton = createCodeObject(code, 'Micro/SlingButton', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import SlingButton from './SlingButton';

<SlingButton
  onSend={() => sendMessage()}
  padColor="#f5f5f5"
  iconColor="#18181b"
  accentColor="#f5f5f5"
  wellColor="#27272a"
  bandColor="#52525b"
  size={56}
  strokeWidth={3}
  armAt={48}
  maxPull={160}
  launchSpeed={2600}
  recoil={0.2}
  flight={120}
  particles={14}
  spread={60}
  axis="any"
  tapSends
/>`,
  css
});
