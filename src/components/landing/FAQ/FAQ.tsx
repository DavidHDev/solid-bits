import { For, Show, createSignal } from 'solid-js';
import { CATEGORIES, TOTAL_COMPONENTS } from '@/constants/Categories';
import './FAQ.css';

type Part = { text: string; href?: string };

const NAMES = CATEGORIES.filter(category => category.name !== 'Get Started').map(category => category.name);
const CATEGORY_LIST = `${NAMES.slice(0, -1).join(', ')} and ${NAMES[NAMES.length - 1]}`;
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const CATEGORY_COUNT = COUNT_WORDS[NAMES.length] ?? String(NAMES.length);

const QUESTIONS: { q: string; a: Part[] }[] = [
  {
    q: 'What is included in the free library?',
    a: [
      {
        text: `All ${TOTAL_COMPONENTS} components and backgrounds on this site, across ${CATEGORY_COUNT} categories: ${CATEGORY_LIST}. You can use all of it in personal and commercial projects, and it stays free.`
      }
    ]
  },
  {
    q: 'Is Solid Bits only for Solid?',
    a: [
      {
        text: 'The components on this site are built for SolidJS 2.0, so they work in Vite, SolidStart or Astro. Working in another framework? Solid Bits is a port of '
      },
      { text: 'React Bits', href: 'https://reactbits.dev/' },
      { text: ', and there are official ports for Vue and Svelte too: ' },
      { text: 'Vue Bits', href: 'https://vue-bits.dev/' },
      { text: ' and ' },
      { text: 'Svelte Bits', href: 'https://sveltebits.xyz/' },
      { text: '.' }
    ]
  },
  {
    q: 'Can I use Solid Bits in commercial projects?',
    a: [
      {
        text: "Yes. The library is licensed MIT + Commons Clause: use the components in any app, website or product, client work included, but don't sell, sublicense or redistribute the components themselves."
      }
    ]
  },
  {
    q: 'Do I need to install a package?',
    a: [
      {
        text: 'No. The jsrepo or shadcn CLI copies the source into your project, or you can paste it in by hand. There is no solid-bits dependency to keep updated, and it works in any Solid 2.0 setup, including Vite, SolidStart and Astro.'
      }
    ]
  },
  {
    q: 'Does it work with AI coding tools?',
    a: [
      {
        text: 'Yes. Every component has a Copy for AI menu, and the shadcn MCP server lets your agent browse, search and install components for you.'
      }
    ]
  }
];

const PlusIcon = () => (
  <svg
    class="prox-faq-icon"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default function FAQ() {
  const [open, setOpen] = createSignal<number | null>(null);

  return (
    <section class="ln-faq-section">
      <div class="ln-faq-inner prox-faq-layout">
        <div class="prox-faq-aside">
          <h2 class="ln-faq-title">Questions, answered</h2>
          <p class="ln-faq-sub">What's included and how the pieces fit together.</p>
        </div>

        <div class="prox-faq">
          <For each={QUESTIONS} keyed={false}>
            {(item, index) => (
              <div class={['prox-faq-item', { open: open() === index }]}>
                <button
                  id={`ln-faq-q-${index}`}
                  type="button"
                  class="prox-faq-q"
                  aria-expanded={open() === index ? 'true' : 'false'}
                  aria-controls={`ln-faq-panel-${index}`}
                  onClick={() => setOpen(open() === index ? null : index)}
                >
                  <span>{item().q}</span>
                  <PlusIcon />
                </button>

                <div
                  id={`ln-faq-panel-${index}`}
                  class="prox-faq-panel"
                  role="region"
                  aria-labelledby={`ln-faq-q-${index}`}
                  aria-hidden={open() !== index ? 'true' : 'false'}
                  inert={open() !== index}
                >
                  <div class="prox-faq-panel-inner">
                    <p class="prox-faq-a">
                      <For each={item().a}>
                        {part => (
                          <Show when={part.href} fallback={part.text}>
                            {href => (
                              <a class="ln-faq-link" href={href()} target="_blank" rel="noopener noreferrer">
                                {part.text}
                              </a>
                            )}
                          </Show>
                        )}
                      </For>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
