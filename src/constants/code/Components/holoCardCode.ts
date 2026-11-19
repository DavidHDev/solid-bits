import code from '@content/Components/HoloCard/HoloCard.tsx?raw';
import css from '@content/Components/HoloCard/HoloCard.css?raw';
import { createCodeObject } from '@/types/code';

export const holoCard = createCodeObject(code, 'Components/HoloCard', {
  dependencies: '',
  usage: `import HoloCard from './HoloCard';
import card from './pikachu.webp';

<HoloCard image={card} alt="Pikachu" preset="bursts" />`,
  css
});
