import code from '@content/Components/CardNav/CardNav.tsx?raw';
import css from '@content/Components/CardNav/CardNav.css?raw';
import { createCodeObject } from '@/types/code';

export const cardNav = createCodeObject(code, 'Components/CardNav', {
  dependencies: '@hugeicons/core-free-icons',
  usage: `import CardNav from './CardNav';
import logo from './logo.svg';

const items = [
  {
    label: 'About',
    description: 'The people and the story behind the studio.',
    links: [
      { label: 'Company', href: '/company' },
      { label: 'Careers', href: '/careers' }
    ]
  },
  {
    label: 'Projects',
    description: 'Selected work from the last few years.',
    links: [
      { label: 'Featured', href: '/featured' },
      { label: 'Case studies', href: '/case-studies' }
    ]
  },
  {
    label: 'Contact',
    description: 'Say hello, we read everything.',
    links: [
      { label: 'Email', href: 'mailto:hello@example.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' }
    ]
  }
];

<CardNav
  logo={logo}
  logoAlt="Company"
  items={items}
  cta={{ label: 'Get started', href: '/signup' }}
  cardEffect="rise"
  openOn="click"
/>`,
  css
});
