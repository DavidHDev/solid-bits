import code from '@content/Components/ElasticSlider/ElasticSlider.tsx?raw';
import css from '@content/Components/ElasticSlider/ElasticSlider.css?raw';
import { createCodeObject } from '@/types/code';

export const elasticSlider = createCodeObject(code, 'Components/ElasticSlider', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import ElasticSlider from './ElasticSlider';

<ElasticSlider
  defaultValue={50}
  maxValue={100}
  onChange={value => console.log(value)}
/>`,
  css
});
