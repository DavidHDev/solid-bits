import code from '@content/Components/DomeGallery/DomeGallery.tsx?raw';
import css from '@content/Components/DomeGallery/DomeGallery.css?raw';
import { createCodeObject } from '@/types/code';

export const domeGallery = createCodeObject(code, 'Components/DomeGallery', {
  dependencies: '@use-gesture/vanilla',
  usage: `import DomeGallery from './DomeGallery';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DomeGallery />
    </div>
  );
}`,
  css
});
