import code from '@content/Components/GlassIcons/GlassIcons.tsx?raw';
import css from '@content/Components/GlassIcons/GlassIcons.css?raw';
import { createCodeObject } from '@/types/code';

export const glassIcons = createCodeObject(code, 'Components/GlassIcons', {
  dependencies: '',
  usage: `import GlassIcons from './GlassIcons';
import {
  Folder01Icon,
  Book02Icon,
  FavouriteIcon,
  CloudIcon,
  Note01Icon,
  ChartHistogramIcon
} from '@hugeicons/core-free-icons';

type IconData = readonly (readonly [string, Record<string, string | number>])[];

const glyph = (icon: IconData) => (
  <svg
    width="24"
    height="24"
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
  { icon: glyph(Folder01Icon), color: 'blue', label: 'Files', href: '/files' },
  { icon: glyph(Book02Icon), color: 'teal', label: 'Books' },
  { icon: glyph(FavouriteIcon), color: 'red', label: 'Health' },
  { icon: glyph(CloudIcon), color: 'linear-gradient(135deg, hsl(200, 92%, 74%), hsl(208, 76%, 56%))', label: 'Weather' },
  { icon: glyph(Note01Icon), color: 'orange', label: 'Notes' },
  { icon: glyph(ChartHistogramIcon), color: 'green', label: 'Stats', onClick: () => {} }
];

<div style={{ height: '600px', position: 'relative' }}>
  <GlassIcons
    items={items}
    size={82}
    gap={66}
    columns={3}
    roundness={0.6}
    refraction={0.8}
    bevel={0.6}
    dispersion={0}
    frost={0.2}
    shine={0.85}
    tint="#dfdfdf"
    tintOpacity={0.2}
    iconColor="#ffffff"
    plate="tilt"
    tilt={30}
    spread={0.5}
    hover="press"
    parallax={1}
    labels="hover"
    intro={true}
    theme="dark"
  />
</div>`,
  css
});
