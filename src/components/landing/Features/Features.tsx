import { For } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import type { Component } from 'solid-js';
import { COMPONENT_COUNT } from '@/constants/Categories';
import { createReveal } from '../reveal';
import AITerminal from './AITerminal';
import CategorySelector from './CategorySelector';
import ComponentMarquee from './ComponentMarquee';
import StarCard from './StarCard';
import VariantTabs from './VariantTabs';
import './Features.css';

const CARDS: { key: string; title: string; desc: string; span: number; visual: Component }[] = [
  {
    key: 'marquee',
    title: `${COMPONENT_COUNT}+ Components`,
    desc: "Backgrounds, text effects, animations, creative UI components. The stuff you'd build from scratch, already done and battle-tested.",
    span: 5,
    visual: ComponentMarquee
  },
  {
    key: 'orbit',
    title: 'Well Organized',
    desc: "Five clear categories so you're not scrolling through a wall of unrelated stuff.",
    span: 4,
    visual: CategorySelector
  },
  {
    key: 'stars',
    title: 'Growing Fast',
    desc: "Solid's creative component library, growing every release. Star it on GitHub to follow along.",
    span: 3,
    visual: StarCard
  },
  {
    key: 'variants',
    title: 'Solid 2.0 + TypeScript',
    desc: 'Every component is a typed Solid 2.0 component built on signals. Copy it in and make it yours.',
    span: 5,
    visual: VariantTabs
  },
  {
    key: 'ai',
    title: 'AI-Ready',
    desc: 'The docs give you ready-to-use prompts. Works great with Cursor, Copilot, and v0. Describe what you need, drop it in, ship.',
    span: 7,
    visual: AITerminal
  }
];

export default function Features() {
  const reveal = createReveal();

  return (
    <section class="ln-features-section">
      <div class="ln-features-inner">
        <h2 class="ln-features-title">What's inside</h2>

        <div class="ln-features-grid">
          <For each={CARDS} keyed={false}>
            {(card, i) => (
              <div ref={reveal(i * 0.07)} class={['ln-features-card', `ln-features-card--span-${card().span}`]}>
                <div class="ln-features-card-visual">
                  <Dynamic component={card().visual} />
                </div>
                <div class="ln-features-card-body">
                  <h3>{card().title}</h3>
                  <p>{card().desc}</p>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
