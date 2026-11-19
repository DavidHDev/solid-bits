import code from '@content/TextAnimations/BlurText/BlurText.tsx?raw';
import { createCodeObject } from '@/types/code';

export const blurText = createCodeObject(code, 'TextAnimations/BlurText', {
  dependencies: 'motion',
  usage: `import BlurText from './BlurText';

const handleAnimationComplete = () => {
  console.log('Animation completed!');
};

<BlurText
  text="Isn't this so cool?!"
  effect="blur"
  animateBy="words"
  direction="top"
  staggerFrom="start"
  trigger="view"
  delay={200}
  stepDuration={0.35}
  blur={10}
  distance={50}
  onAnimationComplete={handleAnimationComplete}
  className="text-2xl mb-8"
/>`
});
