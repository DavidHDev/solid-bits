import code from '@content/Animations/Crosshair/Crosshair.tsx?raw';
import { createCodeObject } from '@/types/code';

export const crosshair = createCodeObject(code, 'Animations/Crosshair', {
  dependencies: '',
  usage: `import { createSignal } from 'solid-js';
import Crosshair from './Crosshair';

const Hero = () => {
  const [container, setContainer] = createSignal<HTMLDivElement | null>(null);

  return (
    <div ref={setContainer} style={{ position: 'relative', height: '400px' }}>
      <Crosshair
        containerRef={container()}
        color="#ffffff"
        targetEffect="lock"
        thickness={1}
        opacity={0.85}
        smoothing={0.35}
        showCoordinates
      />
      <a href="/docs">Read the docs</a>
    </div>
  );
};`
});
