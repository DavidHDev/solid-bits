import code from '@content/Components/PillNav/PillNav.tsx?raw';
import css from '@content/Components/PillNav/PillNav.css?raw';
import { createCodeObject } from '@/types/code';

export const pillNav = createCodeObject(code, 'Components/PillNav', {
  dependencies: '',
  usage: `import PillNav from './PillNav';
import logo from './logo.svg';

<PillNav
  logo={logo}
  logoAlt="Company"
  items={[
    { label: 'Home', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Photos', href: '/photos' },
    { label: 'About', href: '/about' }
  ]}
  activeHref="/"
  itemStyle="pill"
  hoverEffect="fill"
  indicator="dot"
/>`,
  css
});
