import code from '@content/Backgrounds/AeroShards/AeroShards.tsx?raw';
import css from '@content/Backgrounds/AeroShards/AeroShards.css?raw';
import { createCodeObject } from '@/types/code';

export const aeroShards = createCodeObject(code, 'Backgrounds/AeroShards', {
  dependencies: 'vgpu @vgpu/wgsl',
  usage: `import AeroShards from './AeroShards';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <AeroShards
    shardColor="#6496CF"
    accentColor="#6ec9f7"
    placement="full"
    material="glass"
    markers="plus"
    count={1300}
    depthOfField={0.75}
    vignette={0.3}
    mouseInteraction
    pulseOnClick
    holdToGather
  />
</div>`,
  css
});
