import { For, Show, createMemo } from 'solid-js';
import {
  CheckmarkCircle02Icon,
  CircleIcon,
  DashedLineCircleIcon,
  FilterHorizontalIcon,
  Folder01Icon,
  InboxIcon,
  Layers01Icon,
  Loading03Icon,
  Search01Icon,
  Task01Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import LaserFlow from '@/content/Animations/LaserFlow/LaserFlow';
import { laserFlow } from '@/constants/code/Animations/laserFlowCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/LaserFlow';

const REVEAL_IMAGE = '/assets/demo/laser-ui.svg';

type Surface = { left: string; right: string; top: string };

const SURFACES: Record<string, Surface | null> = {
  waterfall: { left: '4%', right: '24%', top: '55%' },
  twin: { left: '27%', right: '27%', top: '55%' },
  floor: null,
  ember: { left: '24%', right: '22%', top: '54%' },
  glacier: { left: '20%', right: '42%', top: '52%' },
  quiet: { left: '4%', right: '24%', top: '55%' }
};

const propData: PropRow[] = [
  {
    name: 'surfaceRef',
    type: 'HTMLElement | (() => HTMLElement | undefined)',
    default: '-',
    description: 'Element the beam lands on. The light spreads along its top edge and spills over its corners.'
  },
  {
    name: 'beamPosition',
    type: 'number',
    default: '0.6',
    description: 'Horizontal position of the beam, from 0 at the left edge to 1 at the right edge.'
  },
  {
    name: 'surfaceLevel',
    type: 'number',
    default: '1',
    description: 'Where the beam lands when no surfaceRef is given, from 0 at the top to 1 at the bottom.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#3892ff'",
    description: 'Color of the light. Every other tone is derived from it.'
  },
  { name: 'intensity', type: 'number', default: '1.8', description: 'Overall brightness of the light.' },
  { name: 'beamWidth', type: 'number', default: '1.5', description: 'Thickness of the beam and its glow.' },
  {
    name: 'flare',
    type: 'number',
    default: '1.5',
    description: 'Size of the splash where the beam meets the surface.'
  },
  { name: 'spread', type: 'number', default: '1.5', description: 'How far the light travels along the surface.' },
  { name: 'spill', type: 'number', default: '1', description: 'How much light pours over the corners of the surface.' },
  { name: 'fog', type: 'number', default: '0.2', description: 'Amount of smoke lit up by the beam. 0 turns it off.' },
  { name: 'dust', type: 'number', default: '1.6', description: 'Amount of glittering dust flowing with the light.' },
  {
    name: 'streaks',
    type: 'number',
    default: '1.5',
    description: 'Brightness of the fine lines flowing along the splash.'
  },
  { name: 'dots', type: 'number', default: '1', description: 'Strength of the fine dot texture in the glow.' },
  { name: 'pulse', type: 'number', default: '1.5', description: 'How much the splash breathes over time.' },
  { name: 'speed', type: 'number', default: '1.5', description: 'Animation speed. 0 holds the light still.' },
  { name: 'seed', type: 'number', default: '3', description: 'Changes the shape of the smoke.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Brightens the light, smoke and dust softly around the cursor.'
  },
  {
    name: 'revealImage',
    type: 'string',
    default: '-',
    description: 'Image revealed through the light around the cursor, such as a screenshot of your UI.'
  },
  {
    name: 'revealRadius',
    type: 'number',
    default: '220',
    description: 'Radius of the reveal around the cursor, in pixels.'
  },
  {
    name: 'revealOpacity',
    type: 'number',
    default: '0.6',
    description: 'Strength of the revealed image. 0 hides it.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Drops the beam in and lets the light run along the surface on mount.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Use light for light page backgrounds.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const NAV: { icon: IconSvgElement; label: string; active?: boolean }[] = [
  { icon: InboxIcon, label: 'Inbox' },
  { icon: Task01Icon, label: 'My issues', active: true },
  { icon: Folder01Icon, label: 'Projects' },
  { icon: Layers01Icon, label: 'Views' }
];

const ISSUES: { icon: IconSvgElement; title: string; id: string; who: string }[] = [
  { icon: Loading03Icon, title: 'Polish the onboarding flow', id: 'APP-142', who: 'MK' },
  { icon: CircleIcon, title: 'Sync drafts across devices', id: 'APP-139', who: 'JL' },
  { icon: DashedLineCircleIcon, title: 'Audit color tokens', id: 'APP-131', who: 'AR' },
  { icon: CheckmarkCircle02Icon, title: 'Ship keyboard shortcuts', id: 'APP-127', who: 'DS' },
  { icon: CircleIcon, title: 'Faster search on large projects', id: 'APP-120', who: 'MK' }
];

const DOT = {
  width: '11px',
  height: '11px',
  'border-radius': '9999px',
  background: 'var(--surface-ghost-hover)',
  border: '1px solid var(--border-primary)'
};

function AppWindow(props: { setRef: (el: HTMLDivElement) => void; surface: Surface }) {
  return (
    <div
      ref={props.setRef}
      class="laser-window"
      style={{
        position: 'absolute',
        left: props.surface.left,
        right: props.surface.right,
        top: props.surface.top,
        bottom: '-24px',
        'border-radius': '14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden',
        color: 'var(--text-primary)',
        'pointer-events': 'none',
        'user-select': 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '34px',
          'align-items': 'center',
          padding: '0 12px',
          gap: '7px',
          'border-bottom': '1px solid var(--border-primary)',
          position: 'relative'
        }}
      >
        <div style={DOT} />
        <div style={DOT} />
        <div style={DOT} />
        <span
          class="laser-window-title"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            'text-align': 'center',
            'font-size': '12px',
            'font-weight': 500,
            color: 'var(--text-dimmed)'
          }}
        >
          Tracker
        </span>
      </div>
      <div style={{ display: 'flex', height: '100%' }}>
        <div
          class="laser-window-sidebar"
          style={{
            display: 'flex',
            'flex-direction': 'column',
            gap: '2px',
            width: '150px',
            'flex-shrink': 0,
            padding: '10px',
            'border-right': '1px solid var(--border-primary)'
          }}
        >
          <For each={NAV}>
            {item => (
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  padding: '0 8px',
                  height: '28px',
                  'border-radius': '8px',
                  background: item.active ? 'var(--surface-ghost)' : 'transparent',
                  color: item.active ? 'var(--text-primary)' : 'var(--text-dimmed)'
                }}
              >
                <HugeiconsIcon icon={item.icon} size={15} strokeWidth={1.6} />
                <span style={{ 'font-size': '12px', 'font-weight': 500, 'white-space': 'nowrap' }}>{item.label}</span>
              </div>
            )}
          </For>
        </div>
        <div style={{ flex: 1, 'min-width': 0, padding: '12px 16px 0' }}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': '8px'
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'baseline', gap: '8px', 'min-width': 0 }}>
              <span style={{ 'font-size': '13px', 'font-weight': 500, 'white-space': 'nowrap' }}>My issues</span>
              <span style={{ 'font-size': '12px', color: 'var(--text-dimmed)' }}>{ISSUES.length}</span>
            </div>
            <div class="laser-window-tools" style={{ display: 'flex', gap: '6px', color: 'var(--text-dimmed)' }}>
              <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.6} />
              <HugeiconsIcon icon={FilterHorizontalIcon} size={15} strokeWidth={1.6} />
            </div>
          </div>
          <For each={ISSUES}>
            {issue => (
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '10px',
                  height: '34px',
                  'border-top': '1px solid var(--border-primary)',
                  'min-width': 0
                }}
              >
                <div style={{ color: 'var(--text-dimmed)', 'flex-shrink': 0, display: 'flex' }}>
                  <HugeiconsIcon icon={issue.icon} size={14} strokeWidth={1.8} />
                </div>
                <span
                  style={{
                    'font-size': '12px',
                    flex: 1,
                    'min-width': 0,
                    'white-space': 'nowrap',
                    overflow: 'hidden',
                    'text-overflow': 'ellipsis'
                  }}
                >
                  {issue.title}
                </span>
                <span
                  class="laser-window-meta"
                  style={{ 'font-size': '11px', color: 'var(--text-dimmed)', 'white-space': 'nowrap' }}
                >
                  {issue.id}
                </span>
                <div
                  class="laser-window-meta"
                  style={{
                    display: 'flex',
                    width: '20px',
                    height: '20px',
                    'flex-shrink': 0,
                    'border-radius': '9999px',
                    background: 'var(--surface-ghost)',
                    border: '1px solid var(--border-primary)',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'font-size': '9px',
                    'font-weight': 500,
                    color: 'var(--text-muted)'
                  }}
                >
                  {issue.who}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export default function LaserFlowDemo() {
  let surfaceEl: HTMLDivElement | undefined;
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const surface = createMemo(() => {
    const preset = props().preset;
    return preset in SURFACES ? SURFACES[preset] : SURFACES.waterfall;
  });
  const surfaceRef = () => surfaceEl;

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => (
                <LaserFlow
                  {...settings()}
                  revealImage={REVEAL_IMAGE}
                  theme={theme()}
                  surfaceRef={surface() ? surfaceRef : undefined}
                />
              )}
            </Keyed>

            <Show when={surface()} keyed>
              {value => <AppWindow setRef={el => (surfaceEl = el)} surface={value} />}
            </Show>

            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Beam Position"
              min={0.2}
              max={0.8}
              step={0.01}
              value={settings().beamPosition}
              onChange={value => updateProp('beamPosition', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Beam Width"
              min={0.4}
              max={3}
              step={0.05}
              value={settings().beamWidth}
              onChange={value => updateProp('beamWidth', value)}
            />
            <PreviewSlider
              title="Flare"
              min={0.5}
              max={2}
              step={0.05}
              value={settings().flare}
              onChange={value => updateProp('flare', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0.4}
              max={2}
              step={0.05}
              value={settings().spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Spill"
              min={0}
              max={2}
              step={0.05}
              value={settings().spill}
              onChange={value => updateProp('spill', value)}
            />
            <PreviewSlider
              title="Fog"
              min={0}
              max={2}
              step={0.05}
              value={settings().fog}
              onChange={value => updateProp('fog', value)}
            />
            <PreviewSlider
              title="Dust"
              min={0}
              max={2}
              step={0.05}
              value={settings().dust}
              onChange={value => updateProp('dust', value)}
            />
            <PreviewSlider
              title="Streaks"
              min={0}
              max={2}
              step={0.05}
              value={settings().streaks}
              onChange={value => updateProp('streaks', value)}
            />
            <PreviewSlider
              title="Dots"
              min={0}
              max={2}
              step={0.05}
              value={settings().dots}
              onChange={value => updateProp('dots', value)}
            />
            <PreviewSlider
              title="Pulse"
              min={0}
              max={2}
              step={0.05}
              value={settings().pulse}
              onChange={value => updateProp('pulse', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Seed"
              min={0}
              max={20}
              step={1}
              value={settings().seed}
              onChange={value => updateProp('seed', value)}
            />
            <PreviewSlider
              title="Reveal Radius"
              min={80}
              max={400}
              step={10}
              value={settings().revealRadius}
              valueUnit="px"
              onChange={value => updateProp('revealRadius', value)}
            />
            <PreviewSlider
              title="Reveal Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().revealOpacity}
              onChange={value => updateProp('revealOpacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings().mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={laserFlow} componentName="LaserFlow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
