import { For, Show } from 'solid-js';
import CategoryProFooter from './Pro/CategoryProFooter';
import { useTabsRegistration } from './TabsLayout';

export type PropRow = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

export default function PropTable(props: { data: PropRow[] }) {
  const { tabs, register } = useTabsRegistration();
  register(t => t.registerPropTable(() => props.data));
  const shownDefault = (row: PropRow) => (row.default?.length ? row.default : '—');

  return (
    <>
      <Show when={tabs && !tabs.hasCustomize()}>
        <CategoryProFooter category={tabs!.category()} />
      </Show>
      <div class="prop-table-section">
        <div class="prop-table-frame">
          <div class="prop-table-heading">
            <h2>Props</h2>
            <span>
              {props.data.length} {props.data.length === 1 ? 'property' : 'properties'}
            </span>
          </div>

          <div class="prop-table-wrap">
            <div class="prop-table-surface">
              <table class="prop-table">
                <caption>Component properties</caption>
                <colgroup>
                  <col class="prop-column-name" />
                  <col class="prop-column-type" />
                  <col class="prop-column-default" />
                  <col class="prop-column-description" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Property</th>
                    <th scope="col">Type</th>
                    <th scope="col">Default</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={props.data}>
                    {row => (
                      <tr>
                        <td>
                          <code class="prop-name">{row.name}</code>
                        </td>
                        <td class="prop-type">{row.type}</td>
                        <td>
                          <code class="prop-default">{shownDefault(row)}</code>
                        </td>
                        <td class="prop-desc">{row.description}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          <div class="prop-cards">
            <div class="prop-cards-surface">
              <For each={props.data}>
                {row => (
                  <div class="prop-card">
                    <div class="prop-card-header">
                      <code class="prop-name">{row.name}</code>
                      <span class="prop-card-type">{row.type}</span>
                    </div>
                    <p class="prop-card-desc">{row.description}</p>
                    <div class="prop-card-default">
                      <span class="prop-card-label">Default</span>
                      <code class="prop-default">{shownDefault(row)}</code>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
