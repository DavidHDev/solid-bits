import { For, Match, Show, Switch, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { colorMode } from '@/hooks/useTheme';

import FadeContent, { type FadeContentProps } from '@/content/Animations/FadeContent/FadeContent';
import { fadeContent } from '@/constants/code/Animations/fadeContentCode';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    faint: 'rgba(244, 244, 245, 0.4)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07)',
    sky: '/assets/demo/night-sky.webp',
    portrait: '/assets/demo/night-portrait.webp',
    landscape: '/assets/demo/night-landscape.webp'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    faint: 'rgba(24, 24, 27, 0.4)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08)',
    sky: '/assets/demo/day-sky.webp',
    portrait: '/assets/demo/day-portrait.webp',
    landscape: '/assets/demo/day-landscape.webp'
  }
};

type Ink = (typeof INK)['dark'];

const TILES: { photo: 'sky' | 'portrait' | 'landscape'; position: string }[] = [
  { photo: 'sky', position: '18% 40%' },
  { photo: 'portrait', position: '50% 30%' },
  { photo: 'landscape', position: '20% 60%' },
  { photo: 'landscape', position: '82% 45%' },
  { photo: 'sky', position: '85% 55%' },
  { photo: 'portrait', position: '50% 88%' }
];

const LOOK = {
  effect: 'fade',
  blur: 0,
  duration: 1,
  ease: 'power2.out',
  initialOpacity: 0,
  stagger: 0.1,
  staggerFrom: 'start',
  exit: false,
  scrub: false as boolean | number
};

const DEFAULT_PROPS = {
  demo: 'journal',
  preset: 'mist',
  smoothScroll: true,
  ...LOOK,
  effect: 'mist',
  duration: 1.8,
  delay: 0,
  threshold: 0.1,
  once: true,
  disappearAfter: 0,
  disappearDuration: 0.5,
  disappearEase: 'power2.in'
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  fade: {},
  soft: { blur: 10, duration: 1.2 },
  focus: { effect: 'focus', duration: 1.2, ease: 'power3.out' },
  develop: { effect: 'develop', duration: 2 },
  dissolve: { effect: 'dissolve', duration: 1.4, ease: 'power1.inOut' },
  mist: { effect: 'mist', duration: 1.8 },
  pixel: { effect: 'pixel', duration: 1.2, ease: 'power1.inOut' },
  spotlight: { effect: 'focus', exit: true, scrub: 0.5 }
};

const DEMO_OPTIONS = [
  { value: 'journal', label: 'Journal' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'soft', label: 'Soft' },
  { value: 'focus', label: 'Focus' },
  { value: 'develop', label: 'Develop' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'mist', label: 'Mist' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'spotlight', label: 'Spotlight' }
];

const EFFECT_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'focus', label: 'Focus' },
  { value: 'develop', label: 'Develop' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'mist', label: 'Mist' },
  { value: 'pixel', label: 'Pixel' }
];

const EASE_OPTIONS = [
  { value: 'power2.out', label: 'Soft' },
  { value: 'power3.out', label: 'Power' },
  { value: 'expo.out', label: 'Expo' },
  { value: 'power1.inOut', label: 'Even' },
  { value: 'sine.in', label: 'Slow Start' },
  { value: 'none', label: 'Linear' }
];

const DISAPPEAR_EASE_OPTIONS = [
  { value: 'power2.in', label: 'Soft' },
  { value: 'power3.in', label: 'Power' },
  { value: 'expo.in', label: 'Expo' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'The content to fade in.' },
  {
    name: 'container',
    type: 'string | HTMLElement',
    default: 'window',
    description: 'Scroll container that drives the fade, as a selector or an element. Defaults to the page.'
  },
  {
    name: 'effect',
    type: "'fade' | 'focus' | 'develop' | 'dissolve' | 'mist' | 'pixel'",
    default: "'fade'",
    description:
      'How the content appears: a plain fade, out of focus, from washed-out gray, through fine grain, through drifting mist, or block by block.'
  },
  {
    name: 'blur',
    type: 'boolean | number',
    default: 'false',
    description: 'Extra blur the content starts from, in px. true adds 10px.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '1',
    description: 'Length of the fade, in seconds. Values above 10 are read as milliseconds.'
  },
  {
    name: 'ease',
    type: 'string',
    default: "'power2.out'",
    description: "Any GSAP ease, such as 'power3.out', 'expo.out' or 'none'."
  },
  {
    name: 'delay',
    type: 'number',
    default: '0',
    description: 'Wait before the fade starts, in seconds. Values above 10 are read as milliseconds.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'How far into the viewport the top of the content must be before it fades in, from 0 to 1.'
  },
  { name: 'initialOpacity', type: 'number', default: '0', description: 'Opacity the content starts from.' },
  {
    name: 'stagger',
    type: 'number',
    default: '0',
    description: 'Fades each direct child in turn, this many seconds apart. Great for lists and grids.'
  },
  {
    name: 'staggerFrom',
    type: "'start' | 'end' | 'center' | 'edges' | 'random'",
    default: "'start'",
    description: 'Which child goes first when staggering.'
  },
  {
    name: 'trigger',
    type: "'scroll' | 'mount'",
    default: "'scroll'",
    description: 'Fade in when the content scrolls into view, or right away.'
  },
  {
    name: 'once',
    type: 'boolean',
    default: 'true',
    description: 'Fades in once. Turn off to fade back out whenever the content scrolls back below the view.'
  },
  {
    name: 'exit',
    type: 'boolean',
    default: 'false',
    description: 'Fades the content back out as it scrolls off the top, and in again when it comes back.'
  },
  {
    name: 'scrub',
    type: 'boolean | number',
    default: 'false',
    description: 'Ties the fade to the scroll position instead of playing it. A number smooths it, in seconds.'
  },
  {
    name: 'disappearAfter',
    type: 'number',
    default: '0',
    description: 'Fades the content out again this many seconds after it appears. 0 keeps it shown.'
  },
  {
    name: 'disappearDuration',
    type: 'number',
    default: '0.5',
    description: 'Length of the fade out, in seconds.'
  },
  { name: 'disappearEase', type: 'string', default: "'power2.in'", description: 'GSAP ease of the fade out.' },
  { name: 'onStart', type: '() => void', default: '-', description: 'Called when the fade starts.' },
  { name: 'onComplete', type: '() => void', default: '-', description: 'Called when the fade finishes.' },
  {
    name: 'onDisappearanceComplete',
    type: '() => void',
    default: '-',
    description: 'Called when the fade out finishes.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the wrapper.' }
];

const TAU = 0.055;

const smoothScroll = (scroller: HTMLElement) => {
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
    const blend = 1 - Math.exp(-dt / TAU);
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

function Photo(props: { ink: Ink; src: string; position?: string; h?: string; ratio?: string; radius?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: props.h,
        'aspect-ratio': props.ratio,
        'border-radius': props.radius ?? '22px',
        overflow: 'hidden',
        'box-shadow': props.ink.rim
      }}
    >
      <img
        src={props.src}
        alt=""
        draggable="false"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          'object-fit': 'cover',
          'object-position': props.position ?? '50% 50%'
        }}
      />
    </div>
  );
}

type SceneProps = { ink: Ink; fade: FadeContentProps; smooth: boolean };

const text = (style: JSX.CSSProperties): JSX.CSSProperties => ({ margin: 0, ...style });

function JournalScene(props: SceneProps) {
  let scrollerEl: HTMLDivElement | undefined;
  const [scroller, setScroller] = createSignal<HTMLDivElement | null>(null);

  onSettled(() => {
    if (scrollerEl) setScroller(scrollerEl);
  });

  createEffect(
    () => ({ el: scroller(), on: props.smooth }),
    ({ el, on }) => {
      if (!el || !on) return undefined;
      return smoothScroll(el);
    }
  );

  return (
    <div
      ref={el => (scrollerEl = el)}
      style={{ position: 'absolute', inset: 0, 'overflow-y': 'auto', 'scrollbar-width': 'none' }}
    >
      <Show when={scroller()}>
        {el => (
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              gap: '64px',
              padding: '92px 24px 140px',
              'max-width': '680px',
              margin: '0 auto'
            }}
          >
            <FadeContent {...props.fade} container={el()} style={{ 'text-align': 'center' }}>
              <p style={text({ 'font-size': '13px', color: props.ink.faint })}>Field notes, October</p>
              <p
                style={text({
                  'margin-top': '10px',
                  'font-size': 'clamp(28px, 7.4cqi, 44px)',
                  'font-weight': 500,
                  'letter-spacing': '-0.035em',
                  'line-height': 1.08
                })}
              >
                Slow light over the bay
              </p>
              <p
                style={text({
                  'margin-top': '14px',
                  'font-size': '15px',
                  color: props.ink.muted,
                  'max-width': '400px',
                  'margin-left': 'auto',
                  'margin-right': 'auto',
                  'line-height': 1.6
                })}
              >
                Shot in the last minutes of daylight, when the clouds turn and the water goes still.
              </p>
            </FadeContent>

            <FadeContent {...props.fade} container={el()} style={{ width: '100%' }}>
              <Photo ink={props.ink} src={props.ink.sky} h="clamp(220px, 50cqi, 340px)" />
            </FadeContent>

            <FadeContent
              {...props.fade}
              container={el()}
              style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '28px', width: '100%', 'align-items': 'center' }}
            >
              <div style={{ flex: '1 1 240px', 'min-width': 0 }}>
                <p style={text({ 'font-size': '20px', 'font-weight': 500, 'letter-spacing': '-0.02em' })}>
                  The walk out
                </p>
                <p
                  style={text({
                    'margin-top': '10px',
                    'font-size': '15px',
                    'line-height': 1.65,
                    color: props.ink.muted
                  })}
                >
                  The pier is a twenty minute walk from the station. Most evenings it is empty by the time the sky
                  starts to change, so you get the whole thing to yourself.
                </p>
              </div>
              <div style={{ flex: '1 1 240px', 'min-width': 0 }}>
                <Photo ink={props.ink} src={props.ink.portrait} ratio="4 / 5" radius="18px" />
              </div>
            </FadeContent>

            <FadeContent {...props.fade} container={el()} style={{ 'text-align': 'center', 'max-width': '460px' }}>
              <p
                style={text({
                  'font-size': 'clamp(20px, 5cqi, 28px)',
                  'font-weight': 500,
                  'letter-spacing': '-0.02em',
                  'line-height': 1.3
                })}
              >
                The good light lasts about four minutes. You learn to wait for it.
              </p>
            </FadeContent>

            <FadeContent {...props.fade} container={el()} style={{ width: '100%' }}>
              <Photo ink={props.ink} src={props.ink.landscape} h="clamp(200px, 44cqi, 300px)" position="50% 60%" />
            </FadeContent>

            <FadeContent {...props.fade} container={el()} style={{ 'text-align': 'center' }}>
              <p style={text({ 'font-size': '15px', color: props.ink.muted })}>More from the coast next spring.</p>
            </FadeContent>
          </div>
        )}
      </Show>
    </div>
  );
}

const centered: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  'align-items': 'center',
  'justify-content': 'center',
  padding: '0 24px'
};

function GalleryScene(props: SceneProps) {
  return (
    <div style={centered}>
      <FadeContent
        {...props.fade}
        stagger={(props.fade.stagger ?? 0) > 0 ? props.fade.stagger : 0.1}
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
          gap: '12px',
          width: 'min(100%, 520px)'
        }}
      >
        <For each={TILES}>
          {tile => (
            <Photo ink={props.ink} src={props.ink[tile.photo]} position={tile.position} ratio="1" radius="16px" />
          )}
        </For>
      </FadeContent>
    </div>
  );
}

function BasicScene(props: SceneProps) {
  return (
    <div style={centered}>
      <FadeContent {...props.fade} style={{ width: 'min(100%, 320px)' }}>
        <Photo ink={props.ink} src={props.ink.sky} ratio="3 / 2" radius="20px" />
      </FadeContent>
    </div>
  );
}

export default function FadeContentDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, smoothScroll: _smoothScroll, ...rest } = props();
    return rest;
  });
  const ink = createMemo(() => INK[colorMode()]);
  const sceneKey = createMemo(() => `${props().demo}-${rerenderKey()}`);
  const scrolling = createMemo(() => props().demo === 'journal');
  const fade = createMemo(
    () => (scrolling() ? settings() : { ...settings(), exit: false, scrub: false }) as unknown as FadeContentProps
  );

  const applyPreset = (value: string) => {
    updateProps({ ...LOOK, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset', 'smoothScroll']}
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
            <Keyed token={sceneKey()}>
              {() => (
                <Switch>
                  <Match when={props().demo === 'gallery'}>
                    <GalleryScene ink={ink()} fade={fade()} smooth={props().smoothScroll} />
                  </Match>
                  <Match when={props().demo === 'basic'}>
                    <BasicScene ink={ink()} fade={fade()} smooth={props().smoothScroll} />
                  </Match>
                  <Match when={true}>
                    <JournalScene ink={ink()} fade={fade()} smooth={props().smoothScroll} />
                  </Match>
                </Switch>
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={value => updateProp('effect', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings().ease}
              onChange={value => updateProp('ease', value)}
            />
            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings().staggerFrom}
              onChange={value => updateProp('staggerFrom', value)}
            />
            <PreviewSelect
              title="Disappear Ease"
              options={DISAPPEAR_EASE_OPTIONS}
              value={settings().disappearEase}
              onChange={value => updateProp('disappearEase', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={4}
              step={0.1}
              value={settings().duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={2}
              step={0.1}
              value={settings().delay}
              valueUnit="s"
              onChange={value => updateProp('delay', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.5}
              step={0.01}
              value={settings().stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={30}
              step={1}
              value={settings().blur}
              valueUnit="px"
              onChange={value => updateProp('blur', value)}
            />
            <PreviewSlider
              title="Initial Opacity"
              min={0}
              max={0.9}
              step={0.05}
              value={settings().initialOpacity}
              onChange={value => updateProp('initialOpacity', value)}
            />
            <PreviewSlider
              title="Threshold"
              min={0}
              max={0.45}
              step={0.05}
              value={settings().threshold}
              onChange={value => updateProp('threshold', value)}
            />
            <PreviewSlider
              title="Disappear After"
              min={0}
              max={5}
              step={0.1}
              value={settings().disappearAfter}
              valueUnit="s"
              isDisabled={!settings().once || settings().exit || (scrolling() && Boolean(settings().scrub))}
              onChange={value => updateProp('disappearAfter', value)}
            />
            <PreviewSlider
              title="Disappear Duration"
              min={0.1}
              max={3}
              step={0.1}
              value={settings().disappearDuration}
              valueUnit="s"
              isDisabled={!settings().disappearAfter}
              onChange={value => updateProp('disappearDuration', value)}
            />
            <PreviewSwitch title="Once" isChecked={settings().once} onChange={value => updateProp('once', value)} />
            <PreviewSwitch
              title="Exit"
              isChecked={settings().exit}
              isDisabled={!scrolling()}
              onChange={value => updateProp('exit', value)}
            />
            <PreviewSwitch
              title="Scrub"
              isChecked={Boolean(settings().scrub)}
              isDisabled={!scrolling()}
              onChange={value => updateProp('scrub', value)}
            />
            <PreviewSwitch
              title="Smooth Scroll"
              isChecked={props().smoothScroll}
              isDisabled={!scrolling()}
              onChange={value => updateProp('smoothScroll', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fadeContent} componentName="FadeContent" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
