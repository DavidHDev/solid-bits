import code from '@content/Animations/TargetCursor/TargetCursor.tsx?raw';
import css from '@content/Animations/TargetCursor/TargetCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const targetCursor = createCodeObject(code, 'Animations/TargetCursor', {
  dependencies: '',
  usage: `import TargetCursor from './TargetCursor';

export default function App() {
  return (
    <div>
      <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn />

      <h1>Hover over the elements below</h1>
      <button class="cursor-target" data-cursor-label="Open">Click me!</button>
      <div class="cursor-target">Hover target</div>
    </div>
  );
}`,
  css
});
