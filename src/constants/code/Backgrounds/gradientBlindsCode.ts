import code from '@content/Backgrounds/GradientBlinds/GradientBlinds.tsx?raw';
import css from '@content/Backgrounds/GradientBlinds/GradientBlinds.css?raw';
import { createCodeObject } from '@/types/code';

export const gradientBlinds = createCodeObject(code, 'Backgrounds/GradientBlinds', {
  dependencies: '',
  usage: `import GradientBlinds from './GradientBlinds';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <GradientBlinds
    gradientColors={['#6ec9f7', '#0aa0ef']}
    angle={20}
    blindCount={16}
    blindMinWidth={60}
    spotlightRadius={0.5}
    shine={0.4}
    relief={0.5}
    glow={0.4}
    sway={0.35}
    hoverTilt={0.6}
    clickEffect="ripple"
    noise={0.3}
  />
</div>`,
  css
});
