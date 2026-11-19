import code from '@content/Animations/StickerPeel/StickerPeel.tsx?raw';
import css from '@content/Animations/StickerPeel/StickerPeel.css?raw';
import { createCodeObject } from '@/types/code';

export const stickerPeel = createCodeObject(code, 'Animations/StickerPeel', {
  dependencies: '',
  usage: `import StickerPeel from './StickerPeel';
import logo from './assets/sticker.png';

<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <StickerPeel
    imageSrc={logo}
    width={200}
    finish="gloss"
    peelBackHoverPct={25}
    peelBackActivePct={40}
  />
</div>`,
  css
});
