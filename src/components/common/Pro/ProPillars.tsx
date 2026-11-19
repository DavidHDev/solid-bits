import { For } from 'solid-js';
import { PRO_COUNTS, PRO_SECTIONS, PRO_SHOWCASE_ITEMS, type ProShowcaseItem } from '@/constants/Pro';
import { isLight } from '@/hooks/useTheme';
import { proLinkProps } from '@/utils/pro';

const PILLAR_PICKS: Record<string, string[]> = {
  components: ['radial-liquid', 'orbit-reel', 'astral-shell'],
  'app-ui': ['app-ui-12', 'app-ui-10', 'app-ui-07']
};

const SHOT_SLOTS = ['front', 'left', 'right'];

const pillarShots = (slug: string) => {
  const items = PRO_SHOWCASE_ITEMS[slug] ?? [];
  const picks = PILLAR_PICKS[slug];
  if (!picks) return items.slice(0, 3);
  return picks
    .map(pick => items.find(item => item.slug === pick))
    .filter((item): item is ProShowcaseItem => item !== undefined);
};

const ArrowUpRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

export default function ProPillars(props: { placement: string }) {
  const pillars = () =>
    PRO_SECTIONS.map(section => ({
      ...section,
      shots: pillarShots(section.slug),
      link: proLinkProps(section.proPath, `${props.placement}-${section.slug}`)
    }));

  return (
    <div class="prox-pillars">
      <For each={pillars()}>
        {pillar => (
          <a class="prox-pillar" {...pillar.link}>
            <span class="prox-pillar-media" aria-hidden="true">
              <For each={pillar.shots} keyed={false}>
                {(shot, index) => (
                  <img
                    class={['prox-pillar-shot', `is-${SHOT_SLOTS[index]}`]}
                    src={isLight() ? shot().imageLight || shot().image : shot().image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </For>
            </span>

            <span class="prox-pillar-body">
              <span class="prox-pillar-title">
                {PRO_COUNTS[pillar.countKey]} {pillar.countLabel}
                <ArrowUpRightIcon />
              </span>
              <span class="prox-pillar-desc">{pillar.tagline}</span>
            </span>
          </a>
        )}
      </For>
    </div>
  );
}
