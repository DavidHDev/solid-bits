import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SlideCommit from '@/content/Micro/SlideCommit/SlideCommit';
import { slideCommit } from '@/constants/code/Micro/slideCommitCode';

type Outcome = 'resolve' | 'reject' | 'instant';

const DEFAULT_PROPS = {
  outcome: 'resolve' as Outcome,
  latency: 1200,
  label: 'Slide to pay',
  doneLabel: 'Paid',
  errorLabel: 'Payment failed',
  trackColor: '#262626',
  handleColor: '#f5f5f5',
  successColor: '#22c55e',
  dangerColor: '#e5484d',
  width: 280,
  height: 56,
  radius: 28,
  speed: 50,
  returnBounce: 0.38,
  landingDip: 0.026,
  holdMs: 1500,
  disabled: false
};

const OUTCOME_OPTIONS = [
  { value: 'resolve', label: 'Resolve' },
  { value: 'reject', label: 'Reject' },
  { value: 'instant', label: 'Instant' }
];

const propData: PropRow[] = [
  {
    name: 'label',
    type: 'JSX.Element',
    default: '"Slide to pay"',
    description: 'The instruction centred in the pill; the capsule wipes it as you drag.'
  },
  {
    name: 'doneLabel',
    type: 'JSX.Element',
    default: '"Paid"',
    description: 'The words beside the check once confirmed.'
  },
  {
    name: 'errorLabel',
    type: 'JSX.Element',
    default: '"Payment failed"',
    description: 'Replaces the instruction, in the danger colour, after a rejected promise.'
  },
  {
    name: 'onConfirm',
    type: '() => void | Promise<unknown>',
    default: '-',
    description:
      'Called when the handle reaches the end. Return a promise to show the spinner; it unfurls on resolve and springs home on reject.'
  },
  { name: 'onDone', type: '() => void', default: '-', description: 'Called when the done pill unfurls.' },
  {
    name: 'onError',
    type: '(reason: unknown) => void',
    default: '-',
    description: 'Called with the rejection reason; the component swallows it otherwise.'
  },
  { name: 'trackColor', type: 'string', default: '"#262626"', description: 'The pill behind the handle.' },
  {
    name: 'handleColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The handle and the ground it paints; the arrow colour is picked to read on it.'
  },
  { name: 'successColor', type: 'string', default: '"#22c55e"', description: 'Fill of the done pill.' },
  {
    name: 'dangerColor',
    type: 'string',
    default: '"#e5484d"',
    description: 'Tint of the handle and error label after a reject.'
  },
  {
    name: 'width',
    type: 'number',
    default: '280',
    description: 'Track width in pixels; the travel scales with it.'
  },
  {
    name: 'height',
    type: 'number',
    default: '56',
    description: 'Track height in pixels; the handle is 8px smaller.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '28',
    description: 'Track corner radius; the handle corner is 4px smaller so the two stay concentric.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '50',
    description: 'How fast the unfurl and the return take over once you let go.'
  },
  {
    name: 'returnBounce',
    type: 'number',
    default: '0.38',
    description: 'Energy left when the handle returns to the wall: 0 stops dead, 0.38 fills the 8% squash.'
  },
  {
    name: 'landingDip',
    type: 'number',
    default: '0.026',
    description: 'How much the track dips as the done pill lands. 0 removes it.'
  },
  {
    name: 'holdMs',
    type: 'number',
    default: '1500',
    description: 'How long the done pill stands before it closes back. 0 keeps it until the component remounts.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
  { name: 'icon', type: 'JSX.Element', default: 'undefined', description: 'Replaces the arrow in the handle.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root element.' }
];

export default function SlideCommitDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedTrack = useColorModeValue(
    () => (props().trackColor === DEFAULT_PROPS.trackColor ? '#f6f6f6' : props().trackColor),
    () => props().trackColor
  );
  const renderedHandle = useColorModeValue(
    () => (props().handleColor === DEFAULT_PROPS.handleColor ? '#18181b' : props().handleColor),
    () => props().handleColor
  );

  const handleConfirm = () => {
    const outcome = props().outcome;
    const latency = props().latency;
    if (outcome === 'instant') return undefined;
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => (outcome === 'reject' ? reject(new Error('Declined')) : resolve()), latency);
    });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '400px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <SlideCommit
              label={props().label}
              doneLabel={props().doneLabel}
              errorLabel={props().errorLabel}
              onConfirm={handleConfirm}
              trackColor={renderedTrack()}
              handleColor={renderedHandle()}
              successColor={props().successColor}
              dangerColor={props().dangerColor}
              width={props().width}
              height={props().height}
              radius={props().radius}
              speed={props().speed}
              returnBounce={props().returnBounce}
              landingDip={props().landingDip}
              holdMs={props().holdMs}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Outcome"
              options={OUTCOME_OPTIONS}
              value={props().outcome}
              onChange={(v: Outcome) => updateProp('outcome', v)}
              width={120}
            />
            <PreviewSlider
              title="Latency"
              min={0}
              max={3000}
              step={100}
              value={props().latency}
              valueUnit="ms"
              onChange={v => updateProp('latency', v)}
            />
            <PreviewInput title="Label" value={props().label} maxLength={28} onChange={v => updateProp('label', v)} />
            <PreviewInput
              title="Done Label"
              value={props().doneLabel}
              maxLength={20}
              onChange={v => updateProp('doneLabel', v)}
            />
            <PreviewInput
              title="Error Label"
              value={props().errorLabel}
              maxLength={28}
              onChange={v => updateProp('errorLabel', v)}
            />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack()}
              onChange={v => updateProp('trackColor', v)}
            />
            <PreviewColorPickerCustom
              title="Handle"
              color={renderedHandle()}
              onChange={v => updateProp('handleColor', v)}
            />
            <PreviewColorPickerCustom
              title="Success"
              color={props().successColor}
              onChange={v => updateProp('successColor', v)}
            />
            <PreviewColorPickerCustom
              title="Danger"
              color={props().dangerColor}
              onChange={v => updateProp('dangerColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={220}
              max={380}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={44}
              max={72}
              step={2}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={36}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={1}
              value={props().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Return Bounce"
              min={0}
              max={0.5}
              step={0.02}
              value={props().returnBounce}
              onChange={v => updateProp('returnBounce', v)}
            />
            <PreviewSlider
              title="Landing Dip"
              min={0}
              max={0.06}
              step={0.002}
              value={props().landingDip}
              onChange={v => updateProp('landingDip', v)}
            />
            <PreviewSlider
              title="Hold"
              min={500}
              max={4000}
              step={100}
              value={props().holdMs}
              valueUnit="ms"
              onChange={v => updateProp('holdMs', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={slideCommit} componentName="SlideCommit" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
