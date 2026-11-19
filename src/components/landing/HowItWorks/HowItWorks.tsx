import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { For, Show } from 'solid-js';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { SITE_ORIGIN } from '@/constants/cli';
import HeroCopyCommand from '../Hero/HeroCopyCommand';
import { createReveal } from '../reveal';
import './HowItWorks.css';

type Kind = 'str' | 'punc' | 'kw' | 'ink' | 'attr';

const COMMAND = `npx jsrepo add ${SITE_ORIGIN}/r/Aurora`;

const OUTPUT = ['✔ Checking registry.', '✔ Created 1 file:', '  - src/components/Aurora.tsx'];

const CODE: [string, Kind][][] = [
  [
    ['import', 'kw'],
    [' { createMemo, onSettled } ', 'ink'],
    ['from', 'kw'],
    [" 'solid-js'", 'str'],
    [';', 'punc']
  ],
  [],
  [
    ['export default function', 'kw'],
    [' Aurora', 'ink'],
    ['(', 'punc'],
    ['props', 'ink'],
    [': ', 'punc'],
    ['AuroraProps', 'ink'],
    [') {', 'punc']
  ],
  [
    ['  const', 'kw'],
    [' settings ', 'ink'],
    ['= ', 'punc'],
    ['createMemo', 'ink'],
    ['(() => ({', 'punc']
  ],
  [
    ['    colorStops', 'attr'],
    [': ', 'punc'],
    ['props.colorStops ', 'ink'],
    ['?? [', 'punc'],
    ["'#0aa0ef'", 'str'],
    [', ', 'punc'],
    ["'#7cff67'", 'str'],
    [', ', 'punc'],
    ["'#0aa0ef'", 'str'],
    ['],', 'punc']
  ],
  [
    ['    amplitude', 'attr'],
    [': ', 'punc'],
    ['props.amplitude ', 'ink'],
    ['?? ', 'punc'],
    ['1', 'ink'],
    [',', 'punc']
  ],
  [
    ['    blend', 'attr'],
    [': ', 'punc'],
    ['props.blend ', 'ink'],
    ['?? ', 'punc'],
    ['0.5', 'ink'],
    [',', 'punc']
  ],
  [
    ['    speed', 'attr'],
    [': ', 'punc'],
    ['props.speed ', 'ink'],
    ['?? ', 'punc'],
    ['0.6', 'ink'],
    [',', 'punc']
  ],
  [['  }));', 'punc']],
  [],
  [
    ['  let', 'kw'],
    [' containerEl', 'ink'],
    [': ', 'punc'],
    ['HTMLDivElement | ', 'ink'],
    ['undefined', 'kw'],
    [';', 'punc']
  ]
];

const EDITED_LINE = 7;

export default function HowItWorks() {
  const reveal = createReveal();

  return (
    <section class="ln-how-section">
      <div class="ln-how-inner">
        <div ref={reveal(0)} class="ln-how-copy-block">
          <h2 class="ln-how-title">One command, and the code is yours.</h2>
          <p class="ln-how-sub">
            The CLI copies the component's source into your Vite, SolidStart or Astro project. No wrapper library, no
            runtime dependency, nothing to lock you in.
          </p>
          <a href="/get-started/installation" class="ln-how-btn">
            Installation guide
            <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
          </a>
        </div>

        <div ref={reveal(0.07)} class="ln-how-visual">
          <div class="ln-how-window ln-how-terminal">
            <div class="ln-how-bar">
              Terminal
              <HeroCopyCommand command={COMMAND} buttonClass="ln-how-copy" />
            </div>
            <div class="ln-how-well ln-how-term">
              <div class="ln-how-term-line">
                <span class="ln-how-t-punc">$</span> {COMMAND}
              </div>
              <For each={OUTPUT}>{line => <div class="ln-how-term-line ln-how-t-muted">{line}</div>}</For>
            </div>
          </div>

          <div
            class="ln-how-window ln-how-editor"
            role="img"
            aria-label="Aurora.tsx open in your editor as plain source"
          >
            <div class="ln-how-bar">Aurora.tsx</div>
            <pre class="ln-how-well ln-how-code">
              <code>
                <For each={CODE} keyed={false}>
                  {(line, index) => (
                    <span class={['ln-how-line', { 'is-edited': index === EDITED_LINE }]}>
                      <Show when={line().length} fallback={' '}>
                        <For each={line()}>{([text, kind]) => <span class={`ln-how-t-${kind}`}>{text}</span>}</For>
                      </Show>
                    </span>
                  )}
                </For>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
