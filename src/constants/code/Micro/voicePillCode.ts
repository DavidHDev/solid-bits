import code from '@content/Micro/VoicePill/VoicePill.tsx?raw';
import css from '@content/Micro/VoicePill/VoicePill.css?raw';
import { createCodeObject } from '@/types/code';

export const voicePill = createCodeObject(code, 'Micro/VoicePill', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import VoicePill from './VoicePill';

<VoicePill
  accentColor="#f5f5f5"
  iconColor="#a1a1aa"
  background="#27272a"
  size={28}
  shape="pill"
  reach={8}
  showTime
  waveform
  slideToCancel
  cancelDistance={64}
  attack={40}
  release={240}
  sensitivity={1}
  floor={0.1}
  openDuration={200}
  pressScale={0.95}
  mode="auto"
  holdAfter={300}
  reactive="simulated"
  onStart={({ source }) => startRecording(source)}
  onStop={({ reason, duration }) => stopRecording(reason, duration)}
/>`,
  css
});
