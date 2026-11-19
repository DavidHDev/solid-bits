import { For, Show, createSignal, onSettled } from 'solid-js';

export default function HeroTerminal(props: { command: string; output: string[] }) {
  const [typed, setTyped] = createSignal(0);
  const [shown, setShown] = createSignal(0);

  onSettled(() => {
    const command = props.command;
    const output = props.output;
    let timer = 0;
    const later = (fn: () => void, ms: number) => {
      timer = window.setTimeout(fn, ms);
    };
    const reveal = (count: number) => {
      setShown(count);
      if (count < output.length) later(() => reveal(count + 1), 560);
    };
    const type = (count: number) => {
      setTyped(count);
      if (count < command.length) later(() => type(count + 1), 18 + ((count * 37) % 29));
      else later(() => reveal(1), 480);
    };
    const begin = () => {
      if (document.querySelector('.landing-wrapper.ln-loading')) later(begin, 200);
      else later(() => type(1), 1500);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(command.length);
      setShown(output.length);
      return;
    }
    begin();
    return () => window.clearTimeout(timer);
  });

  const typing = () => typed() < props.command.length;
  const done = () => shown() >= props.output.length;

  return (
    <div class="lh-term">
      <div class="lh-term-line">
        <span class="lh-term-prompt">$</span> {props.command.slice(0, typed())}
        <Show when={typing() && typed() > 0}>
          <span class="lh-caret" />
        </Show>
        <span class="lh-term-rest">{props.command.slice(typed())}</span>
      </div>
      <For each={props.output}>
        {(line, index) => (
          <div class="lh-term-line lh-term-out" data-shown={index() < shown() ? '' : undefined}>
            <span class="lh-term-ok">{line.slice(0, 1)}</span>
            {line.slice(1)}
            <Show when={done() && index() === props.output.length - 1}>
              <span class="lh-caret lh-caret--idle" />
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
