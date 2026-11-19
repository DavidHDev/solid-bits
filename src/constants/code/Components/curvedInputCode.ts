import code from '@content/Components/CurvedInput/CurvedInput.tsx?raw';
import css from '@content/Components/CurvedInput/CurvedInput.css?raw';
import { createCodeObject } from '@/types/code';

export const curvedInput = createCodeObject(code, 'Components/CurvedInput', {
  dependencies: '',
  usage: `import CurvedInput from './CurvedInput';

<CurvedInput
  placeholder="david@solid-bits.dev"
  buttonText="Get Started"
  theme="dark"
  bend={28}
  height={64}
  width={450}
  onSubmit={value => console.log(value)}
/>

<CurvedInput
  theme="light"
  bend={0}
  showButton={false}
  showIcon={false}
  placeholder="Search components..."
  type="text"
/>`,
  css
});
