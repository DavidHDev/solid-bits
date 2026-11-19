import { For, Match, Switch, onSettled } from 'solid-js';
import {
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Image01Icon,
  Motion01Icon,
  MousePointerClickIcon,
  PuzzleIcon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { SearchIcon } from '@/components/icons/Icons';
import { GITHUB_URL, jsrepoAddSnippet } from '@/constants/cli';
import { CATEGORIES, TOTAL_COMPONENTS } from '@/constants/Categories';
import CommandList from './CommandList';
import CopyPageButton from './CopyPageButton';
import DocsButtonBar from './DocsButtonBar';

const SLIDERS = [
  { label: 'Delay', value: 0.32 },
  { label: 'Duration', value: 0.64 },
  { label: 'Threshold', value: 0.48 }
];

type Visual = 'search' | 'sliders' | 'cli';

const QUICK_START_STEPS: { title: string; description: string; visual: Visual }[] = [
  {
    title: 'Find a component',
    description: 'Browse five categories or search for the effect you have in mind.',
    visual: 'search'
  },
  {
    title: 'Make it yours',
    description: 'Tune props in the live preview or start from a preset. The code follows along.',
    visual: 'sliders'
  },
  {
    title: 'Add it to your project',
    description: 'Install it with one command, or copy the source straight in.',
    visual: 'cli'
  }
];

const CATEGORY_DETAILS: Record<string, { icon: IconSvgElement; description: string }> = {
  'Text Animations': {
    icon: TextFontIcon,
    description: 'Split, scramble, blur and morph text, from headlines to scroll-driven reveals.'
  },
  Animations: {
    icon: Motion01Icon,
    description: 'Cursor effects, hover interactions and reveals that wrap around any element.'
  },
  Components: {
    icon: PuzzleIcon,
    description: 'Carousels, galleries, cards, menus and docks with the motion built in.'
  },
  Micro: {
    icon: MousePointerClickIcon,
    description: 'Small interactive pieces like toggles, sliders, buttons and loaders.'
  },
  Backgrounds: {
    icon: Image01Icon,
    description: 'Shader and canvas backgrounds for heroes and full pages, most with presets.'
  }
};

const LIBRARY = CATEGORIES.filter(category => CATEGORY_DETAILS[category.name]).map(category => ({
  name: category.name,
  path: `/c/${category.name.replace(/\s+/g, '-').toLowerCase()}`,
  count: category.subcategories.length,
  ...CATEGORY_DETAILS[category.name]
}));

const PRINCIPLES = [
  {
    title: 'You own the code',
    text: 'Components land in your project as source files, not an import, so you can change anything.'
  },
  {
    title: 'Props first',
    text: 'The details you would want to adjust are exposed as props, so most tweaks need no code edits.'
  },
  {
    title: 'Nothing to depend on',
    text: 'Solid Bits is not an npm package. Install only what you use; each component lists its own dependencies.'
  },
  {
    title: 'One clean stack',
    text: 'SolidJS 2 components written in TypeScript, ready for any Solid or SolidStart app.'
  }
];

const jsrepoCommand = jsrepoAddSnippet('split-text', 'npm');

const CornerDownLeftIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    <path d="m9 10-5 5 5 5" />
  </svg>
);

const QuickStartVisual = (props: { visual: Visual }) => (
  <Switch>
    <Match when={props.visual === 'search'}>
      <span class="docs-qs-field">
        <SearchIcon size={12} />
        split te
        <span class="docs-qs-caret" />
      </span>
      <span class="docs-qs-result is-active">
        Split Text
        <CornerDownLeftIcon />
      </span>
      <span class="docs-qs-result">Split Flap Text</span>
    </Match>
    <Match when={props.visual === 'sliders'}>
      <For each={SLIDERS}>
        {slider => (
          <span class="docs-qs-slider">
            {slider.label}
            <span class="docs-qs-track">
              <span class="docs-qs-fill" style={{ width: `${slider.value * 100}%` }} />
            </span>
          </span>
        )}
      </For>
    </Match>
    <Match when={props.visual === 'cli'}>
      <span class="docs-qs-cli">
        <span class="docs-qs-prompt">$</span> npx jsrepo add
        <br />
        solid-bits.dev/r/SplitText
      </span>
    </Match>
  </Switch>
);

export default function Introduction() {
  onSettled(() => {
    window.scrollTo(0, 0);
  });

  return (
    <section class="docs-section docs-intro">
      <div class="docs-page-header">
        <h1 class="docs-title">Introduction</h1>
        <CopyPageButton />
      </div>

      <p class="docs-lead">
        Solid Bits is a free, open source library of animated SolidJS components and backgrounds that you copy into your
        project and make your own.
      </p>

      <p class="docs-paragraph docs-intro-sublead">
        There are {TOTAL_COMPONENTS} of them across five categories. Tune any of them in a live preview, then install it
        in your project with one command.
      </p>

      <div class="docs-quickstart">
        <div class="docs-quickstart-steps">
          <For each={QUICK_START_STEPS}>
            {(step, index) => (
              <div class="docs-quickstart-step">
                <div class="docs-quickstart-well" aria-hidden="true">
                  <QuickStartVisual visual={step.visual} />
                </div>
                <div class="docs-quickstart-text">
                  <span class="docs-quickstart-index">Step {index() + 1}</span>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </div>
            )}
          </For>
        </div>
        <div class="docs-quickstart-actions">
          <a href="/get-started/index" class="docs-quickstart-primary">
            Browse components
            <HugeiconsIcon icon={ArrowRight02Icon} size={15} strokeWidth={1.8} />
          </a>
          <a href="/get-started/installation" class="docs-quickstart-secondary">
            Installation guide
          </a>
        </div>
      </div>

      <h2 class="docs-section-title">What's inside</h2>

      <p class="docs-paragraph">Every component belongs to one of five categories. Open one to browse it.</p>

      <div class="docs-intro-cats">
        <For each={LIBRARY}>
          {category => (
            <a href={category.path} class="docs-intro-cat">
              <span class="docs-intro-cat-icon" aria-hidden="true">
                <HugeiconsIcon icon={category.icon} size={18} strokeWidth={1.6} />
              </span>
              <div class="docs-intro-cat-text">
                <h3>
                  {category.name}
                  <span class="docs-intro-count">{category.count}</span>
                </h3>
                <p>{category.description}</p>
              </div>
              <HugeiconsIcon class="docs-intro-arrow" icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} />
            </a>
          )}
        </For>
      </div>

      <h2 class="docs-section-title">One file per component</h2>

      <p class="docs-paragraph">
        Each component is a single SolidJS file written in TypeScript, with its styles alongside it. There is one
        version to reach for, and it drops straight into any SolidJS 2 or SolidStart project.
      </p>

      <p class="docs-paragraph">The install name is the component's name. With jsrepo it looks like this:</p>

      <CommandList items={[{ key: 'jsrepo', label: 'jsrepo', command: jsrepoCommand }]} />

      <p class="docs-paragraph docs-intro-after">
        The shadcn CLI works too, or you can copy the file from any component's Code tab. The{' '}
        <a class="docs-inline-link" href="/get-started/installation">
          Installation guide
        </a>{' '}
        walks through each option.
      </p>

      <h2 class="docs-section-title">Built for AI workflows</h2>

      <p class="docs-paragraph">
        Every component is plain, readable source, which makes it easy for coding agents to work with. A few extras
        help:
      </p>

      <ul class="docs-list docs-intro-list">
        <li class="docs-list-item">
          <strong>Copy for AI</strong> on every component copies a ready prompt, your configured code or the install
          command, or opens it in ChatGPT, Claude or v0.
        </li>
        <li class="docs-list-item">
          <strong>Copy as Markdown</strong> on every docs page, this one included, for pasting into a chat.
        </li>
        <li class="docs-list-item">
          <strong>MCP</strong> through the shadcn MCP server lets your agent find and install components for you.{' '}
          <a class="docs-inline-link" href="/get-started/mcp">
            Set it up
          </a>
        </li>
      </ul>

      <h2 class="docs-section-title">Principles</h2>

      <p class="docs-paragraph">
        Solid Bits exists to make expressive interfaces easy to build, and free. Four ideas shape every component:
      </p>

      <div class="docs-intro-principles">
        <For each={PRINCIPLES}>
          {principle => (
            <div class="docs-intro-principle">
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </div>
          )}
        </For>
      </div>

      <h2 class="docs-section-title">Use motion with care</h2>

      <ul class="docs-list docs-intro-list">
        <li class="docs-list-item">
          <strong>Two or three per page.</strong> Effects compete for attention and for the GPU, so save them for the
          moments that matter.
        </li>
        <li class="docs-list-item">
          <strong>Plan for mobile.</strong> Swap heavy effects for lighter versions or static images on small screens.
        </li>
        <li class="docs-list-item">
          <strong>Test on real devices.</strong> Your machine is likely faster than your users', so check low-end phones
          and laptops before you ship.
        </li>
      </ul>

      <h2 class="docs-section-title">License</h2>

      <p class="docs-paragraph">
        Solid Bits is free for personal and commercial work under the MIT + Commons Clause license. Use the components
        in any app, website or product, client work included. What you can't do is sell, sublicense or redistribute the
        components themselves, on their own, in a bundle or as a port.{' '}
        <a
          class="docs-inline-link"
          href={`${GITHUB_URL}/blob/main/LICENSE.md`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the license
        </a>
      </p>

      <h2 class="docs-section-title">Keep exploring</h2>

      <ul class="docs-list docs-intro-list">
        <li class="docs-list-item">
          <strong>What's new.</strong> The{' '}
          <a class="docs-inline-link" href="/get-started/changelog">
            changelog
          </a>{' '}
          lists every new component and update by month.
        </li>
        <li class="docs-list-item">
          <strong>React, Vue and Svelte.</strong> The original library lives at{' '}
          <a class="docs-inline-link" href="https://reactbits.dev/" target="_blank" rel="noopener noreferrer">
            React Bits
          </a>
          , with ports at{' '}
          <a class="docs-inline-link" href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
            Vue Bits
          </a>{' '}
          and{' '}
          <a class="docs-inline-link" href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
            Svelte Bits
          </a>
          .
        </li>
      </ul>

      <DocsButtonBar next={{ label: 'Installation', route: '/get-started/installation' }} />
    </section>
  );
}
