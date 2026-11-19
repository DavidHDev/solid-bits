import { createSignal } from 'solid-js';

export function useForceRerender() {
  const [rerenderKey, setRerenderKey] = createSignal(0);
  const forceRerender = () => setRerenderKey(value => value + 1);
  return { rerenderKey, forceRerender };
}

export default useForceRerender;
