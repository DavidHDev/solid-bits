import code from '@content/Micro/CometDial/CometDial.tsx?raw';
import css from '@content/Micro/CometDial/CometDial.css?raw';
import { createCodeObject } from '@/types/code';

export const cometDial = createCodeObject(code, 'Micro/CometDial', {
  dependencies: 'motion',
  usage: `import CometDial from './CometDial';

<CometDial
  defaultValue={62}
  min={0}
  max={100}
  step={1}
  unit="%"
  label="Level"
  accent="#f5f5f5"
  ink="#fdfdfd"
  size={250}
  sweep={320}
  thickness={5}
  speed={25}
  tapBounce={0.2}
  flickBounce={0.1}
  momentum={1}
  cometReach={180}
  cometWidth={12}
  onChange={value => console.log(value)}
  onChangeEnd={(value, { velocity, bounce }) => console.log('settling toward', value, velocity, bounce)}
/>`,
  css
});
