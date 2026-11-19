import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { FavouriteIcon, PlayIcon, Share08Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import TargetCursor, { type TargetCursorProps } from '@/content/Animations/TargetCursor/TargetCursor';
import { targetCursor } from '@/constants/code/Animations/targetCursorCode';

const LOOK = {
  spinDuration: 2,
  hoverDuration: 0.2,
  size: 36,
  cornerSize: 12,
  thickness: 3,
  padding: 6,
  dotSize: 4
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  cursorColor: '#ffffff',
  cursorColorOnTarget: '#ffffff',
  blendMode: 'difference',
  parallaxOn: true,
  matchRadius: true,
  showLabel: true,
  clickEffect: true,
  hideDefaultCursor: true
};

const PRESETS: Record<string, typeof LOOK> = {
  classic: { ...LOOK },
  calm: { ...LOOK, spinDuration: 0, thickness: 1.5, cornerSize: 10, padding: 8, size: 30, hoverDuration: 0.35 },
  bold: { ...LOOK, spinDuration: 3, thickness: 4, cornerSize: 18, padding: 10, size: 46, dotSize: 6 },
  tight: { ...LOOK, spinDuration: 1.2, thickness: 2, cornerSize: 8, padding: 2, size: 24, hoverDuration: 0.12 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'calm', label: 'Calm' },
  { value: 'bold', label: 'Bold' },
  { value: 'tight', label: 'Tight' }
];

const BLEND_OPTIONS = [
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'normal', label: 'Normal' }
];

const propData: PropRow[] = [
  {
    name: 'targetSelector',
    type: 'string',
    default: "'.cursor-target'",
    description: 'CSS selector for the elements the brackets lock onto.'
  },
  { name: 'cursorColor', type: 'string', default: "'#ffffff'", description: 'Color of the brackets and dot.' },
  {
    name: 'cursorColorOnTarget',
    type: 'string',
    default: '-',
    description: 'Color the cursor blends to while locked onto a target.'
  },
  {
    name: 'spinDuration',
    type: 'number',
    default: '2',
    description: 'Seconds per turn while the cursor roams. 0 stops the spin.'
  },
  {
    name: 'hoverDuration',
    type: 'number',
    default: '0.2',
    description: 'How long the brackets take to snap onto a target, in seconds.'
  },
  {
    name: 'parallaxOn',
    type: 'boolean',
    default: 'true',
    description: 'Lets the locked brackets lean slightly toward the cursor.'
  },
  {
    name: 'hideDefaultCursor',
    type: 'boolean',
    default: 'true',
    description: 'Hides the system cursor while this cursor is shown.'
  },
  { name: 'size', type: 'number', default: '36', description: 'Size of the reticle while roaming, in px.' },
  { name: 'cornerSize', type: 'number', default: '12', description: 'Length of each bracket arm, in px.' },
  { name: 'thickness', type: 'number', default: '3', description: 'Stroke width of the brackets, in px.' },
  {
    name: 'padding',
    type: 'number',
    default: '6',
    description: 'Gap between a locked target and the brackets, in px.'
  },
  {
    name: 'matchRadius',
    type: 'boolean',
    default: 'true',
    description: "Rounds the brackets to follow the target's corner radius."
  },
  { name: 'dotSize', type: 'number', default: '4', description: 'Size of the center dot, in px. 0 hides it.' },
  {
    name: 'blendMode',
    type: 'string',
    default: "'difference'",
    description: 'CSS blend mode of the cursor. Difference keeps it visible on any background.'
  },
  {
    name: 'showLabel',
    type: 'boolean',
    default: 'true',
    description: 'Shows the data-cursor-label text of a locked target above the brackets.'
  },
  {
    name: 'clickEffect',
    type: 'boolean',
    default: 'true',
    description: 'Squeezes the brackets and dot while the mouse button is held.'
  },
  {
    name: 'container',
    type: '{ current: HTMLElement } | HTMLElement',
    default: '-',
    description: 'Limits the cursor to one element. By default it works across the whole page.'
  }
];

const roundStyle: JSX.CSSProperties = {
  width: '48px',
  height: '48px',
  'border-radius': '50%',
  display: 'grid',
  'place-items': 'center',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)'
};

export default function TargetCursorDemo() {
  const stageRef: { current: HTMLElement | null } = { current: null };
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue('light', 'dark');
  const photo = () => `/assets/demo/${theme() === 'light' ? 'day' : 'night'}-sky.webp`;

  const applyPreset = (value: string) => {
    const defaults = defaultProps();
    const current = settings();
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof typeof DEFAULT_PROPS]])
    );
    updateProps({
      ...base,
      ...PRESETS[value],
      cursorColor: current.cursorColor,
      cursorColorOnTarget: current.cursorColorOnTarget,
      blendMode: current.blendMode,
      preset: value
    });
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
          <div
            ref={el => (stageRef.current = el)}
            class="demo-container"
            style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '20px' }}>
              <div
                class="cursor-target h-[170px] w-[260px] md:h-[200px] md:w-[320px]"
                data-cursor-label="View"
                style={{ 'border-radius': '20px', overflow: 'hidden', background: 'var(--bg-elevated)' }}
              >
                <img
                  src={photo()}
                  alt=""
                  draggable="false"
                  style={{ width: '100%', height: '100%', 'object-fit': 'cover', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
                <button
                  type="button"
                  class="cursor-target"
                  data-cursor-label="Play"
                  style={{
                    height: '48px',
                    padding: '0 22px',
                    'border-radius': '12px',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-body)',
                    'font-weight': 500,
                    'font-size': '15px'
                  }}
                >
                  <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={2} />
                  Play
                </button>
                <button type="button" class="cursor-target" data-cursor-label="Like" style={roundStyle}>
                  <HugeiconsIcon icon={FavouriteIcon} size={20} strokeWidth={1.8} />
                </button>
                <button type="button" class="cursor-target" data-cursor-label="Share" style={roundStyle}>
                  <HugeiconsIcon icon={Share08Icon} size={20} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Cursor Color"
              color={settings().cursorColor}
              onChange={v => updateProp('cursorColor', v)}
            />
            <PreviewColorPickerCustom
              title="Color On Target"
              color={settings().cursorColorOnTarget}
              onChange={v => updateProp('cursorColorOnTarget', v)}
            />
            <PreviewSelect
              title="Blend Mode"
              options={BLEND_OPTIONS}
              value={settings().blendMode}
              onChange={v => updateProp('blendMode', v)}
            />
            <PreviewSlider
              title="Spin Duration"
              min={0}
              max={5}
              step={0.1}
              value={settings().spinDuration}
              valueUnit="s"
              onChange={v => updateProp('spinDuration', v)}
            />
            <PreviewSlider
              title="Hover Duration"
              min={0.05}
              max={1}
              step={0.05}
              value={settings().hoverDuration}
              valueUnit="s"
              onChange={v => updateProp('hoverDuration', v)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={80}
              step={1}
              value={settings().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Corner Size"
              min={4}
              max={30}
              step={1}
              value={settings().cornerSize}
              valueUnit="px"
              onChange={v => updateProp('cornerSize', v)}
            />
            <PreviewSlider
              title="Thickness"
              min={1}
              max={6}
              step={0.5}
              value={settings().thickness}
              valueUnit="px"
              onChange={v => updateProp('thickness', v)}
            />
            <PreviewSlider
              title="Padding"
              min={0}
              max={24}
              step={1}
              value={settings().padding}
              valueUnit="px"
              onChange={v => updateProp('padding', v)}
            />
            <PreviewSlider
              title="Dot Size"
              min={0}
              max={12}
              step={1}
              value={settings().dotSize}
              valueUnit="px"
              onChange={v => updateProp('dotSize', v)}
            />
            <PreviewSwitch
              title="Match Radius"
              isChecked={settings().matchRadius}
              onChange={v => updateProp('matchRadius', v)}
            />
            <PreviewSwitch
              title="Parallax"
              isChecked={settings().parallaxOn}
              onChange={v => updateProp('parallaxOn', v)}
            />
            <PreviewSwitch
              title="Show Label"
              isChecked={settings().showLabel}
              onChange={v => updateProp('showLabel', v)}
            />
            <PreviewSwitch
              title="Click Effect"
              isChecked={settings().clickEffect}
              onChange={v => updateProp('clickEffect', v)}
            />
            <PreviewSwitch
              title="Hide Default Cursor"
              isChecked={settings().hideDefaultCursor}
              onChange={v => updateProp('hideDefaultCursor', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={targetCursor} componentName="TargetCursor" />
        </CodeTab>
      </TabsLayout>

      <TargetCursor {...(settings() as TargetCursorProps)} container={stageRef} />
    </ComponentPropsProvider>
  );
}
