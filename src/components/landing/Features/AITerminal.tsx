import { For, Show, createEffect, createSignal } from 'solid-js';
import { useInView } from '../hooks/useInView';

type Token = { cls: 'kw' | 'comp' | 'tag' | 'attr' | 'punc' | 'num' | 'str'; text: string };
type Convo = { q: string; lines: Token[]; jsx: Token[] };

const AI_CONVOS: Convo[] = [
  {
    q: 'add a glowing card',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'BorderGlow' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./BorderGlow"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'BorderGlow' },
      { cls: 'attr', text: ' glowIntensity' },
      { cls: 'punc', text: '=' },
      { cls: 'num', text: '{0.8}' },
      { cls: 'tag', text: ' />' }
    ]
  },
  {
    q: 'animate hero text',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'SplitText' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./SplitText"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'SplitText' },
      { cls: 'attr', text: ' animation' },
      { cls: 'punc', text: '=' },
      { cls: 'str', text: '"fadeUp"' },
      { cls: 'tag', text: ' />' }
    ]
  },
  {
    q: 'particle background',
    lines: [
      { cls: 'kw', text: 'import ' },
      { cls: 'comp', text: 'Ballpit' },
      { cls: 'kw', text: ' from ' },
      { cls: 'str', text: '"./Ballpit"' }
    ],
    jsx: [
      { cls: 'tag', text: '<' },
      { cls: 'comp', text: 'Ballpit' },
      { cls: 'attr', text: ' count' },
      { cls: 'punc', text: '=' },
      { cls: 'num', text: '{200}' },
      { cls: 'tag', text: ' />' }
    ]
  }
];

const SWAP_MS = 300;

export default function AITerminal() {
  const [ref, visible] = useInView();
  const [idx, setIdx] = createSignal(0);
  const [leaving, setLeaving] = createSignal(false);
  const [typed, setTyped] = createSignal('');
  const [phase, setPhase] = createSignal<'prompt' | 'thinking' | 'code'>('prompt');
  const [codeLines, setCodeLines] = createSignal(0);

  const conv = () => AI_CONVOS[idx()];

  createEffect(
    () => ({ index: idx(), visible: visible() }),
    ({ index, visible: isVisible }) => {
      if (!isVisible) return;
      const timers: number[] = [];
      const schedule = (fn: () => void, ms: number) => {
        timers.push(window.setTimeout(fn, ms));
      };
      const current = AI_CONVOS[index];
      setTyped('');
      setPhase('prompt');
      setCodeLines(0);

      let delay = 300;
      for (let c = 0; c <= current.q.length; c++) {
        const slice = current.q.slice(0, c);
        schedule(() => setTyped(slice), delay);
        delay += 50;
      }

      schedule(() => setPhase('thinking'), delay);
      delay += 900;

      schedule(() => {
        setPhase('code');
        setCodeLines(1);
      }, delay);
      delay += 280;
      schedule(() => setCodeLines(2), delay);
      delay += 280;
      schedule(() => setCodeLines(3), delay);
      delay += 2400;

      schedule(() => setLeaving(true), delay);
      schedule(() => {
        setIdx((index + 1) % AI_CONVOS.length);
        setLeaving(false);
      }, delay + SWAP_MS);

      return () => timers.forEach(id => window.clearTimeout(id));
    }
  );

  return (
    <div ref={ref} class="ln-feat-aichat">
      <div class={['ln-feat-aichat-inner', { 'is-leaving': leaving() }]}>
        <div class="ln-feat-aichat-head">
          <div class="ln-feat-aichat-dots">
            <span />
            <span />
            <span />
          </div>
          <span class="ln-feat-aichat-title">Editor</span>
        </div>

        <div class="ln-feat-aichat-prompt-row">
          <span class="ln-feat-aichat-chevron">$</span>
          <span class="ln-feat-aichat-prompt">{typed()}</span>
          <Show when={phase() === 'prompt'}>
            <span class="ln-feat-aichat-cursor" />
          </Show>
        </div>

        <Show when={phase() === 'thinking'}>
          <div class="ln-feat-aichat-thinking">
            <span />
            <span />
            <span />
          </div>
        </Show>

        <Show when={phase() === 'code'}>
          <div class="ln-feat-aichat-code-block">
            <Show when={codeLines() >= 1}>
              <div class="ln-feat-aichat-code-line">
                <span class="ln-feat-aichat-ln">1</span>
                <For each={conv().lines}>{t => <span class={`ac-${t.cls}`}>{t.text}</span>}</For>
              </div>
            </Show>
            <Show when={codeLines() >= 2}>
              <div class="ln-feat-aichat-code-line">
                <span class="ln-feat-aichat-ln">2</span>
              </div>
            </Show>
            <Show when={codeLines() >= 3}>
              <div class="ln-feat-aichat-code-line">
                <span class="ln-feat-aichat-ln">3</span>
                <For each={conv().jsx}>{t => <span class={`ac-${t.cls}`}>{t.text}</span>}</For>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
