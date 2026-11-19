import { createSignal, onSettled } from 'solid-js';

const DESKTOP_POINTER_QUERY = '(min-width: 968px) and (hover: hover) and (pointer: fine)';

type NetworkInformation = EventTarget & { saveData?: boolean; effectiveType?: string };

const getConnection = () =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection as NetworkInformation | undefined;

const getPreference = () => {
  if (typeof window === 'undefined') return false;
  const precisePointer = window.matchMedia(DESKTOP_POINTER_QUERY).matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = getConnection();
  const constrained = Boolean(connection?.saveData) || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
  return precisePointer && !reducedMotion && !constrained;
};

export function usePreviewMediaAllowed() {
  const [allowed, setAllowed] = createSignal(getPreference());
  onSettled(() => {
    const pointerQuery = window.matchMedia(DESKTOP_POINTER_QUERY);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAllowed(getPreference());
    pointerQuery.addEventListener('change', update);
    motionQuery.addEventListener('change', update);
    getConnection()?.addEventListener?.('change', update);
    update();
    return () => {
      pointerQuery.removeEventListener('change', update);
      motionQuery.removeEventListener('change', update);
      getConnection()?.removeEventListener?.('change', update);
    };
  });
  return allowed;
}
