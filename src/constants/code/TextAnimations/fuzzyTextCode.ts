import code from '@content/TextAnimations/FuzzyText/FuzzyText.tsx?raw';
import { createCodeObject } from '@/types/code';

export const fuzzyText = createCodeObject(code, 'TextAnimations/FuzzyText', {
  dependencies: '',
  usage: `import FuzzyText from './FuzzyText';

<FuzzyText
  colorSplit={0}
  trigger="hover"
  direction="horizontal"
  baseIntensity={0.2}
  hoverIntensity={0.5}
  fuzzRange={30}
  sliceSize={1}
  fps={60}
  transitionDuration={0}
  intro={true}
  introDuration={1400}
  letterSpacing={0}
  enableHover={true}
  clickEffect={false}
  glitchMode={false}
  glitchInterval={2000}
  glitchDuration={200}
>
  404
</FuzzyText>`
});
