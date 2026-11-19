import code from '@content/Backgrounds/Galaxy/Galaxy.tsx?raw';
import css from '@content/Backgrounds/Galaxy/Galaxy.css?raw';
import { createCodeObject } from '@/types/code';

export const galaxy = createCodeObject(code, 'Backgrounds/Galaxy', {
  dependencies: '',
  usage: `import Galaxy from './Galaxy';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Galaxy
    density={1}
    glowIntensity={0.3}
    flareIntensity={1}
    starSpeed={0.5}
    mouseRepulsion
    clickWarp
  />
</div>`,
  css
});
