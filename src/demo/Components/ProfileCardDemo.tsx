import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import ProfileCard from '@/content/Components/ProfileCard/ProfileCard';
import { profileCard } from '@/constants/code/Components/profileCardCode';

const DEFAULT_PROPS = {
  iconPattern: true,
  backdropColor: '',
  holo: 0.8,
  glare: 0.5,
  tiltStrength: 12,
  parallax: 8,
  radius: 16,
  enableTilt: true,
  intro: true,
  showUserInfo: true,
  enableMobileTilt: false
};

const propData: PropRow[] = [
  { name: 'avatarUrl', type: 'string', default: "''", description: 'Portrait shown on the card.' },
  {
    name: 'iconUrl',
    type: 'string',
    default: '-',
    description: 'Tileable pattern, like a logo pattern. The holo foil shows only through it.'
  },
  {
    name: 'miniAvatarUrl',
    type: 'string',
    default: '-',
    description: 'Small round image next to the handle. Hidden when not set.'
  },
  { name: 'name', type: 'string', default: "'Javi A. Torres'", description: 'Name shown over the portrait.' },
  { name: 'title', type: 'string', default: "'Software Engineer'", description: 'Role shown under the name.' },
  { name: 'handle', type: 'string', default: "'javicodes'", description: 'Handle shown in the footer, without the @.' },
  { name: 'status', type: 'string', default: "'Online'", description: 'Status text shown under the handle.' },
  { name: 'statusColor', type: 'string', default: "'#22c55e'", description: 'Color of the status dot.' },
  { name: 'contactText', type: 'string', default: "'Contact'", description: 'Label of the contact button.' },
  {
    name: 'showUserInfo',
    type: 'boolean',
    default: 'true',
    description: 'Shows the footer with the handle, status and contact button.'
  },
  {
    name: 'onContactClick',
    type: '() => void',
    default: '-',
    description: 'Called when the contact button is clicked.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the frame and footer.' },
  {
    name: 'backdropColor',
    type: 'string',
    default: '-',
    description: 'Color behind the portrait. Shows around cut-out photos. Uses the theme color when not set.'
  },
  { name: 'radius', type: 'number', default: '16', description: 'Corner radius of the photo, in px.' },
  {
    name: 'holo',
    type: 'number',
    default: '0.8',
    description: 'Strength of the holographic foil, from 0 to 1. It lights up where the cursor catches it.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the light that follows the cursor, from 0 to 1.'
  },
  { name: 'enableTilt', type: 'boolean', default: 'true', description: 'Tilts the card toward the cursor.' },
  { name: 'tiltStrength', type: 'number', default: '12', description: 'Largest tilt angle, in degrees.' },
  {
    name: 'parallax',
    type: 'number',
    default: '8',
    description: 'How far the portrait shifts as the card tilts, in px.'
  },
  {
    name: 'enableMobileTilt',
    type: 'boolean',
    default: 'false',
    description: 'Tilts the card with the motion of the phone after a tap. Needs HTTPS.'
  },
  {
    name: 'mobileTiltSensitivity',
    type: 'number',
    default: '5',
    description: 'How strongly phone motion tilts the card.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Catches the light once as the card appears, then settles.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' }
];

export default function ProfileCardDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const settings = createMemo(() => {
    const { iconPattern: _iconPattern, backdropColor: _backdropColor, ...rest } = props();
    return rest;
  });
  const iconUrl = () => (props().iconPattern ? '/assets/demo/iconpattern.png' : undefined);

  const computedProps = createMemo(() => ({
    ...(iconUrl() ? { iconUrl: iconUrl() } : {}),
    ...(props().backdropColor ? { backdropColor: props().backdropColor } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['iconPattern', 'backdropColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '640px', overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => (
                <ProfileCard
                  name="Javi A. Torres"
                  title="Software Engineer"
                  handle="javicodes"
                  status="Online"
                  contactText="Contact"
                  avatarUrl="/assets/demo/person.webp"
                  iconUrl={iconUrl()}
                  backdropColor={props().backdropColor || undefined}
                  theme={theme()}
                  {...settings()}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Backdrop Color"
              color={props().backdropColor || (theme() === 'light' ? '#f6f7f8' : '#2e3034')}
              onChange={v => updateProp('backdropColor', v)}
            />
            <PreviewSlider
              title="Holo"
              min={0}
              max={1}
              step={0.05}
              value={settings().holo}
              onChange={v => updateProp('holo', v)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={settings().glare}
              onChange={v => updateProp('glare', v)}
            />
            <PreviewSlider
              title="Tilt Strength"
              min={0}
              max={25}
              step={1}
              value={settings().tiltStrength}
              valueUnit="°"
              onChange={v => updateProp('tiltStrength', v)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={20}
              step={1}
              value={settings().parallax}
              valueUnit="px"
              onChange={v => updateProp('parallax', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={28}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSwitch
              title="Icon Pattern"
              isChecked={props().iconPattern}
              onChange={v => updateProp('iconPattern', v)}
            />
            <PreviewSwitch title="Tilt" isChecked={settings().enableTilt} onChange={v => updateProp('enableTilt', v)} />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="User Info"
              isChecked={settings().showUserInfo}
              onChange={v => updateProp('showUserInfo', v)}
            />
            <PreviewSwitch
              title="Mobile Tilt"
              isChecked={settings().enableMobileTilt}
              onChange={v => updateProp('enableMobileTilt', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={profileCard} componentName="ProfileCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
