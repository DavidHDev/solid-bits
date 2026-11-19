import { ariaBool } from '@/utils/aria';
import {
  For,
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onSettled,
  useContext,
  type Accessor
} from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  ComputerIcon,
  FavouriteIcon,
  FullScreenIcon,
  MoreHorizontalIcon,
  Share08Icon,
  SmartPhone01Icon,
  SourceCodeIcon,
  Tablet01Icon,
  ViewIcon
} from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { hasComponentPropsContext, useComponentPropsContext } from '@/components/context/ComponentPropsContext';
import { useAIExportActions } from '@/hooks/useAIExportActions';
import { useDocsRoute } from '@/hooks/useDocsRoute';
import { usePreviewFrame } from '@/hooks/usePreviewFrame';
import { addToast } from '@/hooks/useToast';
import type { CodeObject } from '@/types/code';
import { buildPrompt, stripSourceHeader } from '@/utils/aiPrompt';
import { copyText } from '@/utils/aiExport';
import { getComponentOverviewByPath } from '@/utils/catalog';
import { injectPropsIntoUsage } from '@/utils/codeGeneration';
import { isComponentSaved, toggleSavedComponent } from '@/utils/favorites';
import { toPascal } from '@/utils/utils';
import AIMenuSections from './AIMenuSections';
import ComponentPager from './ComponentPager';
import CopyForAIMenu from './CopyForAIMenu';
import DocsMenu from './DocsMenu';
import DocsMenuGroup from './DocsMenuGroup';
import DocsMenuItem from './DocsMenuItem';
import DocsTooltip from './DocsTooltip';
import PreviewResizer from './PreviewResizer';
import RelatedComponents from './RelatedComponents';
import TabsFooter from './TabsFooter';
import { demoModesFor, demoView } from './demoModes';
import { TabsContext, useTabs, type DemoMode, type TabsContextValue } from './previewStage';
import type { PropRow } from './PropTable';

const TABLET_WIDTH = 768;
const MOBILE_WIDTH = 375;

const WIDTH_PRESETS: { label: string; icon: IconSvgElement; width: number | null }[] = [
  { label: 'Desktop', icon: ComputerIcon, width: null },
  { label: `Tablet · ${TABLET_WIDTH}px`, icon: Tablet01Icon, width: TABLET_WIDTH },
  { label: `Mobile · ${MOBILE_WIDTH}px`, icon: SmartPhone01Icon, width: MOBILE_WIDTH }
];

let rememberedDemoMode: DemoMode = 'none';

type Pill = { x: number; width: number; hidden: boolean; ready: boolean } | null;

const pillStyle = (pill: Pill): JSX.CSSProperties =>
  pill
    ? { width: `${pill.width}px`, transform: `translateX(${pill.x}px)`, opacity: pill.hidden ? 0 : 1 }
    : { opacity: 0 };

const usePill = (track: Accessor<HTMLElement | null>, deps: Accessor<unknown>) => {
  const [pill, setPill] = createSignal<Pill>(null);
  let current: Pill = null;
  const measure = (el: HTMLElement) => {
    const active = el.querySelector<HTMLElement>('[aria-selected="true"], [aria-pressed="true"]');
    if (!active) {
      current = current ? { ...current, hidden: true } : null;
      setPill(current);
      return;
    }
    const next = { x: active.offsetLeft, width: active.offsetWidth, hidden: false, ready: Boolean(current) };
    if (current && current.x === next.x && current.width === next.width && !current.hidden) return;
    current = next;
    setPill(next);
  };
  createEffect(
    () => [track(), deps()] as const,
    ([el]) => {
      if (!el) {
        current = null;
        setPill(null);
        return;
      }
      const observer = new ResizeObserver(() => measure(el));
      observer.observe(el);
      const frame = requestAnimationFrame(() => measure(el));
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    }
  );
  return pill;
};

export function TabsLayout(props: { className?: string; children: JSX.Element }) {
  const route = useDocsRoute();
  const usesContext = hasComponentPropsContext();
  const context = useComponentPropsContext();

  const category = route.category;
  const subcategory = route.subcategory;
  const overview = createMemo(() => getComponentOverviewByPath(`/${category()}/${subcategory()}`));

  const [activeTab, setActiveTab] = createSignal<'preview' | 'code'>('preview');
  const [codeMounted, setCodeMounted] = createSignal(false);
  const [codeEntry, setCodeEntry] = createSignal<{ codeObject: CodeObject; componentName: string } | null>(null);
  const [propRows, setPropRows] = createSignal<Accessor<PropRow[]> | null>(null);
  const [customizeCount, setCustomizeCount] = createSignal(0);
  const [previewPanel, setPreviewPanel] = createSignal<HTMLElement | null>(null);
  const [controlsSlot, setControlsSlot] = createSignal<HTMLElement | null>(null);
  const [previewWidth, setPreviewWidth] = createSignal<number | null>(null);
  const [resizing, setResizing] = createSignal(false);
  const [demoMode, setDemoModeSignal] = createSignal<DemoMode>(rememberedDemoMode);
  const [demoNarrow, setDemoNarrow] = createSignal(false);
  const [demoPresent, setDemoPresent] = createSignal(false);
  const [isSaved, setIsSaved] = createSignal(false);

  const isPreview = () => activeTab() === 'preview';
  const canResize = () => category() !== 'get-started' && isPreview();
  const isBackgrounds = () => category() === 'backgrounds';
  const hasStageControls = () => isBackgrounds() && canResize();
  const frame = usePreviewFrame(previewPanel, canResize);

  const setDemoMode = (value: DemoMode) => {
    rememberedDemoMode = value;
    setDemoModeSignal(value);
  };

  const selectTab = (tab: 'preview' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code') setCodeMounted(true);
  };

  const resetProps = () => {
    if (usesContext) context.resetProps();
  };

  const value: TabsContextValue = {
    activeTab,
    codeMounted,
    registerCode: entry => {
      setCodeEntry(entry);
      return () => setCodeEntry(current => (current === entry ? null : current));
    },
    registerPropTable: rows => {
      setPropRows(() => rows);
      return () => setPropRows(current => (current === rows ? null : current));
    },
    registerCustomize: () => {
      setCustomizeCount(count => count + 1);
      return () => setCustomizeCount(count => count - 1);
    },
    hasCustomize: () => customizeCount() > 0,
    reset: resetProps,
    canReset: () => usesContext && context.hasChanges(),
    controls: () => (hasStageControls() ? controlsSlot() : null),
    hasControls: hasStageControls,
    demo: {
      mode: demoMode,
      setMode: setDemoMode,
      setNarrow: setDemoNarrow,
      setPresent: setDemoPresent
    },
    category,
    setPreviewPanel: el => setPreviewPanel(el)
  };

  createEffect(
    () => [frame(), previewWidth()] as const,
    ([current, width]) => {
      if (current && width !== null && width >= current.fullWidth) setPreviewWidth(null);
    }
  );

  const propData = createMemo<PropRow[]>(() => propRows()?.() ?? []);

  const promptComponentName = createMemo(() => codeEntry()?.componentName || toPascal(subcategory()));

  const aiExport = createMemo(() => {
    const entry = codeEntry();
    const name = promptComponentName();
    if (!entry || !name) return null;
    const codeObject = entry.codeObject;
    const mergedProps = { ...context.props(), ...context.computedProps() };
    const configuredUsage =
      codeObject.usage && usesContext
        ? injectPropsIntoUsage(codeObject.usage, mergedProps, context.defaultProps(), name, context.demoOnlyProps())
        : codeObject.usage || '';
    return {
      componentName: name,
      category: category(),
      subcategory: subcategory(),
      fullPrompt: buildPrompt(name, { ...codeObject, usage: configuredUsage }, propData()),
      configuredUsage,
      componentSource: stripSourceHeader(codeObject.code || '')
    };
  });

  const aiActions = useAIExportActions(aiExport);

  const favoriteKey = createMemo(() =>
    category() && subcategory() ? `${toPascal(category())}/${toPascal(subcategory())}` : null
  );

  createEffect(favoriteKey, key => {
    setIsSaved(key ? isComponentSaved(key) : false);
  });

  const toggleFavorite = () => {
    const key = favoriteKey();
    if (!key) return;
    const { saved } = toggleSavedComponent(key);
    setIsSaved(saved);
    const name = promptComponentName();
    addToast({
      severity: saved ? 'success' : 'error',
      summary: saved ? `Added <${name} /> to favorites` : `Removed <${name} /> from favorites`,
      life: 3000
    });
  };

  const copyShareLink = async () => {
    if (await copyText(window.location.href))
      addToast({ severity: 'success', summary: 'Share link copied', life: 2500 });
    else addToast({ severity: 'error', summary: 'Could not copy the link', life: 2500 });
  };

  const canFullscreen = () =>
    typeof document !== 'undefined' &&
    Boolean(
      document.fullscreenEnabled ||
      (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
    );

  const openFullscreen = () => {
    const demo = previewPanel()?.querySelector('.demo-container') as
      (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }) | null;
    const request = demo?.requestFullscreen || demo?.webkitRequestFullscreen;
    if (!demo || !request) return;
    Promise.resolve(request.call(demo)).catch(() =>
      addToast({ severity: 'error', summary: 'Fullscreen is not available here', life: 2500 })
    );
  };

  const showFavorite = () => Boolean(favoriteKey()) && category() !== 'get-started';
  const showFullscreen = () => isBackgrounds() && isPreview() && canFullscreen();
  const hasOverflowActions = () => showFavorite() || Boolean(aiExport()) || showFullscreen();
  const widthPresets = createMemo(() => {
    const current = frame();
    return canResize() && current
      ? WIDTH_PRESETS.filter(preset => preset.width === null || preset.width < current.fullWidth)
      : [];
  });
  const showDemoModes = () => isBackgrounds() && isPreview() && demoPresent();
  const demoOptions = createMemo(() => demoModesFor(demoNarrow()));
  const demoSelected = createMemo(() => demoView(demoMode(), demoNarrow()));
  const showWidthPresets = () => !showDemoModes() && widthPresets().length > 1;
  const favoriteLabel = () => (isSaved() ? 'Remove from favorites' : 'Add to favorites');

  const [tabsTrack, setTabsTrack] = createSignal<HTMLElement | null>(null);
  const [sizeTrack, setSizeTrack] = createSignal<HTMLElement | null>(null);
  const tabsPill = usePill(tabsTrack, activeTab);
  const sizePill = usePill(
    sizeTrack,
    () =>
      `${previewWidth()}-${widthPresets().length}-${showFullscreen()}-${showDemoModes() ? `${demoSelected()}-${demoOptions().length}` : ''}`
  );

  const onTabKey = (event: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const next = activeTab() === 'preview' ? 'code' : 'preview';
      selectTab(next);
      requestAnimationFrame(() => tabsTrack()?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus());
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selectTab(event.key === 'Home' ? 'preview' : 'code');
    }
  };

  const panelId = () => subcategory() || 'component';

  return (
    <TabsContext value={value}>
      <div class={['docs-tabs-root', props.className]} style={{ width: '100%' }}>
        <div class="docs-toolbar">
          <div
            ref={el => setTabsTrack(el)}
            class="docs-track docs-tabs"
            role="tablist"
            aria-orientation="horizontal"
            data-pill=""
            onKeyDown={onTabKey}
          >
            <span
              class="docs-pill"
              aria-hidden="true"
              data-ready={tabsPill()?.ready ? '' : undefined}
              style={pillStyle(tabsPill())}
            />
            <button
              id={`${panelId()}-tab-preview`}
              type="button"
              role="tab"
              class="docs-segment"
              data-value="preview"
              aria-selected={ariaBool(activeTab() === 'preview')}
              aria-controls={`${panelId()}-panel-preview`}
              tabindex={activeTab() === 'preview' ? 0 : -1}
              data-selected={activeTab() === 'preview' ? '' : undefined}
              onClick={() => selectTab('preview')}
            >
              <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={1.6} />
              Preview
            </button>
            <button
              id={`${panelId()}-tab-code`}
              type="button"
              role="tab"
              class="docs-segment"
              data-value="code"
              aria-selected={ariaBool(activeTab() === 'code')}
              aria-controls={`${panelId()}-panel-code`}
              tabindex={activeTab() === 'code' ? 0 : -1}
              data-selected={activeTab() === 'code' ? '' : undefined}
              onClick={() => selectTab('code')}
            >
              <HugeiconsIcon icon={SourceCodeIcon} size={16} strokeWidth={1.6} />
              Code
            </button>
          </div>

          <div class="docs-toolbar-actions">
            <Show when={showDemoModes() || showWidthPresets() || showFullscreen()}>
              <div
                ref={el => setSizeTrack(el)}
                class="docs-track"
                role="group"
                aria-label={showDemoModes() ? 'Demo content' : 'Preview size'}
                data-pill=""
              >
                <span
                  class="docs-pill"
                  aria-hidden="true"
                  data-ready={sizePill()?.ready ? '' : undefined}
                  style={pillStyle(sizePill())}
                />
                <Show when={showDemoModes()}>
                  <For each={demoOptions()}>
                    {item => (
                      <DocsTooltip label={item.label}>
                        <button
                          type="button"
                          class="docs-segment docs-segment--icon"
                          aria-label={item.label}
                          aria-pressed={ariaBool(demoSelected() === item.value)}
                          onClick={() => setDemoMode(item.value)}
                        >
                          <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} />
                        </button>
                      </DocsTooltip>
                    )}
                  </For>
                </Show>
                <Show when={showWidthPresets()}>
                  <For each={widthPresets()}>
                    {preset => (
                      <DocsTooltip label={preset.label}>
                        <button
                          type="button"
                          class="docs-segment docs-segment--icon"
                          aria-label={preset.label}
                          aria-pressed={ariaBool(previewWidth() === preset.width)}
                          onClick={() => setPreviewWidth(preset.width)}
                        >
                          <HugeiconsIcon icon={preset.icon} size={16} strokeWidth={1.6} />
                        </button>
                      </DocsTooltip>
                    )}
                  </For>
                </Show>
                <Show when={showFullscreen()}>
                  <DocsTooltip label="Fullscreen">
                    <button
                      type="button"
                      class="docs-segment docs-segment--icon"
                      aria-label="Fullscreen"
                      onClick={openFullscreen}
                    >
                      <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={1.6} />
                    </button>
                  </DocsTooltip>
                </Show>
              </div>
            </Show>

            <Show when={showFavorite()}>
              <div class="docs-track" role="group" aria-label="Page actions">
                <DocsTooltip label={favoriteLabel()}>
                  <button
                    type="button"
                    class="docs-segment docs-segment--icon docs-favorite"
                    aria-label={favoriteLabel()}
                    aria-pressed={ariaBool(isSaved())}
                    data-saved={isSaved() ? '' : undefined}
                    onClick={toggleFavorite}
                  >
                    <HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.6} />
                  </button>
                </DocsTooltip>
                <DocsTooltip label="Copy share link">
                  <button
                    type="button"
                    class="docs-segment docs-segment--icon"
                    aria-label="Copy share link"
                    onClick={copyShareLink}
                  >
                    <HugeiconsIcon icon={Share08Icon} size={16} strokeWidth={1.6} />
                  </button>
                </DocsTooltip>
              </div>
            </Show>

            <Show when={aiExport()}>
              <CopyForAIMenu
                copyItems={aiActions.copyItems()}
                openItems={aiActions.openItems()}
                done={aiActions.done()}
              />
            </Show>
          </div>

          <Show when={hasOverflowActions()}>
            <DocsMenu
              placement="bottom-end"
              gutter={12}
              offset={6}
              minWidth="220px"
              trigger={
                <button type="button" class="docs-tool docs-tool--icon docs-toolbar-more" aria-label="More actions">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.6} />
                  <Show when={isSaved()}>
                    <span class="docs-tool-dot" />
                  </Show>
                </button>
              }
            >
              <Show when={showFavorite()}>
                <DocsMenuGroup label="Page">
                  <DocsMenuItem onSelect={toggleFavorite}>
                    <span class="docs-menu-icon" data-saved={isSaved() ? '' : undefined}>
                      <HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.6} />
                    </span>
                    {favoriteLabel()}
                  </DocsMenuItem>
                  <DocsMenuItem onSelect={copyShareLink}>
                    <span class="docs-menu-icon">
                      <HugeiconsIcon icon={Share08Icon} size={16} strokeWidth={1.6} />
                    </span>
                    Copy share link
                  </DocsMenuItem>
                </DocsMenuGroup>
              </Show>
              <Show when={aiExport()}>
                <AIMenuSections
                  copyItems={aiActions.copyItems()}
                  openItems={aiActions.openItems()}
                  done={aiActions.done()}
                />
              </Show>
              <Show when={showFullscreen()}>
                <DocsMenuGroup label="View">
                  <DocsMenuItem onSelect={openFullscreen}>
                    <span class="docs-menu-icon">
                      <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={1.6} />
                    </span>
                    Fullscreen
                  </DocsMenuItem>
                </DocsMenuGroup>
              </Show>
            </DocsMenu>
          </Show>
        </div>

        <PreviewStageContext
          panelId={panelId()}
          frame={frame()}
          canResize={canResize()}
          hasStageControls={hasStageControls()}
          previewWidth={previewWidth()}
          resizing={resizing()}
          setControlsSlot={setControlsSlot}
          setPreviewWidth={setPreviewWidth}
          setResizing={setResizing}
        >
          {props.children}
        </PreviewStageContext>

        <Show when={overview() && overview()!.related.length > 0}>
          <RelatedComponents overview={overview()!} />
        </Show>
        <Show when={category() !== 'get-started'}>
          <ComponentPager category={category()} subcategory={subcategory()} />
        </Show>

        <TabsFooter />
      </div>
    </TabsContext>
  );
}

type StageProps = {
  panelId: string;
  frame: ReturnType<ReturnType<typeof usePreviewFrame>>;
  canResize: boolean;
  hasStageControls: boolean;
  previewWidth: number | null;
  resizing: boolean;
  setControlsSlot: (el: HTMLElement | null) => void;
  setPreviewWidth: (width: number | null) => void;
  setResizing: (value: boolean) => void;
  children: JSX.Element;
};

const StageContext = createContext<Omit<StageProps, 'children'> | null>(null);

function PreviewStageContext(props: StageProps) {
  const value = {
    get panelId() {
      return props.panelId;
    },
    get frame() {
      return props.frame;
    },
    get canResize() {
      return props.canResize;
    },
    get hasStageControls() {
      return props.hasStageControls;
    },
    get previewWidth() {
      return props.previewWidth;
    },
    get resizing() {
      return props.resizing;
    },
    setControlsSlot: (el: HTMLElement | null) => props.setControlsSlot(el),
    setPreviewWidth: (width: number | null) => props.setPreviewWidth(width),
    setResizing: (v: boolean) => props.setResizing(v)
  };
  return <StageContext value={value}>{props.children}</StageContext>;
}

export function PreviewTab(props: { children: JSX.Element }) {
  const tabs = useTabs();
  const stage = useContext(StageContext);
  const active = () => (tabs ? tabs.activeTab() === 'preview' : true);
  return (
    <div
      ref={el => tabs?.setPreviewPanel(el)}
      id={stage ? `${stage.panelId}-panel-preview` : undefined}
      role="tabpanel"
      aria-labelledby={stage ? `${stage.panelId}-tab-preview` : undefined}
      class="preview-panel"
      data-resizing={stage?.resizing ? '' : undefined}
      style={{
        display: active() ? undefined : 'none',
        '--preview-width': stage?.previewWidth == null ? undefined : `${stage.previewWidth}px`
      }}
    >
      <Show when={stage && stage.canResize && stage.frame}>
        {frame => (
          <div
            class="preview-stage"
            aria-hidden="true"
            data-visible={stage!.previewWidth !== null || stage!.resizing ? '' : undefined}
            style={{
              top: `${frame().top}px`,
              left: `${frame().left}px`,
              width: `${frame().fullWidth}px`,
              height: `${frame().height}px`
            }}
          />
        )}
      </Show>
      {props.children}
      <Show when={stage && stage.hasStageControls && stage.frame}>
        {frame => (
          <div
            ref={el => stage!.setControlsSlot(el)}
            class="preview-controls"
            style={{ top: `${frame().top}px`, left: `${frame().left}px`, width: `${frame().fullWidth}px` }}
          />
        )}
      </Show>
      <Show when={stage && stage.canResize}>
        <PreviewResizer
          frame={stage!.frame}
          width={stage!.previewWidth}
          onWidthChange={width => stage!.setPreviewWidth(width)}
          onResizingChange={value => stage!.setResizing(value)}
        />
      </Show>
    </div>
  );
}

export function CodeTab(props: { children: JSX.Element }) {
  const tabs = useTabs();
  const stage = useContext(StageContext);
  const active = () => (tabs ? tabs.activeTab() === 'code' : true);
  return (
    <div
      id={stage ? `${stage.panelId}-panel-code` : undefined}
      role="tabpanel"
      aria-labelledby={stage ? `${stage.panelId}-tab-code` : undefined}
      style={{ display: active() ? undefined : 'none' }}
    >
      {props.children}
    </div>
  );
}

export const useTabsRegistration = () => {
  const tabs = useTabs();
  return {
    tabs,
    register: (fn: (tabs: TabsContextValue) => () => void) => {
      if (!tabs) return;
      onSettled(() => fn(tabs));
    }
  };
};

export default TabsLayout;
