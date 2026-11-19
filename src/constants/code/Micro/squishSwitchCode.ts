import code from '@content/Micro/SquishSwitch/SquishSwitch.tsx?raw';
import css from '@content/Micro/SquishSwitch/SquishSwitch.css?raw';
import { createCodeObject } from '@/types/code';

export const squishSwitch = createCodeObject(code, 'Micro/SquishSwitch', {
  dependencies: 'motion',
  usage: `import { createSignal } from 'solid-js';
import SquishSwitch from './SquishSwitch';

const [airplane, setAirplane] = createSignal(false);

<SquishSwitch
  checked={airplane()}
  onChange={setAirplane}
  label="Airplane mode"
  trackColor="#27272a"
  trackOnColor="#f5f5f5"
  width={76}
  height={38}
  radius={19}
  speed={50}
  stretch={36}
  hoverScale={1.035}
  colorDuration={320}
/>`,
  css
});
