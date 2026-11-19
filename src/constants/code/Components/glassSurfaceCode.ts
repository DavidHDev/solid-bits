import code from '@content/Components/GlassSurface/GlassSurface.tsx?raw';
import css from '@content/Components/GlassSurface/GlassSurface.css?raw';
import { createCodeObject } from '@/types/code';

export const glassSurface = createCodeObject(code, 'Components/GlassSurface', {
  dependencies: '',
  usage: `import GlassSurface from './GlassSurface';

<GlassSurface
  width={320}
  height={76}
  borderRadius={38}
  distortionScale={-180}
  displace={0.5}
  backgroundOpacity={0.1}
>
  <span>Your content</span>
</GlassSurface>

<GlassSurface shape="/logo.svg" width={280} height={280} />

let photo: HTMLImageElement | undefined;

<img ref={el => (photo = el)} src="/photo.jpg" alt="" />
<GlassSurface backdrop={() => photo} width={320} height={76} borderRadius={38} />`,
  css
});
