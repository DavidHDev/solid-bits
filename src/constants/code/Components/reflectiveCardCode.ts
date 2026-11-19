import code from '@content/Components/ReflectiveCard/ReflectiveCard.tsx?raw';
import css from '@content/Components/ReflectiveCard/ReflectiveCard.css?raw';
import { createCodeObject } from '@/types/code';

export const reflectiveCard = createCodeObject(code, 'Components/ReflectiveCard', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import ReflectiveCard from './ReflectiveCard';

<ReflectiveCard
  name="Alexander Doe"
  role="Senior Developer"
  videoSrc="/videos/reflection.mp4"
  webcam={false}
  tint="#ffffff"
  metalness={1}
  roughness={0.3}
  blurStrength={6}
  shine={1}
  glare={0.5}
/>`,
  css
});
