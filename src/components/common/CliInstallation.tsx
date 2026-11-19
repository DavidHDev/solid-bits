import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { CheckIcon, ChevronDownIcon } from '@/components/icons/Icons';
import { jsrepoAddSnippet, shadcnAddSnippet } from '@/constants/cli';
import { useInstallation, type CliTool, type PackageManager } from '@/hooks/useInstallation';
import { useDocsRoute } from '@/hooks/useDocsRoute';
import { generateDependencyCommands } from '@/utils/dependencies';
import CodeCopyButton from './CodeCopyButton';
import CodeSection from './CodeSection';
import DocsMenu from './DocsMenu';
import DocsMenuItem from './DocsMenuItem';
import DocsTooltip from './DocsTooltip';

const PKG_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];
const CLI_TOOLS: CliTool[] = ['shadcn', 'jsrepo'];

export default function CliInstallation(props: { deps?: string | string[]; slug?: string }) {
  const route = useDocsRoute();
  const slug = () => props.slug || route.subcategory() || '';
  const { installMode, cliTool, packageManager, setInstallMode, setCliTool, setPackageManager } = useInstallation();

  const manual = createMemo(() => generateDependencyCommands(props.deps ?? ''));
  const hasManual = () => Boolean(manual());
  const mode = () => (installMode() === 'manual' && hasManual() ? 'manual' : 'cli');

  const currentCommand = createMemo(() => {
    if (!slug()) return '';
    if (mode() === 'manual') return manual()?.[packageManager()] || '';
    return cliTool() === 'jsrepo'
      ? jsrepoAddSnippet(slug(), packageManager())
      : shadcnAddSnippet(slug(), packageManager());
  });

  let codeEl: HTMLElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  const [scrollMeta, setScrollMeta] = createSignal({ w: 0, l: 0, show: false });
  let dragging = false;
  let dragOffset = 0;
  let trackWidth = 0;
  let thumbWidth = 0;

  const updateScrollMeta = () => {
    const el = codeEl;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    if (scrollWidth <= clientWidth) {
      if (scrollMeta().show) setScrollMeta({ w: 0, l: 0, show: false });
      return;
    }
    const ratio = clientWidth / scrollWidth;
    const width = Math.max(24, clientWidth * ratio);
    const maxTrack = clientWidth - width;
    const left = (scrollLeft / (scrollWidth - clientWidth)) * maxTrack;
    setScrollMeta({ w: width, l: left, show: true });
    trackWidth = clientWidth;
    thumbWidth = width;
  };

  createEffect(currentCommand, () => {
    requestAnimationFrame(updateScrollMeta);
  });

  const onMove = (e: MouseEvent) => {
    const el = codeEl;
    const track = trackEl;
    if (!el || !track || !dragging) return;
    const rect = track.getBoundingClientRect();
    const maxThumbLeft = trackWidth - thumbWidth;
    const newLeft = Math.max(0, Math.min(maxThumbLeft, e.clientX - rect.left - dragOffset));
    el.scrollLeft = (newLeft / maxThumbLeft) * (el.scrollWidth - el.clientWidth);
    setScrollMeta(meta => ({ ...meta, l: newLeft }));
  };

  const onUp = () => {
    dragging = false;
    window.removeEventListener('mousemove', onMove);
  };

  const onScrollbarMouseDown = (e: MouseEvent) => {
    const el = codeEl;
    const track = trackEl;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const { l: left, w: width } = scrollMeta();
    if (clickX >= left && clickX <= left + width) {
      dragOffset = clickX - left;
    } else {
      const maxLeft = trackWidth - width;
      const newLeft = Math.max(0, Math.min(maxLeft, clickX - width / 2));
      el.scrollLeft = (newLeft / maxLeft) * (el.scrollWidth - el.clientWidth);
      dragOffset = clickX - newLeft;
      setScrollMeta(meta => ({ ...meta, l: newLeft }));
    }
    dragging = true;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  onSettled(() => {
    updateScrollMeta();
    window.addEventListener('resize', updateScrollMeta);
    return () => {
      window.removeEventListener('resize', updateScrollMeta);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  });

  return (
    <Show when={slug()}>
      <CodeSection
        title="Install"
        class="cli-install"
        actions={
          <div class="cli-install-actions">
            <div class="mode-switch" data-mode-switch style={{ display: 'flex', 'align-items': 'center' }}>
              <div style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
                <button
                  type="button"
                  data-active={String(mode() === 'cli')}
                  class="cli-toggle-button"
                  onClick={() => setInstallMode('cli')}
                >
                  CLI
                </button>
                <Show
                  when={hasManual()}
                  fallback={
                    <DocsTooltip label='No dependencies, head to the "Code" section' placement="right" openDelay={200}>
                      <span style={{ display: 'inline-block' }}>
                        <button
                          data-active="false"
                          class="cli-toggle-button disabled"
                          disabled
                          aria-disabled="true"
                          type="button"
                        >
                          Manual
                        </button>
                      </span>
                    </DocsTooltip>
                  }
                >
                  <button
                    type="button"
                    data-active={String(mode() === 'manual')}
                    class="cli-toggle-button"
                    onClick={() => setInstallMode('manual')}
                  >
                    Manual
                  </button>
                </Show>
              </div>
            </div>

            <DocsMenu
              placement="bottom-start"
              gutter={8}
              fluid={false}
              contentClass="install-options-menu"
              trigger={
                <button type="button" class="install-options-trigger" aria-label="Choose installation options">
                  <span>{packageManager()}</span>
                  <Show when={mode() === 'cli'}>
                    <span class="install-options-dot" aria-hidden="true">
                      ·
                    </span>
                    <span>{cliTool()}</span>
                  </Show>
                  <ChevronDownIcon size={16} />
                </button>
              }
            >
              <div class="install-options-label">Package manager</div>
              <For each={PKG_MANAGERS}>
                {manager => (
                  <DocsMenuItem itemClass="install-options-item" onSelect={() => setPackageManager(manager)}>
                    <span>{manager}</span>
                    <Show when={packageManager() === manager}>
                      <CheckIcon size={16} />
                    </Show>
                  </DocsMenuItem>
                )}
              </For>
              <Show when={mode() === 'cli'}>
                <div class="install-options-separator" role="separator" />
                <div class="install-options-label">Registry</div>
                <For each={CLI_TOOLS}>
                  {tool => (
                    <DocsMenuItem itemClass="install-options-item" onSelect={() => setCliTool(tool)}>
                      <span>{tool}</span>
                      <Show when={cliTool() === tool}>
                        <CheckIcon size={16} />
                      </Show>
                    </DocsMenuItem>
                  )}
                </For>
              </Show>
            </DocsMenu>

            <CodeCopyButton codeString={currentCommand()} />
          </div>
        }
      >
        <div class="code-wrapper" style={{ position: 'relative' }}>
          <code
            ref={el => (codeEl = el)}
            class="cli-code"
            style={{ 'white-space': 'pre', width: '100%' }}
            onScroll={updateScrollMeta}
          >
            {currentCommand()}
          </code>
          <Show when={scrollMeta().show}>
            <div
              ref={el => (trackEl = el)}
              class="cli-custom-scrollbar"
              aria-hidden="true"
              onMouseDown={onScrollbarMouseDown}
            >
              <div
                class="cli-custom-scrollbar-thumb"
                style={{ width: `${scrollMeta().w}px`, transform: `translateX(${scrollMeta().l}px)` }}
              />
            </div>
          </Show>
        </div>
      </CodeSection>
    </Show>
  );
}
