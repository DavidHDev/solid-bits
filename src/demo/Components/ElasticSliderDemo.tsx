import { For, Match, Switch, createEffect, createMemo, createSignal } from 'solid-js';
import {
  AirplaneModeIcon,
  BluetoothIcon,
  Moon02Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  Sun03Icon,
  SunDimIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute02Icon,
  Wifi01Icon
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

import ElasticSlider, { type ElasticSliderProps } from '@/content/Components/ElasticSlider/ElasticSlider';
import { elasticSlider } from '@/constants/code/Components/elasticSliderCode';
import './ElasticSliderDemo.css';

const SONG = 217;

type Theme = 'light' | 'dark';

const PHOTOS: Record<Theme, string> = {
  light: '/assets/demo/day-sky.webp',
  dark: '/assets/demo/night-sky.webp'
};

type ToggleId = 'wifi' | 'bluetooth' | 'airplane' | 'focus';

const TOGGLES: { id: ToggleId; label: string; icon: IconSvgElement }[] = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi01Icon },
  { id: 'bluetooth', label: 'Bluetooth', icon: BluetoothIcon },
  { id: 'airplane', label: 'Airplane Mode', icon: AirplaneModeIcon },
  { id: 'focus', label: 'Do Not Disturb', icon: Moon02Icon }
];

const ICON_SETS: Record<string, [IconSvgElement, IconSvgElement]> = {
  volume: [VolumeLowIcon, VolumeHighIcon],
  brightness: [SunDimIcon, Sun03Icon]
};

const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

const signed = (value: number) => {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : '0';
};

const LOOK = {
  orientation: 'horizontal',
  icons: 'volume',
  iconPlacement: 'outside',
  valuePosition: 'top',
  thickness: 6,
  activeThickness: 12,
  radius: 40,
  restOpacity: 0.7,
  fillFrom: 0,
  isStepped: false,
  stepSize: 10,
  ticks: false,
  thumb: false,
  jumpToClick: true
};

type Look = typeof LOOK;

const PRESETS: Record<string, Partial<Look>> = {
  line: {},
  pill: {
    icons: 'brightness',
    iconPlacement: 'inside',
    valuePosition: 'inside',
    thickness: 44,
    activeThickness: 48,
    radius: 14,
    restOpacity: 1
  },
  vertical: {
    orientation: 'vertical',
    iconPlacement: 'inside',
    valuePosition: 'none',
    thickness: 64,
    activeThickness: 68,
    radius: 22,
    restOpacity: 1,
    jumpToClick: false
  },
  stepped: {
    icons: 'none',
    valuePosition: 'bubble',
    thickness: 6,
    activeThickness: 10,
    restOpacity: 1,
    isStepped: true,
    stepSize: 10,
    ticks: true,
    thumb: true
  }
};

const DEFAULT_PROPS = {
  demo: 'player',
  preset: 'line',
  fillColor: '',
  maxStretch: 50,
  bounce: 0.5,
  growOnHover: true,
  wheel: false,
  ...LOOK
};

const DEMO_OPTIONS = [
  { value: 'player', label: 'Player' },
  { value: 'control', label: 'Control Center' },
  { value: 'editor', label: 'Editor' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'pill', label: 'Pill' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'stepped', label: 'Stepped' }
];

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const ICON_OPTIONS = [
  { value: 'volume', label: 'Volume' },
  { value: 'brightness', label: 'Brightness' },
  { value: 'none', label: 'None' }
];

const PLACEMENT_OPTIONS = [
  { value: 'outside', label: 'Outside' },
  { value: 'inside', label: 'Inside' }
];

const VALUE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bubble', label: 'Bubble' },
  { value: 'inside', label: 'Inside' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  { name: 'value', type: 'number', default: '-', description: 'Controlled value. Pair it with onChange.' },
  { name: 'defaultValue', type: 'number', default: '50', description: 'Starting value when uncontrolled.' },
  { name: 'startingValue', type: 'number', default: '0', description: 'Lowest value of the range.' },
  { name: 'maxValue', type: 'number', default: '100', description: 'Highest value of the range.' },
  { name: 'isStepped', type: 'boolean', default: 'false', description: 'Snaps the value to stepSize increments.' },
  { name: 'stepSize', type: 'number', default: '1', description: 'Size of each step when isStepped is on.' },
  { name: 'onChange', type: '(value: number) => void', default: '-', description: 'Called as the value changes.' },
  {
    name: 'onChangeEnd',
    type: '(value: number) => void',
    default: '-',
    description: 'Called when a drag, key press or scroll finishes.'
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: 'Direction of the track. Vertical sliders fill from the bottom.'
  },
  {
    name: 'leftIcon',
    type: 'JSX.Element',
    default: 'volume low icon',
    description: 'Icon at the start of the track. Pass null to hide it.'
  },
  {
    name: 'rightIcon',
    type: 'JSX.Element',
    default: 'volume high icon',
    description: 'Icon at the end of the track. Pass null to hide it.'
  },
  {
    name: 'iconPlacement',
    type: "'outside' | 'inside'",
    default: "'outside'",
    description: 'Puts the icons beside the track, or inside it once the track is thick enough to hold them.'
  },
  {
    name: 'valuePosition',
    type: "'top' | 'bubble' | 'inside' | 'none'",
    default: "'top'",
    description: 'Where the value shows. Bubble rides above the fill while the slider is active.'
  },
  {
    name: 'formatValue',
    type: '(value: number) => string',
    default: '-',
    description: 'Formats the shown value and the value read by screen readers.'
  },
  {
    name: 'ticks',
    type: 'boolean | number[]',
    default: 'false',
    description:
      'Marks along the track. True marks every step, or every tenth when not stepped. An array marks those values.'
  },
  { name: 'thumb', type: 'boolean', default: 'false', description: 'Shows a round handle at the end of the fill.' },
  {
    name: 'fillFrom',
    type: 'number',
    default: 'startingValue',
    description: 'Value the fill grows from. Set it to the middle of the range for a centered, two-way fill.'
  },
  { name: 'thickness', type: 'number', default: '6', description: 'Track thickness in px at rest.' },
  {
    name: 'activeThickness',
    type: 'number',
    default: '12',
    description: 'Track thickness in px while hovered, focused or dragged.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '-',
    description: 'Corner radius of the track in px. Fully round when left out.'
  },
  {
    name: 'restOpacity',
    type: 'number',
    default: '0.7',
    description: 'Opacity while idle. The slider brightens to full when active.'
  },
  {
    name: 'growOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Hovering activates the slider. When off it only grows while pressed or focused.'
  },
  {
    name: 'maxStretch',
    type: 'number',
    default: '50',
    description: 'Furthest the track stretches in px when pulled past an end. 0 turns the stretch off.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.5',
    description: 'How much the track wobbles as it springs back, from 0 to 0.95.'
  },
  {
    name: 'jumpToClick',
    type: 'boolean',
    default: 'true',
    description: 'Pressing the track jumps to the pointer. When off, dragging moves the value from where it was.'
  },
  { name: 'wheel', type: 'boolean', default: 'false', description: 'Lets the scroll wheel change the value.' },
  {
    name: 'trackColor',
    type: 'string',
    default: "'color-mix(in srgb, currentColor 18%, transparent)'",
    description: 'Color of the empty track.'
  },
  { name: 'rangeColor', type: 'string', default: "'currentColor'", description: 'Color of the fill.' },
  { name: 'iconColor', type: 'string', default: "'currentColor'", description: 'Color of the outside icons.' },
  {
    name: 'contentColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Color of icons, values and ticks over the empty track.'
  },
  {
    name: 'fillContentColor',
    type: 'string',
    default: "'auto'",
    description: 'Color of icons, values and ticks over the fill. Auto picks light or dark from the fill color.'
  },
  { name: 'thumbColor', type: 'string', default: "'#ffffff'", description: 'Color of the handle.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Turns off interaction and dims the slider.' },
  { name: 'ariaLabel', type: 'string', default: "'Slider'", description: 'Accessible name of the slider.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

type Physics = Pick<ElasticSliderProps, 'maxStretch' | 'bounce' | 'growOnHover' | 'wheel'>;

type SceneProps = { theme: Theme; fill: string; physics: Physics };

function PlayerScene(props: SceneProps) {
  const [position, setPosition] = createSignal(84);
  const [volume, setVolume] = createSignal(64);
  const [playing, setPlaying] = createSignal(true);
  let seeking = false;

  createEffect(playing, isPlaying => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => {
      if (seeking) return;
      const next = position() + 0.25;
      setPosition(Math.min(next, SONG));
      if (next >= SONG) setPlaying(false);
    }, 250);
    return () => clearInterval(timer);
  });

  const line = createMemo<ElasticSliderProps>(() => ({
    style: { width: '100%' },
    valuePosition: 'none',
    thickness: 5,
    activeThickness: 9,
    trackColor: 'var(--esd-track)',
    rangeColor: props.fill || 'var(--esd-fill)',
    iconColor: 'var(--esd-muted)',
    ...props.physics
  }));

  return (
    <div class="esd-card esd-player">
      <img class="esd-player__art" src={PHOTOS[props.theme]} alt="" draggable="false" />
      <div class="esd-player__meta">
        <strong>Cirrus</strong>
        <span>Open Skies</span>
      </div>

      <div class="esd-player__seek">
        <ElasticSlider
          {...line()}
          value={position()}
          maxValue={SONG}
          onChange={value => {
            seeking = true;
            setPosition(value);
          }}
          onChangeEnd={() => {
            seeking = false;
          }}
          leftIcon={null}
          rightIcon={null}
          formatValue={clock}
          ariaLabel="Seek"
        />
        <div class="esd-player__times">
          <span>{clock(position())}</span>
          <span>−{clock(SONG - position())}</span>
        </div>
      </div>

      <div class="esd-player__transport">
        <button type="button" class="esd-icon-button" aria-label="Previous" onClick={() => setPosition(0)}>
          <HugeiconsIcon icon={PreviousIcon} size={22} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          class="esd-icon-button esd-icon-button--raised"
          aria-label={playing() ? 'Pause' : 'Play'}
          onClick={() => {
            if (!playing() && position() >= SONG) setPosition(0);
            setPlaying(value => !value);
          }}
        >
          <HugeiconsIcon icon={playing() ? PauseIcon : PlayIcon} size={24} strokeWidth={1.75} />
        </button>
        <button type="button" class="esd-icon-button" aria-label="Next" onClick={() => setPosition(0)}>
          <HugeiconsIcon icon={NextIcon} size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div class="esd-player__volume">
        <ElasticSlider
          {...line()}
          value={volume()}
          onChange={value => {
            setVolume(value);
          }}
          leftIcon={<HugeiconsIcon icon={VolumeLowIcon} size={18} strokeWidth={1.75} />}
          rightIcon={<HugeiconsIcon icon={VolumeHighIcon} size={18} strokeWidth={1.75} />}
          ariaLabel="Volume"
        />
      </div>
    </div>
  );
}

function ControlScene(props: SceneProps) {
  const [brightness, setBrightness] = createSignal(72);
  const [volume, setVolume] = createSignal(40);
  const [toggles, setToggles] = createSignal<Record<ToggleId, boolean>>({
    wifi: true,
    bluetooth: true,
    airplane: false,
    focus: false
  });

  const pill = createMemo<ElasticSliderProps>(() => ({
    orientation: 'vertical',
    style: { height: '182px' },
    thickness: 84,
    activeThickness: 88,
    radius: 28,
    iconPlacement: 'inside',
    valuePosition: 'none',
    rightIcon: null,
    restOpacity: 1,
    jumpToClick: false,
    trackColor: 'var(--esd-well)',
    rangeColor: props.fill || 'var(--esd-pill-fill)',
    contentColor: 'var(--esd-pill-ink)',
    ...props.physics
  }));
  const volumeIcon = () => (volume() <= 0 ? VolumeMute02Icon : volume() < 50 ? VolumeLowIcon : VolumeHighIcon);

  return (
    <div class="esd-cc">
      <div class="esd-cc__module">
        <For each={TOGGLES}>
          {toggle => (
            <button
              type="button"
              class="esd-cc__toggle"
              aria-label={toggle.label}
              aria-pressed={toggles()[toggle.id] ? 'true' : 'false'}
              data-on={toggles()[toggle.id] ? '' : undefined}
              onClick={() => setToggles(state => ({ ...state, [toggle.id]: !state[toggle.id] }))}
            >
              <HugeiconsIcon icon={toggle.icon} size={24} strokeWidth={1.75} />
            </button>
          )}
        </For>
      </div>
      <ElasticSlider
        {...pill()}
        value={brightness()}
        onChange={value => {
          setBrightness(value);
        }}
        leftIcon={<HugeiconsIcon icon={Sun03Icon} size={26} strokeWidth={1.75} />}
        ariaLabel="Brightness"
      />
      <ElasticSlider
        {...pill()}
        value={volume()}
        onChange={value => {
          setVolume(value);
        }}
        leftIcon={<HugeiconsIcon icon={volumeIcon()} size={26} strokeWidth={1.75} />}
        ariaLabel="Volume"
      />
    </div>
  );
}

function EditorScene(props: SceneProps) {
  const [exposure, setExposure] = createSignal(24);
  const [warmth, setWarmth] = createSignal(-30);
  const [angle, setAngle] = createSignal(-3);

  const cover = createMemo(() => {
    const radians = (Math.abs(angle()) * Math.PI) / 180;
    return Math.cos(radians) + 2 * Math.sin(radians);
  });
  const changed = () => exposure() !== 0 || warmth() !== 0 || angle() !== 0;

  const adjust = createMemo<ElasticSliderProps>(() => ({
    style: { width: '100%' },
    startingValue: -100,
    maxValue: 100,
    fillFrom: 0,
    ticks: [0],
    thumb: true,
    valuePosition: 'none',
    leftIcon: null,
    rightIcon: null,
    thickness: 4,
    activeThickness: 8,
    restOpacity: 1,
    trackColor: 'var(--esd-track)',
    rangeColor: props.fill || 'var(--esd-fill)',
    ...props.physics
  }));

  const rows = [
    {
      label: 'Exposure',
      text: () => signed(exposure()),
      slider: () => (
        <ElasticSlider
          {...adjust()}
          value={exposure()}
          onChange={value => {
            setExposure(value);
          }}
          formatValue={signed}
          ariaLabel="Exposure"
        />
      )
    },
    {
      label: 'Warmth',
      text: () => signed(warmth()),
      slider: () => (
        <ElasticSlider
          {...adjust()}
          value={warmth()}
          onChange={value => {
            setWarmth(value);
          }}
          formatValue={signed}
          ariaLabel="Warmth"
        />
      )
    },
    {
      label: 'Straighten',
      text: () => `${signed(angle())}°`,
      slider: () => (
        <ElasticSlider
          {...adjust()}
          value={angle()}
          onChange={value => {
            setAngle(value);
          }}
          startingValue={-10}
          maxValue={10}
          isStepped
          stepSize={1}
          ticks
          formatValue={value => `${signed(value)}°`}
          ariaLabel="Straighten"
        />
      )
    }
  ];

  return (
    <div class="esd-card esd-editor">
      <div class="esd-editor__head">
        <strong>Adjust</strong>
        <button
          type="button"
          class="esd-editor__reset"
          disabled={!changed()}
          onClick={() => {
            setExposure(0);
            setWarmth(0);
            setAngle(0);
          }}
        >
          Reset
        </button>
      </div>
      <div class="esd-editor__photo">
        <img
          src={PHOTOS[props.theme]}
          alt=""
          draggable="false"
          style={{
            filter: `brightness(${(1 + exposure() / 220).toFixed(3)}) saturate(${(1 + warmth() / 500).toFixed(3)})`,
            transform: `rotate(${angle()}deg) scale(${cover().toFixed(4)})`
          }}
        />
        <span
          class="esd-editor__tint"
          style={{
            background: warmth() >= 0 ? '#ff8a2a' : '#2a7dff',
            opacity: ((Math.abs(warmth()) / 100) * 0.7).toFixed(3)
          }}
        />
      </div>
      <div class="esd-editor__rows">
        <For each={rows}>
          {row => (
            <div>
              <div class="esd-editor__row-head">
                <span style={{ color: 'inherit' }}>{row.label}</span>
                <span>{row.text()}</span>
              </div>
              {row.slider()}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function BasicScene(props: { settings: ElasticSliderProps; icons: string; fill: string }) {
  const set = () => ICON_SETS[props.icons];
  const vertical = () => props.settings.orientation === 'vertical';
  const size = () => (props.settings.iconPlacement === 'inside' ? 20 : 18);
  return (
    <ElasticSlider
      {...props.settings}
      style={vertical() ? { height: '240px' } : { width: 'min(100%, 300px)' }}
      leftIcon={set() ? <HugeiconsIcon icon={set()[0]} size={size()} strokeWidth={1.75} /> : null}
      rightIcon={set() ? <HugeiconsIcon icon={set()[1]} size={size()} strokeWidth={1.75} /> : null}
      rangeColor={props.fill || undefined}
      ariaLabel="Slider"
    />
  );
}

export default function ElasticSliderDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, fillColor: _fillColor, icons: _icons, ...rest } = props();
    return rest as ElasticSliderProps & typeof rest;
  });
  const theme = useColorModeValue<Theme>('light', 'dark');
  const ink = useColorModeValue('#12161c', '#f2f4f7');
  const basic = () => props().demo === 'basic';
  const physics = createMemo<Physics>(() => ({
    maxStretch: props().maxStretch,
    bounce: props().bounce,
    growOnHover: props().growOnHover,
    wheel: props().wheel
  }));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof Look]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const fitInside = (name: 'iconPlacement' | 'valuePosition', value: string) => {
    const roomy = props().thickness >= 28;
    updateProps({
      [name]: value,
      ...(value === 'inside' && !roomy ? { thickness: 44, activeThickness: 48, radius: 14, restOpacity: 1 } : {})
    });
  };

  const computedProps = createMemo(() => {
    const fill = props().fillColor;
    return fill ? { rangeColor: fill } : {};
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset', 'fillColor', 'icons']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <div class="esd-scene" data-theme={theme()}>
              <Switch>
                <Match when={props().demo === 'player'}>
                  <PlayerScene theme={theme()} fill={props().fillColor} physics={physics()} />
                </Match>
                <Match when={props().demo === 'control'}>
                  <ControlScene theme={theme()} fill={props().fillColor} physics={physics()} />
                </Match>
                <Match when={props().demo === 'editor'}>
                  <EditorScene theme={theme()} fill={props().fillColor} physics={physics()} />
                </Match>
                <Match when={basic()}>
                  <BasicScene settings={settings()} icons={props().icons} fill={props().fillColor} />
                </Match>
              </Switch>
            </div>
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={(value: string) => updateProp('demo', value)}
            />
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={props().preset}
              isDisabled={!basic()}
              onChange={applyPreset}
            />
            <PreviewColorPickerCustom
              title="Fill Color"
              color={props().fillColor || ink()}
              onChange={value => updateProp('fillColor', value)}
            />
            <PreviewSlider
              title="Max Stretch"
              min={0}
              max={120}
              step={1}
              value={props().maxStretch}
              valueUnit="px"
              onChange={value => updateProp('maxStretch', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.95}
              step={0.05}
              value={props().bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={props().orientation}
              isDisabled={!basic()}
              onChange={(value: string) => updateProp('orientation', value)}
            />
            <PreviewSelect
              title="Icons"
              options={ICON_OPTIONS}
              value={props().icons}
              isDisabled={!basic()}
              onChange={(value: string) => updateProp('icons', value)}
            />
            <PreviewSelect
              title="Icon Placement"
              options={PLACEMENT_OPTIONS}
              value={props().iconPlacement}
              isDisabled={!basic() || props().icons === 'none'}
              onChange={(value: string) => fitInside('iconPlacement', value)}
            />
            <PreviewSelect
              title="Value"
              options={VALUE_OPTIONS}
              value={props().valuePosition}
              isDisabled={!basic()}
              onChange={(value: string) => fitInside('valuePosition', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={2}
              max={80}
              step={1}
              value={props().thickness}
              valueUnit="px"
              isDisabled={!basic()}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Active Thickness"
              min={2}
              max={84}
              step={1}
              value={props().activeThickness}
              valueUnit="px"
              isDisabled={!basic()}
              onChange={value => updateProp('activeThickness', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={props().radius}
              displayValue={value => (value >= 40 ? 'Full' : `${value}px`)}
              isDisabled={!basic()}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Rest Opacity"
              min={0.2}
              max={1}
              step={0.05}
              value={props().restOpacity}
              isDisabled={!basic()}
              onChange={value => updateProp('restOpacity', value)}
            />
            <PreviewSlider
              title="Fill From"
              min={0}
              max={100}
              step={1}
              value={props().fillFrom}
              isDisabled={!basic()}
              onChange={value => updateProp('fillFrom', value)}
            />
            <PreviewSlider
              title="Step Size"
              min={1}
              max={25}
              step={1}
              value={props().stepSize}
              isDisabled={!basic() || !props().isStepped}
              onChange={value => updateProp('stepSize', value)}
            />
            <PreviewSwitch
              title="Stepped"
              isChecked={props().isStepped}
              isDisabled={!basic()}
              onChange={value => updateProp('isStepped', value)}
            />
            <PreviewSwitch
              title="Ticks"
              isChecked={props().ticks}
              isDisabled={!basic()}
              onChange={value => updateProp('ticks', value)}
            />
            <PreviewSwitch
              title="Thumb"
              isChecked={props().thumb}
              isDisabled={!basic()}
              onChange={value => updateProp('thumb', value)}
            />
            <PreviewSwitch
              title="Grow on Hover"
              isChecked={props().growOnHover}
              onChange={value => updateProp('growOnHover', value)}
            />
            <PreviewSwitch
              title="Jump to Click"
              isChecked={props().jumpToClick}
              isDisabled={!basic()}
              onChange={value => updateProp('jumpToClick', value)}
            />
            <PreviewSwitch title="Wheel" isChecked={props().wheel} onChange={value => updateProp('wheel', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={elasticSlider} componentName="ElasticSlider" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
