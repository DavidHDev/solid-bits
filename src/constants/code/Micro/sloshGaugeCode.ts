import code from '@content/Micro/SloshGauge/SloshGauge.tsx?raw';
import css from '@content/Micro/SloshGauge/SloshGauge.css?raw';
import { createCodeObject } from '@/types/code';

export const sloshGauge = createCodeObject(code, 'Micro/SloshGauge', {
  dependencies: '',
  usage: `import { createSignal } from 'solid-js';
import SloshGauge from './SloshGauge';

<SloshGauge value={progress()} />

const [level, setLevel] = createSignal(60);

<SloshGauge
  value={level()}
  onChange={setLevel}
  interactive
  showValue
  liquidColor="#f5f5f5"
  glassColor="#27272a"
  width={88}
  height={180}
  radius={20}
  ticks={4}
  viscosity={0.15}
  tilt={0.45}
  splash={0.42}
  unit="%"
  ariaLabel="Volume"
/>`,
  css
});
