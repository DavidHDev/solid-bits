import { createContext, useContext, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';

export type ComponentPropsContextValue = {
  props: Accessor<Record<string, unknown>>;
  defaultProps: Accessor<Record<string, unknown>>;
  hasChanges: Accessor<boolean>;
  resetProps: () => void;
  demoOnlyProps: Accessor<string[]>;
  computedProps: Accessor<Record<string, unknown>>;
};

const ComponentPropsContext = createContext<ComponentPropsContextValue | null>(null);

const EMPTY: ComponentPropsContextValue = {
  props: () => ({}),
  defaultProps: () => ({}),
  hasChanges: () => false,
  resetProps: () => {},
  demoOnlyProps: () => [],
  computedProps: () => ({})
};

export function ComponentPropsProvider(props: {
  props: Record<string, unknown>;
  defaultProps: Record<string, unknown>;
  resetProps: () => void;
  hasChanges: boolean;
  demoOnlyProps?: string[];
  computedProps?: Record<string, unknown>;
  children: JSX.Element;
}) {
  const value: ComponentPropsContextValue = {
    props: () => props.props,
    defaultProps: () => props.defaultProps,
    hasChanges: () => props.hasChanges,
    resetProps: () => props.resetProps(),
    demoOnlyProps: () => props.demoOnlyProps ?? [],
    computedProps: () => props.computedProps ?? {}
  };
  return <ComponentPropsContext value={value}>{props.children}</ComponentPropsContext>;
}

export function useComponentPropsContext(): ComponentPropsContextValue {
  return useContext(ComponentPropsContext) ?? EMPTY;
}

export function hasComponentPropsContext(): boolean {
  return useContext(ComponentPropsContext) !== null;
}
