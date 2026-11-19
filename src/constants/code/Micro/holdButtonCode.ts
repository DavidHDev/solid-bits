import code from '@content/Micro/HoldButton/HoldButton.tsx?raw';
import css from '@content/Micro/HoldButton/HoldButton.css?raw';
import { createCodeObject } from '@/types/code';

export const holdButton = createCodeObject(code, 'Micro/HoldButton', {
  dependencies: '',
  usage: `import HoldButton from './HoldButton';

<HoldButton
  doneLabel="Deleted"
  backgroundColor="#26282b"
  fillColor="#0aa0ef"
  textColor="#f5f5f5"
  fillTextColor="#ffffff"
  size="md"
  radius={14}
  fillDirection="right"
  holdTime={2000}
  releaseTime={200}
  pressScale={0.97}
  wave
  waveAmplitude={6}
  glow
  resetAfter={1200}
  onHold={() => console.log('confirmed')}
>
  Hold to delete
</HoldButton>`,
  css
});
