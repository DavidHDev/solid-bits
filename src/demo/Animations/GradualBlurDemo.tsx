import { For, Match, Switch, createEffect, createMemo, onSettled, type Accessor } from 'solid-js';
import {
  Album02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  Image01Icon,
  MoreHorizontalIcon,
  Search01Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import GradualBlur, { type GradualBlurProps } from '@/content/Animations/GradualBlur/GradualBlur';
import { gradualBlur } from '@/constants/code/Animations/gradualBlurCode';

type Ink = {
  page: string;
  text: string;
  muted: string;
  rim: string;
  tile: string;
  tileRim: string;
  sky: string;
  portrait: string;
  landscape: string;
};

type Photo = 'sky' | 'portrait' | 'landscape';

type ShotData = { photo: Photo; position: string; zoom: number };

const INK: Record<'dark' | 'light', Ink> = {
  dark: {
    page: '#0c0f13',
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.6)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07)',
    tile: 'linear-gradient(180deg, #37393e 0%, #26282c 100%)',
    tileRim:
      'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    sky: '/assets/demo/night-sky.webp',
    portrait: '/assets/demo/night-portrait.webp',
    landscape: '/assets/demo/night-landscape.webp'
  },
  light: {
    page: '#ffffff',
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.6)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    tileRim:
      'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    sky: '/assets/demo/day-sky.webp',
    portrait: '/assets/demo/day-portrait.webp',
    landscape: '/assets/demo/day-landscape.webp'
  }
};

const SHOTS: ShotData[] = [
  { photo: 'sky', position: '20% 40%', zoom: 1 },
  { photo: 'portrait', position: '50% 35%', zoom: 1.15 },
  { photo: 'landscape', position: '30% 60%', zoom: 1 },
  { photo: 'landscape', position: '82% 40%', zoom: 1.7 },
  { photo: 'sky', position: '85% 60%', zoom: 1.5 },
  { photo: 'portrait', position: '45% 85%', zoom: 1 },
  { photo: 'portrait', position: '70% 55%', zoom: 1.9 },
  { photo: 'sky', position: '50% 80%', zoom: 1.2 },
  { photo: 'landscape', position: '55% 25%', zoom: 1.4 }
];

const SECTIONS = [
  { title: 'Today', shots: [0, 1, 2, 3, 4, 5] },
  { title: 'Yesterday', shots: [6, 7, 8, 2, 0, 1] },
  { title: 'Last week', shots: [3, 4, 5, 6, 7, 8, 1, 2, 0] }
];

const TABS: { icon: IconSvgElement; label: string }[] = [
  { icon: Image01Icon, label: 'Library' },
  { icon: Album02Icon, label: 'Albums' },
  { icon: FavouriteIcon, label: 'Favorites' },
  { icon: Search01Icon, label: 'Search' }
];

const LOOK = {
  strength: 2,
  depth: 6,
  layers: 8,
  curve: 'linear',
  exponential: true,
  opacity: 1,
  saturation: 1,
  hoverIntensity: 1,
  tintAmount: 0.6
};

const DEFAULT_PROPS = {
  demo: 'feed',
  preset: 'soft',
  smoothScroll: true,
  tintColor: null as string | null,
  position: 'bottom',
  target: 'parent',
  autoHide: true,
  ...LOOK
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  soft: {},
  clear: { tintAmount: 0 },
  deep: { strength: 4, depth: 10, tintAmount: 0.45 },
  subtle: { strength: 1, depth: 4, tintAmount: 0.3 },
  vibrant: { strength: 3, saturation: 1.8, tintAmount: 0 },
  fog: { strength: 2.5, exponential: false, curve: 'ease-out', tintAmount: 0.92 },
  peek: { strength: 3, hoverIntensity: 0, tintAmount: 0.3 },
  steps: { layers: 3, exponential: false, curve: 'linear', tintAmount: 0 }
};

const DEMO_OPTIONS = [
  { value: 'feed', label: 'Feed' },
  { value: 'photo', label: 'Photo' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'soft', label: 'Soft' },
  { value: 'clear', label: 'Clear' },
  { value: 'deep', label: 'Deep' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'fog', label: 'Fog' },
  { value: 'peek', label: 'Peek' },
  { value: 'steps', label: 'Steps' }
];

const POSITION_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const TARGET_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'page', label: 'Page' }
];

const CURVE_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'bezier', label: 'Smooth' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' }
];

const propData: PropRow[] = [
  {
    name: 'position',
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "'bottom'",
    description: 'Edge the blur grows toward.'
  },
  {
    name: 'target',
    type: "'parent' | 'page'",
    default: "'parent'",
    description: 'Sit inside the nearest positioned parent, or stay fixed to the edge of the viewport.'
  },
  {
    name: 'height',
    type: 'string | number',
    default: "'6rem'",
    description: 'How far the blur reaches in from the edge. For left and right this is its width. Numbers are px.'
  },
  {
    name: 'width',
    type: 'string | number',
    default: '-',
    description: 'For top and bottom, a narrower centered band. For left and right, overrides height.'
  },
  {
    name: 'strength',
    type: 'number',
    default: '2',
    description: 'How blurry the very edge gets. Each step adds about 12px of blur.'
  },
  {
    name: 'layers',
    type: 'number',
    default: '8',
    description: 'Blur layers stacked across the ramp. More layers give a smoother falloff, fewer show visible steps.'
  },
  {
    name: 'curve',
    type: "'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'",
    default: "'linear'",
    description: 'How the blur builds across the ramp. bezier is a smooth S-curve.'
  },
  {
    name: 'exponential',
    type: 'boolean',
    default: 'true',
    description: 'Doubles the blur toward the edge so it starts gently. Turn off for an even ramp.'
  },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the blur layers. Lower values let the sharp content show through.'
  },
  {
    name: 'saturation',
    type: 'number',
    default: '1',
    description: 'Color boost of the blurred content, building toward the edge, for a glassy look.'
  },
  {
    name: 'tint',
    type: 'string',
    default: "'transparent'",
    description: 'Color the content fades into at the edge, such as your page background. Use rgba for a lighter wash.'
  },
  {
    name: 'autoHide',
    type: 'boolean',
    default: 'false',
    description:
      'Fades the blur out when the scroll container reaches this edge, so it only shows while there is more to scroll.'
  },
  {
    name: 'container',
    type: 'string | Element | { current: Element | null }',
    default: '-',
    description:
      'Scroll container watched by autoHide. Defaults to a scrollable sibling or the parent, or the page when target is page.'
  },
  {
    name: 'hoverIntensity',
    type: 'number',
    default: '1',
    description: 'Multiplies the blur while the cursor is over it. 0 clears it on hover, 2 doubles it.'
  },
  {
    name: 'duration',
    type: 'number | string',
    default: '0.3',
    description: 'Length of the hover and autoHide transitions, in seconds or as a CSS time.'
  },
  { name: 'easing', type: 'string', default: "'ease-out'", description: 'CSS easing of those transitions.' },
  { name: 'zIndex', type: 'number', default: '1000', description: 'Stacking order of the overlay.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the overlay.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the overlay.' }
];

const SMOOTH_TAU = 0.055;

const bindSmoothScroll = (scroller: HTMLElement): (() => void) | undefined => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
  let target = scroller.scrollTop;
  let middle = target;
  let current = target;
  let written = target;
  let raf = 0;
  let last = 0;

  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    target = middle = current = written = scroller.scrollTop;
  };

  const step = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    const blend = 1 - Math.exp(-dt / SMOOTH_TAU);
    middle += (target - middle) * blend;
    current += (middle - current) * blend;
    if (Math.abs(target - current) < 0.3 && Math.abs(target - middle) < 0.3) {
      current = middle = target;
      raf = 0;
      last = 0;
    } else {
      raf = requestAnimationFrame(step);
    }
    written = current;
    scroller.scrollTop = current;
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    if (!raf && Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (!event.cancelable) {
      sync();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    const delta = event.deltaY * unit;
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight - 1);
    if (!raf) target = middle = current = written = scroller.scrollTop;
    if (!raf && ((delta < 0 && target <= 1) || (delta > 0 && target >= max - 1))) return;
    event.preventDefault();
    target = Math.min(max, Math.max(0, target + delta));
    if (!raf && Math.abs(target - current) >= 0.3) raf = requestAnimationFrame(step);
  };

  const onScroll = () => {
    if (raf && Math.abs(scroller.scrollTop - written) < 2) return;
    sync();
  };

  scroller.addEventListener('wheel', onWheel, { passive: false });
  scroller.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    scroller.removeEventListener('wheel', onWheel);
    scroller.removeEventListener('scroll', onScroll);
  };
};

const toRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map(c => c + c)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type SceneProps = {
  ink: Accessor<Ink>;
  blur: Accessor<GradualBlurProps>;
};

function Shot(props: { ink: Accessor<Ink>; shot: ShotData; radius?: string; ratio?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        'aspect-ratio': props.ratio ?? '1',
        'border-radius': props.radius ?? '6px',
        overflow: 'hidden'
      }}
    >
      <img
        src={props.ink()[props.shot.photo]}
        alt=""
        draggable="false"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          'object-fit': 'cover',
          'object-position': props.shot.position,
          transform: `scale(${props.shot.zoom})`,
          'transform-origin': props.shot.position
        }}
      />
    </div>
  );
}

function FeedScene(props: SceneProps & { smooth: Accessor<boolean> }) {
  let scrollerEl: HTMLDivElement | undefined;
  let mounted = false;
  let smoothOn = true;
  let teardown: (() => void) | undefined;

  const applySmooth = () => {
    teardown?.();
    teardown = undefined;
    if (mounted && scrollerEl && smoothOn) teardown = bindSmoothScroll(scrollerEl);
  };

  createEffect(
    () => props.smooth(),
    value => {
      smoothOn = value;
      applySmooth();
    }
  );

  onSettled(() => {
    smoothOn = props.smooth();
    mounted = true;
    applySmooth();
    return () => {
      mounted = false;
      teardown?.();
      teardown = undefined;
    };
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        ref={el => (scrollerEl = el)}
        style={{ position: 'absolute', inset: 0, 'overflow-y': 'auto', 'scrollbar-width': 'none' }}
      >
        <div style={{ 'max-width': '720px', margin: '0 auto', padding: '76px 16px 104px' }}>
          <For each={SECTIONS}>
            {(section, index) => (
              <div style={{ 'margin-top': index() ? '28px' : '0' }}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'baseline',
                    padding: '0 4px',
                    'margin-bottom': '10px'
                  }}
                >
                  <span style={{ 'font-size': '15px', 'font-weight': 500 }}>{section.title}</span>
                  <span style={{ 'font-size': '13px', color: props.ink().muted }}>{section.shots.length} photos</span>
                </div>
                <div style={{ display: 'grid', 'grid-template-columns': 'repeat(3, minmax(0, 1fr))', gap: '4px' }}>
                  <For each={section.shots}>{shot => <Shot ink={props.ink} shot={SHOTS[shot]} />}</For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <GradualBlur {...props.blur()} position="top" target="parent" zIndex={2} />
      <GradualBlur {...props.blur()} position="bottom" target="parent" zIndex={2} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          'z-index': 3,
          height: '64px',
          padding: '0 24px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'pointer-events': 'none'
        }}
      >
        <span style={{ 'font-size': '22px', 'font-weight': 500, 'letter-spacing': '-0.02em' }}>Library</span>
        <div style={{ display: 'flex', gap: '18px', 'align-items': 'center' }}>
          <HugeiconsIcon icon={Search01Icon} size={20} color={props.ink().text} strokeWidth={1.7} />
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color={props.ink().text} strokeWidth={1.7} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: 0,
          right: 0,
          'z-index': 3,
          display: 'flex',
          'justify-content': 'center',
          gap: 'clamp(20px, 7cqi, 44px)',
          'pointer-events': 'none'
        }}
      >
        <For each={TABS}>
          {(tab, index) => (
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '4px',
                color: index() ? props.ink().muted : props.ink().text
              }}
            >
              <HugeiconsIcon icon={tab.icon} size={21} color="currentColor" strokeWidth={1.7} />
              <span style={{ 'font-size': '11px', 'font-weight': 500 }}>{tab.label}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function PhotoScene(props: SceneProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '0 24px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(100%, 560px)',
          'aspect-ratio': '3 / 2',
          'border-radius': '22px',
          overflow: 'hidden',
          'box-shadow': props.ink().rim
        }}
      >
        <img
          src={props.ink().landscape}
          alt=""
          draggable="false"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            'object-fit': 'cover',
            'object-position': '50% 60%'
          }}
        />
        <GradualBlur {...props.blur()} position="bottom" target="parent" zIndex={2} />
        <div
          style={{
            position: 'absolute',
            left: '22px',
            right: '22px',
            bottom: '20px',
            'z-index': 3,
            display: 'flex',
            'align-items': 'flex-end',
            gap: '12px'
          }}
        >
          <div style={{ flex: '1', 'min-width': 0, color: '#ffffff' }}>
            <div style={{ 'font-size': 'clamp(16px, 3.6cqi, 20px)', 'font-weight': 500, 'letter-spacing': '-0.01em' }}>
              Canola field
            </div>
            <div style={{ 'margin-top': '2px', 'font-size': '13px', opacity: 0.78 }}>Gippsland, 35mm</div>
          </div>
          <div style={{ display: 'flex', gap: '14px', color: '#ffffff', 'padding-bottom': '2px' }}>
            <HugeiconsIcon icon={FavouriteIcon} size={20} color="currentColor" strokeWidth={1.7} />
            <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="currentColor" strokeWidth={1.7} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundButton(props: { ink: Accessor<Ink>; icon: IconSvgElement; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      onClick={() => props.onClick()}
      style={{
        width: '40px',
        height: '40px',
        'border-radius': '12px',
        border: 'none',
        padding: 0,
        display: 'grid',
        'place-items': 'center',
        cursor: 'pointer',
        background: props.ink().tile,
        'box-shadow': props.ink().tileRim
      }}
    >
      <HugeiconsIcon icon={props.icon} size={18} color={props.ink().text} strokeWidth={1.8} />
    </button>
  );
}

function CarouselScene(props: SceneProps) {
  let stripEl: HTMLDivElement | undefined;
  const move = (direction: number) => stripEl?.scrollBy({ left: direction * 212, behavior: 'smooth' });

  onSettled(() => {
    const el = stripEl;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((event.deltaY < 0 && el.scrollLeft <= 1) || (event.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '22px'
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <div ref={el => (stripEl = el)} style={{ 'overflow-x': 'auto', 'scrollbar-width': 'none' }}>
          <div style={{ display: 'flex', gap: '12px', width: 'max-content', padding: '2px 24px' }}>
            <For each={SHOTS}>
              {shot => (
                <div
                  style={{
                    width: '200px',
                    'flex-shrink': 0,
                    'box-shadow': props.ink().rim,
                    'border-radius': '18px'
                  }}
                >
                  <Shot ink={props.ink} shot={shot} radius="18px" ratio="4 / 5" />
                </div>
              )}
            </For>
          </div>
        </div>
        <GradualBlur {...props.blur()} position="left" target="parent" zIndex={2} />
        <GradualBlur {...props.blur()} position="right" target="parent" zIndex={2} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <RoundButton ink={props.ink} icon={ArrowLeft01Icon} label="Previous" onClick={() => move(-1)} />
        <RoundButton ink={props.ink} icon={ArrowRight01Icon} label="Next" onClick={() => move(1)} />
      </div>
    </div>
  );
}

function BasicScene(props: SceneProps & { position: Accessor<string>; target: Accessor<string> }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '0 24px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(100%, 480px)',
          'aspect-ratio': '3 / 2',
          'border-radius': '20px',
          overflow: 'hidden',
          'box-shadow': props.ink().rim
        }}
      >
        <img
          src={props.ink().sky}
          alt=""
          draggable="false"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', 'object-fit': 'cover' }}
        />
        <GradualBlur
          {...props.blur()}
          position={props.position() as GradualBlurProps['position']}
          target={props.target() as GradualBlurProps['target']}
          zIndex={props.target() === 'page' ? 1000 : 2}
        />
      </div>
    </div>
  );
}

export default function GradualBlurDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = createMemo(() => INK[theme()]);
  const demo = createMemo(() => props().demo);
  const basic = createMemo(() => demo() === 'basic');
  const scrim = createMemo(() => demo() === 'photo' || (demo() === 'basic' && props().target !== 'page'));
  const tintHex = createMemo(() => props().tintColor ?? (scrim() ? '#000000' : ink().page));
  const tint = createMemo(() => (props().tintAmount > 0 ? toRgba(tintHex(), props().tintAmount) : 'transparent'));
  const height = createMemo(() => `${props().depth}rem`);

  const blur = createMemo<GradualBlurProps>(() => {
    const p = props();
    return {
      strength: p.strength,
      layers: p.layers,
      curve: p.curve as GradualBlurProps['curve'],
      exponential: p.exponential,
      opacity: p.opacity,
      saturation: p.saturation,
      hoverIntensity: p.hoverIntensity,
      autoHide: p.autoHide,
      height: height(),
      tint: tint()
    };
  });

  const computedProps = createMemo(() => ({ height: height(), tint: tint() }));

  const applyPreset = (value: string) => updateProps({ ...LOOK, ...PRESETS[value], preset: value });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset', 'smoothScroll', 'tintColor', 'tintAmount', 'depth']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '500px',
              padding: 0,
              overflow: 'hidden',
              color: ink().text,
              'container-type': 'inline-size'
            }}
          >
            <Switch>
              <Match when={demo() === 'photo'}>
                <PhotoScene ink={ink} blur={blur} />
              </Match>
              <Match when={demo() === 'carousel'}>
                <CarouselScene ink={ink} blur={blur} />
              </Match>
              <Match when={demo() === 'basic'}>
                <BasicScene ink={ink} blur={blur} position={() => props().position} target={() => props().target} />
              </Match>
              <Match when={true}>
                <FeedScene ink={ink} blur={blur} smooth={() => props().smoothScroll} />
              </Match>
            </Switch>
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={demo()}
              onChange={(value: string) => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Position"
              options={POSITION_OPTIONS}
              value={props().position}
              isDisabled={!basic()}
              onChange={(value: string) => updateProp('position', value)}
            />
            <PreviewSelect
              title="Target"
              options={TARGET_OPTIONS}
              value={props().target}
              isDisabled={!basic()}
              onChange={(value: string) => updateProp('target', value)}
            />
            <PreviewSelect
              title="Curve"
              options={CURVE_OPTIONS}
              value={props().curve}
              onChange={(value: string) => updateProp('curve', value)}
            />
            <PreviewColorPickerCustom
              title="Tint"
              color={tintHex()}
              onChange={value => updateProp('tintColor', value)}
            />
            <PreviewSlider
              title="Tint Amount"
              min={0}
              max={1}
              step={0.05}
              value={props().tintAmount}
              onChange={value => updateProp('tintAmount', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0.5}
              max={6}
              step={0.25}
              value={props().strength}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Height"
              min={2}
              max={14}
              step={0.5}
              value={props().depth}
              valueUnit="rem"
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={16}
              step={1}
              value={props().layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2.5}
              step={0.05}
              value={props().saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={props().opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Hover Intensity"
              min={0}
              max={3}
              step={0.1}
              value={props().hoverIntensity}
              onChange={value => updateProp('hoverIntensity', value)}
            />
            <PreviewSwitch
              title="Exponential"
              isChecked={props().exponential}
              onChange={value => updateProp('exponential', value)}
            />
            <PreviewSwitch
              title="Auto Hide"
              isChecked={props().autoHide}
              isDisabled={demo() !== 'feed' && demo() !== 'carousel'}
              onChange={value => updateProp('autoHide', value)}
            />
            <PreviewSwitch
              title="Smooth Scroll"
              isChecked={props().smoothScroll}
              isDisabled={demo() !== 'feed'}
              onChange={value => updateProp('smoothScroll', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gradualBlur} componentName="GradualBlur" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
