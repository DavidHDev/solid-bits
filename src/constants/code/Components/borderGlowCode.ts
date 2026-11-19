import code from '@content/Components/BorderGlow/BorderGlow.tsx?raw';
import css from '@content/Components/BorderGlow/BorderGlow.css?raw';
import { createCodeObject } from '@/types/code';

export const borderGlow = createCodeObject(code, 'Components/BorderGlow', {
  dependencies: '',
  usage: `import BorderGlow from './BorderGlow';

<BorderGlow
  edgeSensitivity={30}
  glowColor="40 80 80"
  backgroundColor="#0c0f13"
  borderRadius={28}
  glowRadius={40}
  glowIntensity={1.0}
  coneSpread={25}
  animated={false}
  colors={['#6ec9f7', '#fdba74', '#38bdf8']}
>
  <div style={{ padding: '2em' }}>
    <h2>Your Content Here</h2>
    <p>Hover near the edges to see the glow.</p>
  </div>
</BorderGlow>`,
  css
});
