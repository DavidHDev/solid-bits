import code from '@content/Animations/BlobCursor/BlobCursor.tsx?raw';
import css from '@content/Animations/BlobCursor/BlobCursor.css?raw';
import { createCodeObject } from '@/types/code';

export const blobCursor = createCodeObject(code, 'Animations/BlobCursor', {
  dependencies: 'three',
  usage: `import BlobCursor from './BlobCursor';

<div style={{ position: 'relative', height: '500px' }}>
  <BlobCursor material="chrome" color="#3B82F6" size={140} />
</div>`,
  css
});
