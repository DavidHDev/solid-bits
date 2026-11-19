import { createMemo, createSignal, untrack } from 'solid-js';
import { Dynamic, type JSX } from '@solidjs/web';
import {
  CheckListIcon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  ShoppingCart01Icon
} from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import Stepper, { Step, type StepperProps } from '@/content/Components/Stepper/Stepper';
import { stepper } from '@/constants/code/Components/stepperCode';

const DEFAULT_PROPS = {
  preset: 'onboarding',
  indicator: 'numbers',
  orientation: 'horizontal',
  transition: 'slide',
  accentColor: '',
  width: 440,
  radius: 24,
  frame: true,
  linear: false,
  disableStepIndicators: false,
  showFooter: true,
  backButtonText: 'Back',
  nextButtonText: 'Continue',
  completeButtonText: 'Complete'
};

const PRESETS: Record<string, Partial<typeof DEFAULT_PROPS>> = {
  onboarding: {},
  checkout: { orientation: 'vertical', width: 640, completeButtonText: 'Place order' },
  minimal: { indicator: 'dots', transition: 'fade', width: 400 },
  progress: { indicator: 'bars', linear: true }
};

const PRESET_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'progress', label: 'Progress' }
];

const INDICATOR_OPTIONS = [
  { value: 'numbers', label: 'Numbers' },
  { value: 'dots', label: 'Dots' },
  { value: 'bars', label: 'Bars' }
];

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const TRANSITION_OPTIONS = [
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'none', label: 'None' }
];

const heading: JSX.CSSProperties = {
  margin: '0',
  'font-size': '17px',
  'font-weight': 500,
  'line-height': 1.3,
  'letter-spacing': '-0.01em',
  color: 'var(--stepper-ink)'
};

const copy: JSX.CSSProperties = {
  margin: '6px 0 0',
  'font-size': '13.5px',
  'line-height': 1.55,
  color: 'var(--stepper-muted)'
};

function Option(props: { title: string; detail?: string; aside?: string; selected?: boolean; onSelect?: () => void }) {
  return (
    <Dynamic
      component={props.onSelect ? 'button' : 'div'}
      type={props.onSelect ? 'button' : undefined}
      onClick={() => props.onSelect?.()}
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        gap: '12px',
        width: '100%',
        padding: '11px 14px',
        border: 'none',
        'border-radius': '12px',
        background: props.selected ? 'var(--stepper-tile)' : 'var(--stepper-well)',
        'box-shadow': props.selected
          ? 'inset 0 0 0 1px var(--stepper-ring), var(--stepper-tile-shadow)'
          : 'inset 0 0 0 1px var(--stepper-tile-edge)',
        color: 'var(--stepper-ink)',
        font: 'inherit',
        'text-align': 'left',
        'box-sizing': 'border-box',
        cursor: props.onSelect ? 'pointer' : 'default',
        transition: 'background 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      <span style={{ display: 'flex', 'flex-direction': 'column', gap: '2px', 'min-width': '0' }}>
        <span style={{ 'font-size': '14px', 'font-weight': 500 }}>{props.title}</span>
        {props.detail && <span style={{ 'font-size': '12.5px', color: 'var(--stepper-muted)' }}>{props.detail}</span>}
      </span>
      {props.aside && (
        <span style={{ 'font-size': '13px', color: 'var(--stepper-muted)', 'font-variant-numeric': 'tabular-nums' }}>
          {props.aside}
        </span>
      )}
    </Dynamic>
  );
}

function Field(props: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [focused, setFocused] = createSignal(false);
  return (
    <input
      value={props.value}
      onInput={event => props.onChange(event.currentTarget.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={props.placeholder}
      style={{
        width: '100%',
        height: '42px',
        'margin-top': '14px',
        padding: '0 14px',
        'box-sizing': 'border-box',
        border: 'none',
        'border-radius': '12px',
        outline: 'none',
        background: 'var(--stepper-well)',
        'box-shadow': focused() ? 'inset 0 0 0 1px var(--stepper-ring)' : 'inset 0 0 0 1px var(--stepper-tile-edge)',
        color: 'var(--stepper-ink)',
        font: 'inherit',
        'font-size': '14px',
        transition: 'box-shadow 0.2s ease'
      }}
    />
  );
}

function Done(props: { title: string; text: string }) {
  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '14px', padding: '4px 0' }}>
      <span
        style={{
          display: 'grid',
          'place-items': 'center',
          flex: 'none',
          width: '40px',
          height: '40px',
          'border-radius': '12px',
          background: 'var(--stepper-well)',
          color: 'var(--stepper-ink)'
        }}
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.8} />
      </span>
      <span>
        <h3 style={heading}>{props.title}</h3>
        <p style={{ ...copy, 'margin-top': '2px' }}>{props.text}</p>
      </span>
    </div>
  );
}

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'The steps. Wrap each one in Step, which can also take a title, description and icon.'
  },
  {
    name: 'Step title',
    type: 'JSX.Element',
    default: '-',
    description: 'Label shown under the indicator, or beside it in the vertical layout.'
  },
  {
    name: 'Step description',
    type: 'JSX.Element',
    default: '-',
    description: 'Second line shown beside the indicator in the vertical layout.'
  },
  {
    name: 'Step icon',
    type: 'JSX.Element',
    default: '-',
    description: 'Icon shown inside the indicator instead of the number.'
  },
  {
    name: 'step',
    type: 'number',
    default: '-',
    description: 'Controls the current step yourself. Use it with onStepChange.'
  },
  { name: 'initialStep', type: 'number', default: '1', description: 'The step shown first.' },
  {
    name: 'onStepChange',
    type: '(step: number) => void',
    default: '() => {}',
    description: 'Called when the step changes.'
  },
  {
    name: 'onFinalStepCompleted',
    type: '() => void',
    default: '() => {}',
    description: 'Called when the last step is completed.'
  },
  {
    name: 'indicator',
    type: "'numbers' | 'dots' | 'bars'",
    default: "'numbers'",
    description: 'Style of the step indicators in the horizontal layout.'
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: 'Indicators across the top, or a rail of numbered steps beside the content.'
  },
  {
    name: 'transition',
    type: "'slide' | 'fade' | 'none'",
    default: "'slide'",
    description: 'How the content changes between steps. The height always animates.'
  },
  {
    name: 'linear',
    type: 'boolean',
    default: 'false',
    description: 'Only lets the indicators jump back to steps that have been reached.'
  },
  {
    name: 'disableStepIndicators',
    type: 'boolean',
    default: 'false',
    description: 'Stops the indicators from changing the step when clicked.'
  },
  {
    name: 'renderStepIndicator',
    type: '({ step, currentStep, onStepClick }) => JSX.Element',
    default: '-',
    description: 'Renders your own numbered indicator.'
  },
  { name: 'showFooter', type: 'boolean', default: 'true', description: 'Shows the Back and Continue buttons.' },
  { name: 'backButtonText', type: 'string', default: "'Back'", description: 'Text of the Back button.' },
  { name: 'nextButtonText', type: 'string', default: "'Continue'", description: 'Text of the Continue button.' },
  {
    name: 'completeButtonText',
    type: 'string',
    default: "'Complete'",
    description: 'Text of the Continue button on the last step.'
  },
  {
    name: 'backButtonProps',
    type: 'JSX.ButtonHTMLAttributes',
    default: '{}',
    description: 'Extra props for the Back button.'
  },
  {
    name: 'nextButtonProps',
    type: 'JSX.ButtonHTMLAttributes',
    default: '{}',
    description: 'Extra props for the Continue button, such as disabled while a step is incomplete.'
  },
  {
    name: 'completedContent',
    type: 'JSX.Element',
    default: '-',
    description: 'Shown in place of the steps once the last one is completed.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the panel and controls.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '-',
    description: 'Color of completed steps, the progress lines and the Continue button.'
  },
  { name: 'frame', type: 'boolean', default: 'true', description: 'Shows the frosted panel around the stepper.' },
  { name: 'radius', type: 'number', default: '24', description: 'Corner radius of the panel, in px.' },
  { name: 'width', type: 'number | string', default: '440', description: 'Maximum width of the stepper.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the stepper.' },
  {
    name: 'stepContainerClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the indicator row.'
  },
  { name: 'contentClassName', type: 'string', default: "''", description: 'Extra class names for the content area.' },
  { name: 'footerClassName', type: 'string', default: "''", description: 'Extra class names for the footer.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the stepper.' }
];

export default function StepperDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, accentColor: _accentColor, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = useColorModeValue('#27272a', '#f4f4f5');
  const [name, setName] = createSignal('');
  const [plan, setPlan] = createSignal('pro');
  const [shipping, setShipping] = createSignal('standard');
  const [step, setStep] = createSignal(1);

  const computedProps = createMemo(() => ({
    ...(props().accentColor ? { accentColor: props().accentColor } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  const applyPreset = (value: string) => {
    setStep(1);
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], accentColor: props().accentColor, preset: value });
  };

  const needsName = () => props().preset !== 'checkout' && step() === 3 && !name().trim();

  const checkoutSteps = () => [
    <Step
      title="Cart"
      description="2 items"
      icon={<HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={1.8} />}
    >
      <h3 style={heading}>Your cart</h3>
      <div style={{ display: 'grid', gap: '8px', 'margin-top': '14px' }}>
        <Option title="Desk lamp" detail="Matte black" aside="$89" />
        <Option title="Linen notebook" detail="A5, dotted" aside="$24" />
      </div>
    </Step>,
    <Step
      title="Shipping"
      description="Delivery speed"
      icon={<HugeiconsIcon icon={DeliveryTruck01Icon} size={16} strokeWidth={1.8} />}
    >
      <h3 style={heading}>How fast?</h3>
      <div style={{ display: 'grid', gap: '8px', 'margin-top': '14px' }}>
        <Option
          title="Standard"
          detail="3 to 5 days"
          aside="Free"
          selected={shipping() === 'standard'}
          onSelect={() => setShipping('standard')}
        />
        <Option
          title="Express"
          detail="Next day"
          aside="$12"
          selected={shipping() === 'express'}
          onSelect={() => setShipping('express')}
        />
      </div>
    </Step>,
    <Step
      title="Payment"
      description="Card on file"
      icon={<HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={1.8} />}
    >
      <h3 style={heading}>Pay with</h3>
      <div style={{ display: 'grid', gap: '8px', 'margin-top': '14px' }}>
        <Option title="Visa ending in 4242" detail="Expires 08/28" selected />
      </div>
    </Step>,
    <Step
      title="Review"
      description="Confirm order"
      icon={<HugeiconsIcon icon={CheckListIcon} size={16} strokeWidth={1.8} />}
    >
      <h3 style={heading}>Order total</h3>
      <p style={copy}>
        2 items with {shipping() === 'express' ? 'express' : 'standard'} delivery come to{' '}
        <span style={{ color: 'var(--stepper-ink)', 'font-weight': 500 }}>
          {shipping() === 'express' ? '$125' : '$113'}
        </span>
        .
      </p>
    </Step>
  ];

  const onboardingSteps = () => [
    <Step title="Welcome">
      <h3 style={heading}>Welcome aboard</h3>
      <p style={copy}>Set up your workspace in a few quick steps. It only takes a minute.</p>
    </Step>,
    <Step title="Plan">
      <h3 style={heading}>Choose a plan</h3>
      <p style={copy}>You can change this at any time.</p>
      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '8px', 'margin-top': '14px' }}>
        <Option
          title="Starter"
          detail="Free forever"
          selected={plan() === 'starter'}
          onSelect={() => setPlan('starter')}
        />
        <Option title="Pro" detail="$12 per month" selected={plan() === 'pro'} onSelect={() => setPlan('pro')} />
      </div>
    </Step>,
    <Step title="Profile">
      <h3 style={heading}>What should we call you?</h3>
      <Field value={name()} onChange={setName} placeholder="Your name" />
    </Step>,
    <Step title="Review">
      <h3 style={heading}>Looking good{name().trim() ? `, ${name().trim()}` : ''}</h3>
      <p style={copy}>
        You picked the {plan() === 'pro' ? 'Pro' : 'Starter'} plan. Complete setup to open your workspace.
      </p>
    </Step>
  ];

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'accentColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', height: '560px', padding: '16px', overflow: 'hidden' }}
          >
            <Keyed token={`${props().preset}-${rerenderKey()}`}>
              {() => {
                const checkout = untrack(() => props().preset === 'checkout');
                return (
                  <Stepper
                    {...(settings() as StepperProps)}
                    theme={theme()}
                    accentColor={props().accentColor || undefined}
                    onStepChange={value => {
                      setStep(value);
                    }}
                    onFinalStepCompleted={() => {
                      setStep(5);
                    }}
                    nextButtonProps={{ disabled: needsName() }}
                    completedContent={
                      checkout ? (
                        <Done title="Order placed" text="A receipt is on its way to your inbox." />
                      ) : (
                        <Done
                          title="Workspace ready"
                          text={`Welcome in${name().trim() ? `, ${name().trim()}` : ''}.`}
                        />
                      )
                    }
                  >
                    {checkout ? checkoutSteps() : onboardingSteps()}
                  </Stepper>
                );
              }}
            </Keyed>
            <RefreshButton
              onClick={() => {
                setStep(1);
                forceRerender();
              }}
            />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Indicator"
              options={INDICATOR_OPTIONS}
              value={settings().indicator}
              isDisabled={settings().orientation === 'vertical'}
              onChange={value => updateProp('indicator', value)}
            />
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={settings().orientation}
              onChange={(value: string) =>
                updateProps({ orientation: value, width: value === 'vertical' ? Math.max(settings().width, 600) : 440 })
              }
            />
            <PreviewSelect
              title="Transition"
              options={TRANSITION_OPTIONS}
              value={settings().transition}
              onChange={value => updateProp('transition', value)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={props().accentColor || ink()}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSlider
              title="Width"
              min={320}
              max={760}
              step={10}
              value={settings().width}
              valueUnit="px"
              onChange={value => updateProp('width', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewInput
              title="Back Text"
              value={settings().backButtonText}
              placeholder="Back"
              onChange={value => updateProp('backButtonText', value)}
            />
            <PreviewInput
              title="Continue Text"
              value={settings().nextButtonText}
              placeholder="Continue"
              onChange={value => updateProp('nextButtonText', value)}
            />
            <PreviewInput
              title="Complete Text"
              value={settings().completeButtonText}
              placeholder="Complete"
              onChange={value => updateProp('completeButtonText', value)}
            />
            <PreviewSwitch title="Frame" isChecked={settings().frame} onChange={value => updateProp('frame', value)} />
            <PreviewSwitch
              title="Linear"
              isChecked={settings().linear}
              onChange={value => updateProp('linear', value)}
            />
            <PreviewSwitch
              title="Disable Step Indicators"
              isChecked={settings().disableStepIndicators}
              onChange={value => updateProp('disableStepIndicators', value)}
            />
            <PreviewSwitch
              title="Show Footer"
              isChecked={settings().showFooter}
              onChange={value => updateProp('showFooter', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={stepper} componentName="Stepper" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
