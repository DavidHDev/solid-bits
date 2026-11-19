import code from '@content/TextAnimations/VariableProximity/VariableProximity.tsx?raw';
import css from '@content/TextAnimations/VariableProximity/VariableProximity.css?raw';
import { createCodeObject } from '@/types/code';

export const variableProximity = createCodeObject(code, 'TextAnimations/VariableProximity', {
  dependencies: '',
  usage: `import VariableProximity from './VariableProximity';

const containerRef: { current: HTMLDivElement | null } = { current: null };

<div
  ref={el => (containerRef.current = el)}
  style={{ position: 'relative' }}
>
  <VariableProximity
    label={'Hover me! And then star Solid Bits on GitHub, or else...'}
    className={'variable-proximity-demo'}
    fromFontVariationSettings="'wght' 400, 'opsz' 9"
    toFontVariationSettings="'wght' 1000, 'opsz' 40"
    containerRef={containerRef}
    radius={100}
    falloff="linear"
    smoothing={0.2}
    scale={1}
    lift={0}
    idleWave={false}
    fontSize={64}
  />
</div>`,
  css
});
