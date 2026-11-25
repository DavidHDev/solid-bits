import { Show, createMemo, createSignal, onSettled } from 'solid-js';
import { Bookmark02Icon, Comment01Icon, FavouriteIcon, RepostIcon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorList from '@/components/common/PreviewColorList';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { colorMode } from '@/hooks/useTheme';

import ClickSpark, { type ClickSparkHandle, type ClickSparkProps } from '@/content/Animations/ClickSpark/ClickSpark';
import { clickSpark } from '@/constants/code/Animations/clickSparkCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/ClickSpark';
import './ClickSparkDemo.css';

const INK = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.62)',
    tile: 'linear-gradient(180deg, #35383d 0%, #25272b 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    hover: 'brightness(1.12)',
    press: 'brightness(0.85)'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    hover: 'brightness(0.97)',
    press: 'brightness(0.92)'
  }
};

type Ink = (typeof INK)['dark'];

const DEFAULT_PROPS = { demo: 'buttons', preset: 'classic', ...LOOK, layer: 'back' as 'front' | 'back' };

const LIGHT_SWAP: Record<string, string> = {
  '#ffffff': '#18181b',
  '#8ad5fd': '#0690d9',
  '#24b1fb': '#0ba4f5',
  '#7dd3fc': '#0284c7'
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark])
);

const DEMO_OPTIONS = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'basic', label: 'Basic' }
];

const LAYER_OPTIONS = [
  { value: 'back', label: 'Behind' },
  { value: 'front', label: 'In Front' }
];

const SHAPE_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'streak', label: 'Streak' },
  { value: 'dot', label: 'Dot' },
  { value: 'star', label: 'Star' }
];

const EASING_OPTIONS = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'linear', label: 'Linear' },
  { value: 'spring', label: 'Spring' }
];

const propData: PropRow[] = [
  {
    name: 'sparkColor',
    type: 'string | string[]',
    default: "'#fff'",
    description: 'Color of the sparks. Pass a list to mix colors through each burst.'
  },
  {
    name: 'shape',
    type: "'line' | 'streak' | 'dot' | 'star'",
    default: "'line'",
    description: 'Look of each spark: a short dash, a comet with a fading tail, a round dot, or a twinkling star.'
  },
  { name: 'sparkCount', type: 'number', default: '8', description: 'Number of sparks in each burst.' },
  { name: 'sparkSize', type: 'number', default: '14', description: 'Length of each spark, in px.' },
  { name: 'sparkWidth', type: 'number', default: '2', description: 'Thickness of each spark, in px.' },
  {
    name: 'sparkRadius',
    type: 'number',
    default: '30',
    description: 'How far the sparks travel from the click, in px.'
  },
  { name: 'duration', type: 'number', default: '500', description: 'Length of a burst, in ms.' },
  {
    name: 'easing',
    type: "'ease-out' | 'ease-in-out' | 'ease-in' | 'linear' | 'spring'",
    default: "'ease-out'",
    description: 'How the sparks slow down as they fly out. Spring overshoots a little and settles back.'
  },
  {
    name: 'randomness',
    type: 'number',
    default: '0.2',
    description: 'Varies the angle, length and speed of each spark, from 0 to 1. 0 gives a perfect star.'
  },
  { name: 'gravity', type: 'number', default: '0', description: 'Pulls the sparks down as they fly, from 0 to 2.' },
  {
    name: 'spread',
    type: 'number',
    default: '360',
    description: 'Angle the sparks fan across, in degrees. 360 is a full circle.'
  },
  {
    name: 'direction',
    type: 'number',
    default: '0',
    description: 'Where a partial spread points, in degrees. 0 is up and 90 is right.'
  },
  { name: 'glow', type: 'number', default: '0', description: 'Soft light around each spark, from 0 to 1.' },
  { name: 'ring', type: 'boolean', default: 'false', description: 'Adds a thin ring that expands from the click.' },
  {
    name: 'layer',
    type: "'front' | 'back'",
    default: "'front'",
    description: 'Draws the sparks over your content, or behind it so they burst out around buttons and cards.'
  },
  {
    name: 'extraScale',
    type: 'number',
    default: '1',
    description: 'Multiplies how far the sparks travel.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Stops new bursts.' },
  {
    name: 'ref',
    type: '(handle: { spark: (x?: number, y?: number) => void }) => void',
    default: '-',
    description: 'Call spark() to fire a burst from code. x and y are in px from the top left; it centers without them.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the wrapper.' },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'Content to wrap. Clicks anywhere inside it send sparks, which can spill past its edges.'
  }
];

function Action(props: {
  ink: Ink;
  icon: IconSvgElement;
  count?: number;
  active?: boolean;
  tone?: string;
  label: string;
  actionRef?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
}) {
  return (
    <div class="click-spark-demo-action">
      <button
        type="button"
        ref={el => props.actionRef?.(el)}
        aria-label={props.label}
        aria-pressed={props.active ? 'true' : 'false'}
        onClick={() => props.onClick?.()}
        class="click-spark-demo-button"
        style={{
          background: props.ink.tile,
          'box-shadow': props.ink.rim,
          color: props.active ? props.tone : props.ink.text,
          '--click-spark-hover': props.ink.hover,
          '--click-spark-press': props.ink.press
        }}
      >
        <span
          class={['click-spark-demo-icon', { 'is-active': !!props.active }]}
          style={{ transform: props.active ? 'scale(1.12)' : 'scale(1)' }}
        >
          <HugeiconsIcon icon={props.icon} size={18} strokeWidth={1.8} />
        </span>
      </button>
      <Show when={props.count !== undefined}>
        <span class="click-spark-demo-count" style={{ color: props.active ? props.ink.text : props.ink.muted }}>
          {props.count}
        </span>
      </Show>
    </div>
  );
}

function Stage(props: {
  demo: string;
  ink: Ink;
  colors: string[];
  settings: Omit<ClickSparkProps, 'sparkColor'>;
  stage: () => HTMLDivElement | undefined;
}) {
  let spark: ClickSparkHandle | null = null;
  let likeEl: HTMLButtonElement | undefined;
  const [liked, setLiked] = createSignal(false);
  const [reposted, setReposted] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  onSettled(() => {
    const timers: number[] = [];
    const fire = (fx: number, fy: number, delay: number) =>
      timers.push(
        window.setTimeout(() => {
          const stage = props.stage();
          if (!stage) return;
          spark?.spark(stage.clientWidth * fx, stage.clientHeight * fy);
        }, delay)
      );
    if (props.demo === 'basic') {
      fire(0.34, 0.42, 450);
      fire(0.64, 0.6, 750);
      fire(0.5, 0.3, 1050);
    } else {
      timers.push(
        window.setTimeout(() => {
          const stage = props.stage();
          const like = likeEl;
          if (!stage || !like) return;
          const a = stage.getBoundingClientRect();
          const b = like.getBoundingClientRect();
          setLiked(true);
          spark?.spark(b.left - a.left + b.width / 2, b.top - a.top + b.height / 2);
        }, 600)
      );
    }
    return () => timers.forEach(window.clearTimeout);
  });

  return (
    <ClickSpark ref={handle => (spark = handle)} sparkColor={props.colors} {...props.settings}>
      <div class="click-spark-demo-stage">
        <Show when={props.demo === 'buttons'}>
          <div class="click-spark-demo-actions">
            <Action ink={props.ink} icon={Comment01Icon} count={12} label="Reply" />
            <Action
              ink={props.ink}
              icon={RepostIcon}
              count={reposted() ? 5 : 4}
              active={reposted()}
              tone="#22c55e"
              label="Repost"
              onClick={() => setReposted(value => !value)}
            />
            <Action
              ink={props.ink}
              icon={FavouriteIcon}
              count={liked() ? 129 : 128}
              active={liked()}
              tone="#f43f5e"
              label="Like"
              actionRef={el => (likeEl = el)}
              onClick={() => setLiked(value => !value)}
            />
            <Action
              ink={props.ink}
              icon={Bookmark02Icon}
              active={saved()}
              tone={props.ink.text}
              label="Save"
              onClick={() => setSaved(value => !value)}
            />
          </div>
        </Show>
      </div>
    </ClickSpark>
  );
}

export default function ClickSparkDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  let stageEl: HTMLDivElement | undefined;

  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, sparkColor: _sparkColor, ...rest } = props();
    return rest;
  });
  const ink = createMemo(() => INK[colorMode()]);
  const sceneKey = createMemo(() => `${props().demo}-${rerenderKey()}`);
  const colors = createMemo(() => {
    const sparkColor = props().sparkColor;
    const palette = Array.isArray(sparkColor) && sparkColor.length ? sparkColor : LOOK.sparkColor;
    const swap = colorMode() === 'light' ? LIGHT_SWAP : DARK_SWAP;
    return palette.map(color => swap[color.toLowerCase()] ?? color);
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset']}
      computedProps={{ sparkColor: colors().length === 1 ? colors()[0] : colors() }}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            ref={el => (stageEl = el)}
            class="demo-container"
            style={{ position: 'relative', height: '420px', padding: 0, overflow: 'hidden', cursor: 'crosshair' }}
          >
            <Keyed token={sceneKey()}>
              {() => (
                <Stage
                  demo={props().demo}
                  ink={ink()}
                  colors={colors()}
                  settings={settings() as Omit<ClickSparkProps, 'sparkColor'>}
                  stage={() => stageEl}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={colors()}
              min={1}
              max={6}
              onChange={value => updateProp('sparkColor', value)}
            />
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Easing"
              options={EASING_OPTIONS}
              value={settings().easing}
              onChange={value => updateProp('easing', value)}
            />
            <PreviewSelect
              title="Layer"
              options={LAYER_OPTIONS}
              value={settings().layer}
              onChange={value => updateProp('layer', value)}
            />
            <PreviewSlider
              title="Count"
              min={1}
              max={32}
              step={1}
              value={settings().sparkCount}
              onChange={value => updateProp('sparkCount', value)}
            />
            <PreviewSlider
              title="Size"
              min={4}
              max={40}
              step={1}
              value={settings().sparkSize}
              valueUnit="px"
              onChange={value => updateProp('sparkSize', value)}
            />
            <PreviewSlider
              title="Width"
              min={1}
              max={6}
              step={0.5}
              value={settings().sparkWidth}
              valueUnit="px"
              onChange={value => updateProp('sparkWidth', value)}
            />
            <PreviewSlider
              title="Distance"
              min={8}
              max={120}
              step={1}
              value={settings().sparkRadius}
              valueUnit="px"
              onChange={value => updateProp('sparkRadius', value)}
            />
            <PreviewSlider
              title="Duration"
              min={200}
              max={1600}
              step={50}
              value={settings().duration}
              valueUnit="ms"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Randomness"
              min={0}
              max={1}
              step={0.05}
              value={settings().randomness}
              onChange={value => updateProp('randomness', value)}
            />
            <PreviewSlider
              title="Gravity"
              min={0}
              max={2}
              step={0.05}
              value={settings().gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Spread"
              min={20}
              max={360}
              step={5}
              value={settings().spread}
              valueUnit="°"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Direction"
              min={-180}
              max={180}
              step={5}
              value={settings().direction}
              valueUnit="°"
              isDisabled={settings().spread >= 360}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSwitch title="Ring" isChecked={settings().ring} onChange={value => updateProp('ring', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={clickSpark} componentName="ClickSpark" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
