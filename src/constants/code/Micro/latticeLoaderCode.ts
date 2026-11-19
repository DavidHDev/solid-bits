import code from '@content/Micro/LatticeLoader/LatticeLoader.tsx?raw';
import css from '@content/Micro/LatticeLoader/LatticeLoader.css?raw';
import { createCodeObject } from '@/types/code';

export const latticeLoader = createCodeObject(code, 'Micro/LatticeLoader', {
  dependencies: '',
  usage: `import LatticeLoader from './LatticeLoader';

<LatticeLoader
  status={isDone() ? 'done' : 'working'}
  label="Thinking"
  doneLabel="Done in"
  errorLabel="Failed after"
  pattern="orbit"
  grid={3}
  shape="round"
  doneColor="#22c55e"
  errorColor="#ef4444"
  cellSize={6}
  gap={2}
  fontSize={14}
  step={90}
  idleOpacity={0.15}
  glow={false}
  glowColor=""
  showTimer
/>`,
  css
});
