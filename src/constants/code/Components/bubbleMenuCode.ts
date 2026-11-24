import code from '@content/Components/BubbleMenu/BubbleMenu.tsx?raw';
import css from '@content/Components/BubbleMenu/BubbleMenu.css?raw';
import { createCodeObject } from '@/types/code';

export const bubbleMenu = createCodeObject(code, 'Components/BubbleMenu', {
  dependencies: 'gsap',
  usage: `import BubbleMenu from './BubbleMenu';

const items = [
  {
    label: 'home',
    href: '#',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
  },
  {
    label: 'about',
    href: '#',
    ariaLabel: 'About',
    rotation: 8,
    hoverStyles: { bgColor: '#107fb9', textColor: '#ffffff' }
  },
  {
    label: 'projects',
    href: '#',
    ariaLabel: 'Projects',
    rotation: 8,
    hoverStyles: { bgColor: '#0ba4f5', textColor: '#ffffff' }
  },
  {
    label: 'blog',
    href: '#',
    ariaLabel: 'Blog',
    rotation: 8,
    hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' }
  },
  {
    label: 'contact',
    href: '#',
    ariaLabel: 'Contact',
    rotation: -8,
    hoverStyles: { bgColor: '#0aa0ef', textColor: '#ffffff' }
  }
];

<BubbleMenu
  logo={<span style={{ 'font-weight': 500 }}>SB</span>}
  items={items}
  menuAriaLabel="Toggle navigation"
  menuBg="#ffffff"
  menuContentColor="#111111"
  useFixedPosition={false}
  animationEase="back.out(1.5)"
  animationDuration={0.5}
  staggerDelay={0.12}
/>`,
  css
});
