import { Show, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';

export default function Keyed(props: { token: unknown; children: () => JSX.Element }) {
  const token = createMemo(() => ({ value: props.token }), { equals: (a, b) => Object.is(a.value, b.value) });
  return (
    <Show when={token()} keyed>
      {_token => props.children()}
    </Show>
  );
}
