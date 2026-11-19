import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';

import LogoLoop, { type LogoItem, type LogoLoopProps } from '@/content/Animations/LogoLoop/LogoLoop';
import { logoLoop } from '@/constants/code/Animations/logoLoopCode';

type Layout = NonNullable<LogoLoopProps['layout']>;
type Direction = NonNullable<LogoLoopProps['direction']>;
type Labels = NonNullable<LogoLoopProps['labels']>;

const ICON_PATHS: Record<string, string> = {
  solid:
    'M11.558.788A9.082 9.082 0 0 0 9.776.99l-.453.15c-.906.303-1.656.755-2.1 1.348l-.301.452-2.035 3.528c.426-.387.974-.698 1.643-.894h.001l.613-.154h.001a8.82 8.82 0 0 1 1.777-.206c2.916-.053 6.033 1.148 8.423 2.36 2.317 1.175 3.888 2.32 3.987 2.39L24 5.518c-.082-.06-1.66-1.21-3.991-2.386-2.393-1.206-5.521-2.396-8.45-2.343zM8.924 5.366a8.634 8.634 0 0 0-1.745.203l-.606.151c-1.278.376-2.095 1.16-2.43 2.108-.334.948-.188 2.065.487 3.116.33.43.747.813 1.216 1.147L12.328 10h.001a6.943 6.943 0 0 1 6.013 1.013l2.844-.963c-.17-.124-1.663-1.2-3.91-2.34-2.379-1.206-5.479-2.396-8.352-2.344zm5.435 4.497a6.791 6.791 0 0 0-1.984.283L2.94 13.189 0 18.334l9.276-2.992a6.945 6.945 0 0 1 7.408 2.314v.001c.695.903.89 1.906.66 2.808l2.572-4.63c.595-1.041.45-2.225-.302-3.429a6.792 6.792 0 0 0-5.255-2.543zm-3.031 5.341a6.787 6.787 0 0 0-2.006.283L.008 18.492c.175.131 2.02 1.498 4.687 2.768 2.797 1.332 6.37 2.467 9.468 1.712l.454-.152h.002c1.278-.376 2.134-1.162 2.487-2.09.353-.93.207-2.004-.541-2.978a6.791 6.791 0 0 0-5.237-2.548z',
  vite: 'm8.286 10.578.512-8.657a.306.306 0 0 1 .247-.282L17.377.006a.306.306 0 0 1 .353.385l-1.558 5.403a.306.306 0 0 0 .352.385l2.388-.46a.306.306 0 0 1 .332.438l-6.79 13.55-.123.19a.294.294 0 0 1-.252.14c-.177 0-.35-.152-.305-.369l1.095-5.301a.306.306 0 0 0-.388-.355l-1.433.435a.306.306 0 0 1-.389-.354l.69-3.375a.306.306 0 0 0-.37-.36l-2.32.536a.306.306 0 0 1-.374-.316zm14.976-7.926L17.284 3.74l-.544 1.887 2.077-.4a.8.8 0 0 1 .84.369.8.8 0 0 1 .034.783L12.9 19.93l-.013.025-.015.023-.122.19a.801.801 0 0 1-.672.37.826.826 0 0 1-.634-.302.8.8 0 0 1-.16-.67l1.029-4.981-1.12.34a.81.81 0 0 1-.86-.262.802.802 0 0 1-.165-.67l.63-3.08-2.027.468a.808.808 0 0 1-.768-.233.81.81 0 0 1-.217-.6l.389-6.57-7.44-1.33a.612.612 0 0 0-.64.906L11.58 23.691a.612.612 0 0 0 1.066-.004l11.26-20.135a.612.612 0 0 0-.644-.9z',
  typescript:
    'M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z',
  tailwind:
    'M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z',
  vercel: 'M24 22.525H0l12-21.05 12 21.05z',
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  docker:
    'M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z',
  prisma:
    'M21.8068 18.2848L13.5528.7565c-.207-.4382-.639-.7273-1.1286-.7541-.5023-.0293-.9523.213-1.2062.6253L2.266 15.1271c-.2773.4518-.2718 1.0091.0158 1.4555l4.3759 6.7786c.2608.4046.7127.6388 1.1823.6388.1332 0 .267-.0188.3987-.0577l12.7019-3.7568c.3891-.1151.7072-.3904.8737-.7553s.1633-.7828-.0075-1.1454zm-1.8481.7519L9.1814 22.2242c-.3292.0975-.6448-.1873-.5756-.5194l3.8501-18.4386c.072-.3448.5486-.3996.699-.0803l7.1288 15.138c.1344.2856-.019.6224-.325.7128z',
  supabase:
    'M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z',
  stripe:
    'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z'
};

const icon = (d: string) => () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

const items: LogoItem[] = [
  { node: icon(ICON_PATHS.solid), title: 'Solid', href: 'https://www.solidjs.com', hoverColor: '#6ec9f7' },
  { node: icon(ICON_PATHS.vite), title: 'Vite', href: 'https://vite.dev' },
  {
    node: icon(ICON_PATHS.typescript),
    title: 'TypeScript',
    href: 'https://www.typescriptlang.org',
    hoverColor: '#3178c6'
  },
  { node: icon(ICON_PATHS.tailwind), title: 'Tailwind CSS', href: 'https://tailwindcss.com', hoverColor: '#38bdf8' },
  { node: icon(ICON_PATHS.vercel), title: 'Vercel', href: 'https://vercel.com' },
  { node: icon(ICON_PATHS.github), title: 'GitHub', href: 'https://github.com' },
  { node: icon(ICON_PATHS.docker), title: 'Docker', href: 'https://www.docker.com', hoverColor: '#2496ed' },
  { node: icon(ICON_PATHS.prisma), title: 'Prisma', href: 'https://www.prisma.io' },
  { node: icon(ICON_PATHS.supabase), title: 'Supabase', href: 'https://supabase.com', hoverColor: '#3ecf8e' },
  { node: icon(ICON_PATHS.stripe), title: 'Stripe', href: 'https://stripe.com' }
];

const customRender = (item: LogoItem): JSX.Element => (
  <div
    style={{
      padding: '0.18em',
      'border-radius': '0.22em',
      border: '1px solid var(--border-primary)',
      background: 'var(--surface-ghost)',
      'line-height': 0
    }}
  >
    {'node' in item ? typeof item.node === 'function' ? item.node() : item.node : <img src={item.src} alt={item.alt} />}
  </div>
);

const LOOK = {
  layout: 'line' as Layout,
  direction: 'left' as Direction,
  labels: 'none' as Labels,
  speed: 100,
  hoverSpeed: 0,
  logoHeight: 48,
  gap: 56,
  bend: 0.5,
  focus: 0,
  magnify: 0,
  muted: 0,
  tiltX: 0,
  tiltY: 0,
  fadeOut: true,
  fadeOutWidth: 0.12,
  scrollBoost: 0,
  step: false,
  scaleOnHover: true
};

type Look = typeof LOOK;

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  draggable: true,
  intro: true,
  useCustomRender: false
};

const PRESETS: Record<string, Partial<Look>> = {
  classic: {},
  minimal: { logoHeight: 36, gap: 72, speed: 60, muted: 0.6, scaleOnHover: false },
  stack: { labels: 'inline', logoHeight: 32, gap: 56, speed: 80, scaleOnHover: false },
  dock: { magnify: 0.8, labels: 'hover', muted: 0.5, logoHeight: 44, gap: 44, scaleOnHover: false },
  spotlight: { focus: 0.7, step: true, labels: 'hover', muted: 0.4, logoHeight: 44, scaleOnHover: false },
  wave: { layout: 'wave', bend: 0.6, scaleOnHover: false },
  arc: { layout: 'arc', bend: 0.6, scaleOnHover: false },
  orbit: { layout: 'orbit', bend: 0.6, scaleOnHover: false },
  perspective: { tiltX: 6, tiltY: -32, speed: 120, scaleOnHover: false },
  vertical: { direction: 'up', focus: 0.5, logoHeight: 40, gap: 40, scaleOnHover: false }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'stack', label: 'Stack' },
  { value: 'dock', label: 'Dock' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'wave', label: 'Wave' },
  { value: 'arc', label: 'Arc' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'perspective', label: 'Perspective' },
  { value: 'vertical', label: 'Vertical' }
];

const LAYOUT_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'wave', label: 'Wave' },
  { value: 'arc', label: 'Arc' },
  { value: 'orbit', label: 'Orbit' }
];

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const LABEL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'inline', label: 'Inline' },
  { value: 'below', label: 'Below' },
  { value: 'hover', label: 'On Hover' }
];

const propData: PropRow[] = [
  {
    name: 'logos',
    type: 'LogoItem[]',
    default: 'required',
    description:
      'Logos to show. Each item is either { node } for any JSX element or a function returning one, like an icon, or { src, alt } for an image. Both accept an optional title, href and hoverColor, the brand color a logo takes on when hovered.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '120',
    description: 'Speed in pixels per second. Negative values reverse the direction.'
  },
  {
    name: 'direction',
    type: "'left' | 'right' | 'up' | 'down'",
    default: "'left'",
    description: 'Which way the logos travel.'
  },
  { name: 'width', type: 'number | string', default: "'100%'", description: 'Width of the loop.' },
  { name: 'logoHeight', type: 'number', default: '28', description: 'Height of each logo in pixels.' },
  { name: 'gap', type: 'number', default: '32', description: 'Space between logos in pixels.' },
  {
    name: 'hoverSpeed',
    type: 'number',
    default: 'undefined',
    description:
      'Speed while the loop is hovered or a logo has keyboard focus. 0 pauses it and a small value slows it down. By default it pauses.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'undefined',
    description: 'Set to false to keep full speed on hover. Ignored when hoverSpeed is set.'
  },
  {
    name: 'fadeOut',
    type: 'boolean',
    default: 'true',
    description: 'Fades the logos out softly at both ends. It is a transparent mask, so it works on any background.'
  },
  {
    name: 'fadeOutWidth',
    type: 'number',
    default: '0.12',
    description: 'Size of each fade as a fraction of the length, from 0 to 0.5.'
  },
  { name: 'scaleOnHover', type: 'boolean', default: 'false', description: 'Grows the hovered logo slightly.' },
  {
    name: 'layout',
    type: "'line' | 'wave' | 'arc' | 'orbit'",
    default: "'line'",
    description: 'Path the logos travel along: a straight line, a wave, an arc, or a ring that turns in 3D.'
  },
  {
    name: 'bend',
    type: 'number',
    default: '0.5',
    description:
      'How strongly the path bends, from -1 to 1. It sets the height of the wave, the curve of the arc or the tilt of the orbit. Negative values flip it.'
  },
  {
    name: 'focus',
    type: 'number',
    default: '0',
    description:
      'A lens in the middle, from 0 to 1. Logos grow and make room as they pass the center while the outer ones dim.'
  },
  {
    name: 'magnify',
    type: 'number',
    default: '0',
    description: 'Dock-style magnification under the cursor, from 0 to 1. Nearby logos move aside to make room.'
  },
  { name: 'tiltX', type: 'number', default: '0', description: 'Tilts the loop back or forward in 3D, in degrees.' },
  { name: 'tiltY', type: 'number', default: '0', description: 'Turns the loop to the side in 3D, in degrees.' },
  {
    name: 'step',
    type: 'boolean',
    default: 'false',
    description: 'Moves one logo at a time and pauses, centering each logo in turn. Speed sets the pace.'
  },
  {
    name: 'muted',
    type: 'number',
    default: '0',
    description: 'Greys out and dims the logos until one is hovered or centered, from 0 to 1.'
  },
  {
    name: 'labels',
    type: "'none' | 'inline' | 'below' | 'hover'",
    default: "'none'",
    description: "Shows each logo's title beside it, below it, or as a small caption when it is hovered or centered."
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets people drag or swipe the loop and fling it. Links still open with a normal click.'
  },
  {
    name: 'scrollBoost',
    type: 'number',
    default: '0',
    description: 'Speeds the loop up while the page scrolls and reverses it when scrolling up, from 0 to 1.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Logos fade and rise in from left to right the first time the loop comes into view.'
  },
  {
    name: 'renderItem',
    type: '(item: LogoItem, key: string) => JSX.Element',
    default: 'undefined',
    description: 'Custom render function for each logo, for full control over how it looks.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Partner logos'", description: 'Accessible name for the loop.' },
  { name: 'className', type: 'string', default: 'undefined', description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: 'undefined', description: 'Inline styles for the container.' }
];

export default function LogoLoopDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, useCustomRender: _useCustomRender, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof Look]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const bends = () => settings().layout !== 'line';

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'useCustomRender']}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '400px', padding: 0, overflow: 'hidden' }}>
            <RefreshButton onClick={forceRerender} />
            <Keyed token={rerenderKey()}>
              {() => (
                <LogoLoop
                  logos={items}
                  {...(settings() as Partial<LogoLoopProps>)}
                  ariaLabel="Our tech stack"
                  renderItem={props().useCustomRender ? customRender : undefined}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={settings().layout}
              onChange={(value: Layout) => updateProp('layout', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              onChange={(value: Direction) => updateProp('direction', value)}
            />
            <PreviewSelect
              title="Labels"
              options={LABEL_OPTIONS}
              value={settings().labels}
              onChange={(value: Labels) => updateProp('labels', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={300}
              step={10}
              value={settings().speed}
              valueUnit="px/s"
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Hover Speed"
              min={0}
              max={200}
              step={10}
              value={settings().hoverSpeed}
              valueUnit="px/s"
              onChange={value => updateProp('hoverSpeed', value)}
            />
            <PreviewSlider
              title="Logo Height"
              min={20}
              max={100}
              step={2}
              value={settings().logoHeight}
              valueUnit="px"
              onChange={value => updateProp('logoHeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={10}
              max={120}
              step={2}
              value={settings().gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Bend"
              min={-1}
              max={1}
              step={0.05}
              value={settings().bend}
              isDisabled={!bends()}
              onChange={value => updateProp('bend', value)}
            />
            <PreviewSlider
              title="Focus"
              min={0}
              max={1}
              step={0.05}
              value={settings().focus}
              onChange={value => updateProp('focus', value)}
            />
            <PreviewSlider
              title="Magnify"
              min={0}
              max={1}
              step={0.05}
              value={settings().magnify}
              onChange={value => updateProp('magnify', value)}
            />
            <PreviewSlider
              title="Muted"
              min={0}
              max={1}
              step={0.05}
              value={settings().muted}
              onChange={value => updateProp('muted', value)}
            />
            <PreviewSlider
              title="Tilt X"
              min={-60}
              max={60}
              step={1}
              value={settings().tiltX}
              valueUnit="°"
              onChange={value => updateProp('tiltX', value)}
            />
            <PreviewSlider
              title="Tilt Y"
              min={-60}
              max={60}
              step={1}
              value={settings().tiltY}
              valueUnit="°"
              onChange={value => updateProp('tiltY', value)}
            />
            <PreviewSlider
              title="Fade Width"
              min={0}
              max={0.5}
              step={0.01}
              value={settings().fadeOutWidth}
              isDisabled={!settings().fadeOut}
              onChange={value => updateProp('fadeOutWidth', value)}
            />
            <PreviewSlider
              title="Scroll Boost"
              min={0}
              max={1}
              step={0.05}
              value={settings().scrollBoost}
              onChange={value => updateProp('scrollBoost', value)}
            />
            <PreviewSwitch
              title="Fade Out"
              isChecked={settings().fadeOut}
              onChange={value => updateProp('fadeOut', value)}
            />
            <PreviewSwitch title="Step" isChecked={settings().step} onChange={value => updateProp('step', value)} />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings().draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch
              title="Scale on Hover"
              isChecked={settings().scaleOnHover}
              onChange={value => updateProp('scaleOnHover', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Custom Render"
              isChecked={props().useCustomRender}
              onChange={value => updateProp('useCustomRender', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={logoLoop} componentName="LogoLoop" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
