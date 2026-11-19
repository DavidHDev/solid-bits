import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal } from '@solidjs/web';
import { ArrowRight01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { logoWhite, markWhite } from '@/assets/logos';
import BackgroundModeSwitch from './BackgroundModeSwitch';
import { DEMO_NARROW_WIDTH, demoModesFor, demoView } from './demoModes';
import { usePreviewStage, type DemoMode } from './previewStage';

const DESCRIPTION = 'Solid Bits brings motion and character to your interface, one copy-paste component at a time.';
const LINKS = ['Docs', 'Showcase', 'Pricing'];
const FADE_MS = 200;
const MORPH_MS = 440;
const PHONE_HEIGHT = 844;
const PHONE_MARGIN = 36;

let rememberedMode: DemoMode = 'none';

export default function BackgroundContent(props: { headline?: string; pillText?: string }) {
  const stage = usePreviewStage();
  const demo = stage?.demo ?? null;
  const headline = () => props.headline ?? 'Build interfaces that feel alive';

  let rootEl: HTMLDivElement | undefined;
  const [localMode, setLocalMode] = createSignal<DemoMode>(rememberedMode);
  const [narrow, setNarrow] = createSignal(false);
  const target = () => (demo ? demo.mode() : localMode());
  const view = createMemo(() => demoView(target(), narrow()));
  const modes = createMemo(() => demoModesFor(narrow()));
  const [shape, setShape] = createSignal<DemoMode>(demoView(rememberedMode, false));
  const [clip, setClip] = createSignal<DemoMode>(demoView(rememberedMode, false));
  const [shown, setShown] = createSignal<DemoMode | null>(demoView(rememberedMode, false));
  const [hidden, setHidden] = createSignal(false);
  let current: DemoMode | null = null;
  let animate = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const fitPhone = () => {
    const host = rootEl?.parentElement;
    if (!host) return;
    host.style.removeProperty('--bgc-phone-scale');
    const base = parseFloat(getComputedStyle(host).getPropertyValue('--bgc-phone-scale')) || 0.6;
    const fit = (host.clientHeight - PHONE_MARGIN * 2) / PHONE_HEIGHT;
    if (fit > 0 && fit < base) host.style.setProperty('--bgc-phone-scale', fit.toFixed(4));
  };

  const measure = () => {
    if (!rootEl) return;
    const isNarrow = rootEl.clientWidth < DEMO_NARROW_WIDTH;
    setNarrow(isNarrow);
    demo?.setNarrow(isNarrow);
    fitPhone();
  };

  onSettled(() => {
    measure();
    const frame = requestAnimationFrame(() => {
      animate = true;
    });
    const observer = new ResizeObserver(measure);
    if (rootEl) observer.observe(rootEl);
    demo?.setPresent(true);
    const host = rootEl?.parentElement;
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host?.style.removeProperty('--bgc-phone-scale');
      timers.forEach(clearTimeout);
      demo?.setPresent(false);
    };
  });

  createEffect(view, next => {
    if (current === null) {
      current = next;
      setShape(next);
      setClip(next);
      setShown(next);
      return;
    }
    if (next === current) return;
    current = next;
    timers.forEach(clearTimeout);
    setShape(next);
    if (!animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setClip(next);
      setShown(next);
      setHidden(false);
      return;
    }
    setHidden(true);
    setShown(null);
    timers = [
      setTimeout(() => setClip(next), FADE_MS),
      setTimeout(() => {
        setShown(next);
        setHidden(false);
      }, MORPH_MS)
    ];
  });

  const select = (next: DemoMode) => {
    if (demo) {
      demo.setMode(next);
      return;
    }
    rememberedMode = next;
    setLocalMode(next);
  };

  const modeSwitch = () => <BackgroundModeSwitch modes={modes()} mode={view()} onChange={select} />;

  const Copy = () => (
    <div class="bgc-copy">
      <p class="bgc-title">{headline()}</p>
      <p class="bgc-text">{DESCRIPTION}</p>
      <div class="bgc-cta">
        <span class="bgc-button bgc-button--primary">
          Start building
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
        </span>
        <span class="bgc-button bgc-button--ghost">Browse components</span>
      </div>
    </div>
  );

  return (
    <div
      ref={el => (rootEl = el)}
      class="bgc"
      data-mode={shape()}
      data-clip={clip()}
      data-hidden={hidden() ? '' : undefined}
    >
      <span class="bgc-veil" />
      <div class="bgc-window" aria-hidden="true" data-active={shown() === 'landing' ? '' : undefined}>
        <div class="bgc-window-bar">
          <span class="bgc-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span class="bgc-window-url">solid-bits.dev</span>
        </div>
        <div class="bgc-site">
          <div class="bgc-nav">
            <img class="bgc-logo" src={logoWhite} alt="" draggable="false" />
            <div class="bgc-links">
              <For each={LINKS}>{link => <span>{link}</span>}</For>
            </div>
            <span class="bgc-button bgc-button--primary bgc-button--small">Get started</span>
          </div>
          <Copy />
        </div>
      </div>
      <div class="bgc-phone" aria-hidden="true" data-active={shown() === 'mobile' ? '' : undefined}>
        <div class="bgc-phone-screen">
          <div class="bgc-phone-status">
            <span>9:41</span>
            <span class="bgc-phone-island" />
            <span class="bgc-phone-battery">
              <i />
            </span>
          </div>
          <div class="bgc-nav">
            <img class="bgc-logo" src={logoWhite} alt="" draggable="false" />
            <span class="bgc-menu">
              <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.6} />
            </span>
          </div>
          <Copy />
          <span class="bgc-phone-home" />
        </div>
      </div>
      <div class="bgc-card" aria-hidden="true" data-active={shown() === 'card' ? '' : undefined}>
        <div class="bgc-card-fade" />
        <span class="bgc-card-badge">
          <img src={markWhite} alt="" draggable="false" />
        </span>
        <div class="bgc-card-body">
          <p class="bgc-card-title">{headline()}</p>
          <p class="bgc-card-text">{DESCRIPTION}</p>
          <div class="bgc-card-actions">
            <span class="bgc-button bgc-button--primary bgc-button--small">Get started</span>
            <span class="bgc-card-link">
              Learn more
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
      <span class="bgc-shell" />
      <Show when={stage?.hasControls()} fallback={modeSwitch()}>
        <Show when={stage?.controls()}>{mount => <Portal mount={mount()}>{modeSwitch()}</Portal>}</Show>
      </Show>
    </div>
  );
}
