import code from '@content/TextAnimations/SplitText/SplitText.tsx?raw';
import { createCodeObject } from '@/types/code';

export const splitText = createCodeObject(code, 'TextAnimations/SplitText', {
  dependencies: 'gsap',
  usage: `import SplitText from './SplitText';

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

<SplitText
  text="Hello, GSAP!"
  className="text-2xl font-medium text-center"
  effect="rise"
  splitType="chars"
  delay={50}
  duration={1.25}
  staggerFrom="start"
  trigger="view"
  hoverEffect="lift"
  loop={false}
  loopDelay={1.5}
  mask={false}
  threshold={0.1}
  rootMargin="-100px"
  textAlign="center"
  onLetterAnimationComplete={handleAnimationComplete}
/>`
});
