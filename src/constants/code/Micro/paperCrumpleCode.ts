import code from '@content/Micro/PaperCrumple/PaperCrumple.tsx?raw';
import css from '@content/Micro/PaperCrumple/PaperCrumple.css?raw';
import { createCodeObject } from '@/types/code';

export const paperCrumple = createCodeObject(code, 'Micro/PaperCrumple', {
  dependencies: 'three',
  usage: `import PaperCrumple from './PaperCrumple';

<PaperCrumple
  src="/your-image.png"
  alt="A print to crumple"
  width={320}
  height={400}
  sceneHeight={560}
  releaseBehavior="restore"
  crumpleAmount={0.85}
  crumpleDuration={0.55}
  releaseDuration={0.4}
  foldCount={6}
  foldSharpness={0.6}
  wrinkleDepth={0.65}
  creaseStrength={0.18}
  paperColor="#f4f0e8"
  paperTexture={0.08}
  draggable
  returnToOrigin
/>`,
  css
});
