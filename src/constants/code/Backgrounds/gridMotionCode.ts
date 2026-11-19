import code from '@content/Backgrounds/GridMotion/GridMotion.tsx?raw';
import css from '@content/Backgrounds/GridMotion/GridMotion.css?raw';
import { createCodeObject } from '@/types/code';

export const gridMotion = createCodeObject(code, 'Backgrounds/GridMotion', {
  dependencies: '',
  usage: `import GridMotion from './GridMotion';

const items = [
  'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?w=640&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1721407964262-f9864b562453?w=640&q=75&auto=format&fit=crop',
  'Any text works too',
  () => <div>Or your own JSX</div>
];

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <GridMotion
    items={items}
    rows={4}
    aspectRatio={1.33}
    gap={16}
    radius={14}
    angle={-12}
    tilt={0}
    speed={24}
    direction="alternate"
    parallax={0.5}
    spotlight={0.6}
    dim={0.35}
    fade={0.5}
    grayscale={false}
  />
</div>`,
  css
});
