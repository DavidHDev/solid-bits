import code from '@content/Components/TiltedCard/TiltedCard.tsx?raw';
import css from '@content/Components/TiltedCard/TiltedCard.css?raw';
import { createCodeObject } from '@/types/code';

export const tiltedCard = createCodeObject(code, 'Components/TiltedCard', {
  dependencies: '',
  usage: `import TiltedCard, { TiltedCardLayer } from './TiltedCard';

<TiltedCard
  imageSrc="https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop"
  altText="Sunset clouds"
  captionText="Afterglow"
  containerHeight="320px"
  containerWidth="320px"
  imageHeight="320px"
  imageWidth="320px"
  rotateAmplitude={12}
  scaleOnHover={1.05}
  glare={0.5}
  shadow={0.5}
  backContent={<p style={{ padding: '20px' }}>The back of the card</p>}
>
  <TiltedCardLayer depth={30}>
    <h3 style={{ position: 'absolute', left: '20px', bottom: '16px', color: '#fff', 'font-weight': 500 }}>Afterglow</h3>
  </TiltedCardLayer>
</TiltedCard>`,
  css
});
