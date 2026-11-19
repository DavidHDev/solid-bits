import code from '@content/Animations/LaserFlow/LaserFlow.tsx?raw';
import css from '@content/Animations/LaserFlow/LaserFlow.css?raw';
import { createCodeObject } from '@/types/code';

export const laserFlow = createCodeObject(code, 'Animations/LaserFlow', {
  dependencies: '',
  usage: `import LaserFlow from './LaserFlow';

export default function Hero() {
  let cardRef: HTMLDivElement | undefined;

  return (
    <div style={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
      <LaserFlow
        surfaceRef={() => cardRef}
        beamPosition={0.6}
        color="#3892ff"
        intensity={1.8}
        flare={1.5}
        spread={1.5}
        spill={1}
        fog={0.2}
        dust={1.6}
        revealImage="/your-ui.png"
        revealRadius={220}
        revealOpacity={0.6}
      />

      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '18%',
          right: '28%',
          top: '52%',
          bottom: '-24px',
          'border-radius': '14px',
          background: '#090b0e'
        }}
      />
    </div>
  );
}`,
  css
});
