import { For, Show, createMemo, createSignal, onSettled } from 'solid-js';
import { CHANGELOG_DESCRIPTION, getChangelogEntries, type ChangelogEntry, type ChangelogType } from '@/utils/changelog';
import CopyPageButton from './CopyPageButton';

type Day = { date: string; entries: ChangelogEntry[] };
type Month = { month: string; label: string; days: Day[] };

const INITIAL_MONTHS = 6;
const KIND_LABELS: Record<ChangelogType, string> = { launch: 'New category', added: 'New', updated: 'Update' };

const toDate = (date: string) => new Date(`${date}T00:00:00Z`);
const monthLabel = (date: string) =>
  toDate(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayLabel = (date: string) =>
  toDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const groupByMonth = (entries: ChangelogEntry[]) => {
  const months: Month[] = [];
  entries.forEach(entry => {
    const month = entry.date.slice(0, 7);
    let group = months[months.length - 1];
    if (!group || group.month !== month) {
      group = { month, label: monthLabel(entry.date), days: [] };
      months.push(group);
    }
    let day = group.days[group.days.length - 1];
    if (!day || day.date !== entry.date) {
      day = { date: entry.date, entries: [] };
      group.days.push(day);
    }
    day.entries.push(entry);
  });
  return months;
};

export default function Changelog() {
  const [showAll, setShowAll] = createSignal(false);
  const months = groupByMonth(getChangelogEntries());
  const visibleMonths = createMemo(() => (showAll() ? months : months.slice(0, INITIAL_MONTHS)));

  onSettled(() => {
    window.scrollTo(0, 0);
  });

  return (
    <section class="docs-section changelog">
      <div class="docs-page-header">
        <h1 class="docs-title">Changelog</h1>
        <CopyPageButton />
      </div>

      <p class="docs-lead">{CHANGELOG_DESCRIPTION}</p>

      <Show when={months.length === 0}>
        <p class="docs-paragraph">Nothing new yet. Check back soon.</p>
      </Show>

      <For each={visibleMonths()}>
        {month => (
          <section class="changelog-month" aria-label={month.label}>
            <h2 class="changelog-month-title">{month.label}</h2>
            <ol class="changelog-days">
              <For each={month.days}>
                {day => (
                  <li class="changelog-day">
                    <time class="changelog-date" datetime={day.date}>
                      {dayLabel(day.date)}
                    </time>
                    <ul class="changelog-entries">
                      <For each={day.entries}>
                        {entry => (
                          <li class="changelog-entry">
                            <div class="changelog-entry-head">
                              <a class="changelog-name" href={entry.path}>
                                {entry.name}
                              </a>
                              <span class="changelog-meta">
                                <span class={['changelog-kind', `is-${entry.type}`]}>{KIND_LABELS[entry.type]}</span>
                                <span aria-hidden="true">{' · '}</span>
                                {entry.type === 'launch'
                                  ? `${entry.components?.length ?? 0} components`
                                  : entry.category}
                              </span>
                            </div>
                            <p class="changelog-note">{entry.note}</p>
                            <Show when={entry.type === 'launch'}>
                              <p class="changelog-includes">
                                <For each={entry.components ?? []}>
                                  {(component, index) => (
                                    <>
                                      {index() > 0 ? ', ' : ''}
                                      <a href={component.path}>{component.name}</a>
                                    </>
                                  )}
                                </For>
                              </p>
                            </Show>
                          </li>
                        )}
                      </For>
                    </ul>
                  </li>
                )}
              </For>
            </ol>
          </section>
        )}
      </For>

      <Show when={!showAll() && months.length > INITIAL_MONTHS}>
        <button type="button" class="changelog-older" onClick={() => setShowAll(true)}>
          Show earlier months
        </button>
      </Show>
    </section>
  );
}
