import { createContext, useContext, type Accessor } from 'solid-js';
import type { CodeObject } from '@/types/code';
import type { PropRow } from './PropTable';

export type DemoMode = 'none' | 'landing' | 'mobile' | 'card';

export type DemoControl = {
  mode: Accessor<DemoMode>;
  setMode: (mode: DemoMode) => void;
  setNarrow: (narrow: boolean) => void;
  setPresent: (present: boolean) => void;
};

export type TabsContextValue = {
  activeTab: Accessor<'preview' | 'code'>;
  codeMounted: Accessor<boolean>;
  registerCode: (entry: { codeObject: CodeObject; componentName: string }) => () => void;
  registerPropTable: (rows: Accessor<PropRow[]>) => () => void;
  registerCustomize: () => () => void;
  hasCustomize: Accessor<boolean>;
  reset: () => void;
  canReset: Accessor<boolean>;
  controls: Accessor<HTMLElement | null>;
  hasControls: Accessor<boolean>;
  demo: DemoControl;
  category: Accessor<string>;
  setPreviewPanel: (el: HTMLElement) => void;
};

export const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabs = () => useContext(TabsContext);

export const usePreviewStage = useTabs;
