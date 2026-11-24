import code from '@content/Micro/FuseButton/FuseButton.tsx?raw';
import css from '@content/Micro/FuseButton/FuseButton.css?raw';
import { createCodeObject } from '@/types/code';

export const fuseButton = createCodeObject(code, 'Micro/FuseButton', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import FuseButton from './FuseButton';

<FuseButton
  label="Archive"
  doneLabel="Archived"
  undoLabel="Undo"
  color="#f5f5f5"
  background="#27272a"
  fuseColor="#24adf5"
  size="md"
  radius={22}
  undoWindow={4000}
  fuse="outline"
  fuseThickness={1.5}
  crossfadeMs={200}
  commitOn="press"
  pauseOnHover
  settle="reset"
  onCommit={() => archive(item)}
  onUndo={() => restore(item)}
  onFuseEnd={() => purge(item)}
/>`,
  css
});
