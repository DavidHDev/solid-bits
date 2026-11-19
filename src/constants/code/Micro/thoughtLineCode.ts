import code from '@content/Micro/ThoughtLine/ThoughtLine.tsx?raw';
import css from '@content/Micro/ThoughtLine/ThoughtLine.css?raw';
import { createCodeObject } from '@/types/code';

export const thoughtLine = createCodeObject(code, 'Micro/ThoughtLine', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import ThoughtLine from './ThoughtLine';

<ThoughtLine
  working={isStreaming()}
  steps={['Reading the question', 'Searching your notes', 'Drafting an answer']}
  label="Thinking…"
  doneLabel="Thought for"
  glyph="sparkle"
  fontSize={16}
  breathPeriod={1.6}
  breathDepth={0.45}
  settleDuration={350}
  settleBlur={2}
  collapsible
  collapseOnSettle
  showTimer
  onSettle={seconds => console.log(\`thought for \${seconds}s\`)}
/>`,
  css
});
