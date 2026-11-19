import code from '@content/Components/Dock/Dock.tsx?raw';
import css from '@content/Components/Dock/Dock.css?raw';
import { createCodeObject } from '@/types/code';

export const dock = createCodeObject(code, 'Components/Dock', {
  dependencies: '',
  usage: `import Dock from './Dock';
import { Delete02Icon, Home01Icon, Mail01Icon, MusicNote03Icon, Settings01Icon } from '@hugeicons/core-free-icons';

type IconData = readonly (readonly [string, Record<string, string | number>])[];

const glyph = (icon: IconData) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    innerHTML={icon
      .map(([tag, attrs]) => {
        const parts = Object.entries(attrs)
          .filter(([key]) => key !== 'key')
          .map(([key, value]) => {
            const name = key.replace(/[A-Z]/g, char => '-' + char.toLowerCase());
            return name + '="' + (name === 'stroke-width' ? 1.8 : value) + '"';
          });
        return '<' + tag + ' ' + parts.join(' ') + '></' + tag + '>';
      })
      .join('')}
  />
);

const items = [
  {
    icon: glyph(Home01Icon),
    label: 'Home',
    active: true,
    onClick: () => console.log('Home'),
    menu: [
      { label: 'New Window', onClick: () => console.log('New Window') },
      { separator: true },
      { label: 'Options', items: [{ label: 'Open at Login', checked: true }, { label: 'Show in Finder' }] },
      { separator: true },
      { label: 'Quit', onClick: () => console.log('Quit') }
    ]
  },
  { icon: glyph(Mail01Icon), label: 'Mail', badge: 3, onClick: () => console.log('Mail') },
  { icon: glyph(MusicNote03Icon), label: 'Music', active: true, onClick: () => console.log('Music') },
  { icon: glyph(Settings01Icon), label: 'Settings', onClick: () => console.log('Settings') },
  { separator: true },
  { icon: glyph(Delete02Icon), label: 'Trash', onClick: () => console.log('Trash') }
];

<div style={{ position: 'relative', height: '400px' }}>
  <Dock
    items={items}
    baseItemSize={50}
    magnification={70}
    panelHeight={68}
  />
</div>`,
  css
});
