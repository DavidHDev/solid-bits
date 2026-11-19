import code from '@content/Backgrounds/Topography/Topography.tsx?raw';
import css from '@content/Backgrounds/Topography/Topography.css?raw';
import { createCodeObject } from '@/types/code';

export const topography = createCodeObject(code, 'Backgrounds/Topography', {
  dependencies: '',
  usage: `import Topography from './Topography';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Topography
    color="#6ec9f7"
    lineCount={22}
    lineWidth={1.2}
    elevation={1}
    foreground={0.2}
    tilt={32}
    speed={0.25}
    direction="forward"
    glow={0.6}
    depthOfField={0.4}
    fog={0.35}
    hoverEffect="lift"
    clickEffect="pulse"
  />
</div>`,
  css
});
