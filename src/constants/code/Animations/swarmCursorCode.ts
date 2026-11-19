import code from '@content/Animations/SwarmCursor/SwarmCursor.tsx?raw';
import css from '@content/Animations/SwarmCursor/SwarmCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const swarmCursor = createCodeObject(code, 'Animations/SwarmCursor', {
  dependencies: '',
  usage: `import SwarmCursor from './SwarmCursor';

<div style={{ position: 'relative', width: '100%', height: '600px' }}>
  <SwarmCursor
    count={800}
    size={2.6}
    spread={90}
    swirl={0.6}
    clickEffect="burst"
  >
    <h1>Your content here</h1>
  </SwarmCursor>
</div>`,
  css
});
