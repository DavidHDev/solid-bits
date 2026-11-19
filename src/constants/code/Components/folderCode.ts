import code from '@content/Components/Folder/Folder.tsx?raw';
import css from '@content/Components/Folder/Folder.css?raw';
import { createCodeObject } from '@/types/code';

export const folder = createCodeObject(code, 'Components/Folder', {
  dependencies: '',
  usage: `import Folder from './Folder';

const items = [
  { title: 'Brand guidelines' },
  { title: 'Launch plan' },
  { image: '/photos/pier.jpg', title: 'The pier' }
];

<Folder
  label="Projects"
  items={items}
  onItemClick={(item, index) => console.log(item, index)}
/>

<Folder mode="book" variant="glass" color="#6ec9f7" label="Photos" items={items} />`,
  css
});
