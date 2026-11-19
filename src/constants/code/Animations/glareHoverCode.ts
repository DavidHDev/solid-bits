import code from '@content/Animations/GlareHover/GlareHover.tsx?raw';
import css from '@content/Animations/GlareHover/GlareHover.css?raw';
import { createCodeObject } from '@/types/code';

export const glareHover = createCodeObject(code, 'Animations/GlareHover', {
  dependencies: '',
  usage: `import GlareHover from './GlareHover';

<GlareHover
  width="360px"
  height="240px"
  borderRadius="20px"
  mode="hover"
  variant="streak"
  glareColor="#ffffff"
  glareOpacity={0.5}
  glareSize={30}
  softness={0.6}
  glareAngle={-45}
  blendMode="screen"
  rimGlint={true}
  transitionDuration={650}
>
  <img src="/photo.jpg" alt="" style={{ width: '100%', height: '100%', 'object-fit': 'cover' }} />
</GlareHover>`,
  css
});
