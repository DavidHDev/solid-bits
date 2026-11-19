import { createContext, useContext } from 'solid-js';

export type DocsMenuContextValue = {
  close: (focusTrigger?: boolean) => void;
};

export const DocsMenuContext = createContext<DocsMenuContextValue | null>(null);

export const useDocsMenu = () => useContext(DocsMenuContext);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
