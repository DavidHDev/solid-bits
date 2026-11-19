import { Errored, Show, createSignal, onSettled } from 'solid-js';
import type { Component } from 'solid-js';
import type { JSX } from '@solidjs/web';

export type ContentLoader = () => Promise<{ default: Component<any> }>;

export const contentLoader = (modules: Record<string, () => Promise<unknown>>, path: string) =>
  modules[path] as ContentLoader | undefined;

export default function Deferred(props: {
  load?: ContentLoader;
  fallback?: JSX.Element;
  children: (component: Component<any>) => JSX.Element;
}) {
  const [loaded, setLoaded] = createSignal<Component<any> | null>(null);

  onSettled(() => {
    const load = props.load;
    if (!load) return;
    let active = true;
    load()
      .then(module => {
        if (active && typeof module.default === 'function') setLoaded(() => module.default);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  });

  return (
    <Errored fallback={props.fallback}>
      <Show when={loaded()} keyed fallback={props.fallback}>
        {component => props.children(component)}
      </Show>
    </Errored>
  );
}
