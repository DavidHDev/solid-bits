import { Show, children, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Alert02Icon, Loading03Icon, RefreshIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import './RefineFrame.css';

export type RefineFrameStatus = 'queued' | 'generating' | 'refining' | 'complete' | 'error';

export interface RefineFrameProps {
  status?: RefineFrameStatus;
  children?: JSX.Element;
  aspectRatio?: string;
  width?: number;
  radius?: number;
  background?: string;
  color?: string;
  stageDuration?: number;
  sweep?: boolean;
  showStatus?: boolean;
  hideAfter?: number;
  labels?: Partial<Record<RefineFrameStatus, string>>;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];
type Stage = { blur: number; sat: number; scale: number; opacity: number };
interface Sim {
  p: number;
  raf: number;
  last: number;
  key: string;
  w: number;
  h: number;
  levels: HTMLCanvasElement[];
  glint: CanvasGradient | null;
  sent: boolean;
}
interface Live {
  status: RefineFrameStatus;
  stageDuration: number;
  sweep: boolean;
  reduce: boolean;
}

const STAGES: Record<RefineFrameStatus, Stage> = {
  queued: { blur: 4, sat: 0.6, scale: 1.04, opacity: 0.55 },
  generating: { blur: 1.5, sat: 0.8, scale: 1.02, opacity: 0.85 },
  refining: { blur: 0.5, sat: 0.95, scale: 1.005, opacity: 1 },
  complete: { blur: 0, sat: 1, scale: 1, opacity: 1 },
  error: { blur: 2, sat: 0.5, scale: 1, opacity: 0.28 }
};
const TARGET: Partial<Record<RefineFrameStatus, number>> = { queued: 0, generating: 0.5, refining: 0.875, complete: 1 };
const LEVELS = [48, 32, 20, 12, 8, 5, 3, 2, 1];
const EDGE = 28;
const STRIPS = 14;
const DEFAULT_LABELS: Record<RefineFrameStatus, string> = {
  queued: 'Queued',
  generating: 'Generating',
  refining: 'Refining',
  complete: 'Ready',
  error: 'Failed'
};
const ACTIVE = new Set<string>(['queued', 'generating', 'refining']);

const escapeAttr = (value: string | number) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const iconMarkup = (icon: IconSvgElement, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${escapeAttr(name === 'stroke-width' ? strokeWidth : value)}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function Icon(props: { icon: IconSvgElement; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      innerHTML={iconMarkup(props.icon, props.strokeWidth)}
    />
  );
}

const findImg = (nodes: unknown[]): HTMLImageElement | null => {
  for (const node of nodes) {
    if (node instanceof HTMLImageElement) return node;
    if (node instanceof Element) {
      const img = node.querySelector('img');
      if (img) return img;
    }
  }
  return null;
};

const build = (s: Sim, canvas: HTMLCanvasElement, img: HTMLImageElement, dpr: number) => {
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, Math.round(rect.width * dpr));
  const H = Math.max(1, Math.round(rect.height * dpr));
  const key = `${img.currentSrc}|${W}x${H}`;
  if (s.key === key) return;
  s.key = key;
  s.w = W;
  s.h = H;
  canvas.width = W;
  canvas.height = H;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const cover = Math.max(W / iw, H / ih);
  const sw = W / cover;
  const sh = H / cover;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  const glint = canvas.getContext('2d')?.createLinearGradient(0, 0, W, 0) ?? null;
  if (glint) {
    for (const [at, a] of [
      [0, 0],
      [0.08, 0.1],
      [0.2, 0.7],
      [0.32, 1],
      [0.68, 1],
      [0.8, 0.7],
      [0.92, 0.1],
      [1, 0]
    ]) {
      glint.addColorStop(at, `rgba(255, 255, 255, ${a})`);
    }
  }
  s.glint = glint;
  s.levels = LEVELS.map(block => {
    const b = block === 1 ? 1 : Math.max(2, Math.round(block * dpr));
    const full = document.createElement('canvas');
    full.width = W;
    full.height = H;
    const fc = full.getContext('2d');
    if (!fc) return full;
    if (b === 1) {
      fc.imageSmoothingEnabled = true;
      fc.imageSmoothingQuality = 'high';
      fc.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      return full;
    }
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.round(W / b));
    small.height = Math.max(1, Math.round(H / b));
    const sc = small.getContext('2d');
    if (sc) {
      sc.imageSmoothingEnabled = true;
      sc.imageSmoothingQuality = 'high';
      sc.drawImage(img, sx, sy, sw, sh, 0, 0, small.width, small.height);
    }
    fc.imageSmoothingEnabled = false;
    fc.drawImage(small, 0, 0, W, H);
    return full;
  });
};

export default function RefineFrame(props: RefineFrameProps) {
  let printEl: HTMLDivElement | undefined;
  let canvasEl: HTMLCanvasElement | undefined;
  const sim: Sim = { p: 0, raf: 0, last: 0, key: '', w: 0, h: 0, levels: [], glint: null, sent: false };
  const live: Live = { status: 'generating', stageDuration: 400, sweep: true, reduce: false };
  let disposed = false;

  const rawStatus = createMemo<RefineFrameStatus>(() => props.status ?? 'generating');
  const stage = createMemo(() => STAGES[rawStatus()] ?? STAGES.generating);
  const active = createMemo(() => ACTIVE.has(rawStatus()));
  const text = createMemo<Record<string, string>>(() => ({ ...DEFAULT_LABELS, ...(props.labels ?? DEFAULT_LABELS) }));
  const statusText = createMemo(() => text()[rawStatus()] ?? rawStatus());
  const width = createMemo(() => props.width ?? 320);
  const aspectRatio = createMemo(() => props.aspectRatio ?? '4 / 3');
  const stageDuration = createMemo(() => props.stageDuration ?? 400);
  const sweep = createMemo(() => props.sweep ?? true);
  const showStatus = createMemo(() => props.showStatus ?? true);
  const hideAfter = createMemo(() => props.hideAfter ?? 1200);
  const resolvedChildren = children(() => props.children);
  const childNodes = createMemo(() => {
    const value = resolvedChildren();
    return Array.isArray(value) ? value : [value];
  });

  const mosaic = createMemo<boolean>(prev => {
    rawStatus();
    const img = findImg(childNodes());
    if (!img) return false;
    if (img.complete && img.naturalWidth) return true;
    return prev ?? false;
  });
  const [loaded, setLoaded] = createSignal<HTMLImageElement | null>(null);
  const mosaicOn = createMemo(() => {
    const img = findImg(childNodes());
    return mosaic() || (img !== null && loaded() === img);
  });
  const [resolved, setResolved] = createSignal(false);

  const [chip, setChip] = createSignal<boolean>(() => {
    rawStatus();
    hideAfter();
    return showStatus();
  });

  createEffect(
    () => ({ s: rawStatus(), show: showStatus(), after: hideAfter() }),
    value => {
      if (!value.show || value.s !== 'complete' || value.after <= 0) return undefined;
      const timer = setTimeout(() => setChip(false), value.after);
      return () => clearTimeout(timer);
    }
  );

  const tick = (now: number) => {
    const s = sim;
    const c = live;
    const canvas = canvasEl;
    const img = printEl?.querySelector('img') as HTMLImageElement | null;
    if (disposed || !canvas || !img || !img.naturalWidth) {
      s.raf = 0;
      return;
    }
    const dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : 0.016);
    s.last = now;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    build(s, canvas, img, dpr);
    const n = s.levels.length - 1;
    const target = TARGET[c.status] ?? s.p;
    const rate = c.reduce ? 1e9 : 1 / (n * (c.stageDuration / 1000));
    const step = rate * dt;
    if (target < s.p) s.p = target;
    else if (target - s.p <= step) s.p = target;
    else s.p += step;
    if (Math.abs(target - s.p) <= 0.0005) s.p = target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const L = s.p * n;
      const i = Math.min(n, Math.floor(L + 1e-6));
      const frac = L - i;
      ctx.globalAlpha = 1;
      ctx.drawImage(s.levels[i], 0, 0);
      if (i < n && frac > 0) {
        const edge = EDGE * dpr;
        const front = frac * (s.h + edge) - edge / 2;
        const top = Math.max(0, Math.floor(front - edge / 2));
        if (top > 0) ctx.drawImage(s.levels[i + 1], 0, 0, s.w, top, 0, 0, s.w, top);
        const sh = edge / STRIPS;
        for (let k = 0; k < STRIPS; k += 1) {
          const y = front - edge / 2 + k * sh;
          if (y + sh <= 0 || y >= s.h) continue;
          const t = 1 - (k + 0.5) / STRIPS;
          ctx.globalAlpha = t * t * (3 - 2 * t);
          const y0 = Math.max(0, y);
          const h0 = Math.min(s.h, y + sh) - y0;
          if (h0 > 0) ctx.drawImage(s.levels[i + 1], 0, y0, s.w, h0, 0, y0, s.w, h0);
        }
        ctx.globalAlpha = 1;
        if (c.sweep && !c.reduce && s.glint && front > 0 && front < s.h) {
          ctx.fillStyle = s.glint;
          ctx.globalAlpha = 0.12;
          ctx.fillRect(0, front - 2 * dpr, s.w, 4 * dpr);
          ctx.globalAlpha = 0.3;
          ctx.fillRect(0, front - dpr, s.w, 2 * dpr);
          ctx.globalAlpha = 1;
        }
      }
    }
    const done = s.p >= 1;
    if (done !== s.sent) {
      s.sent = done;
      setResolved(done);
    }
    const keep = (!c.reduce && ACTIVE.has(c.status)) || Math.abs(target - s.p) > 0.0005;
    s.raf = keep ? requestAnimationFrame(tick) : 0;
    if (!keep) s.last = 0;
  };
  const wake = () => {
    if (disposed) return;
    if (!sim.raf) sim.raf = requestAnimationFrame(tick);
  };

  let prevWake = '';
  createEffect(
    () => ({
      status: rawStatus(),
      stageDuration: stageDuration(),
      sweep: sweep(),
      width: width(),
      aspect: aspectRatio()
    }),
    value => {
      live.status = value.status;
      live.stageDuration = value.stageDuration;
      live.sweep = value.sweep;
      const key = `${value.status}|${value.width}|${value.aspect}`;
      if (key !== prevWake) {
        prevWake = key;
        wake();
      }
    }
  );

  createEffect(
    () => ({ nodes: childNodes(), s: rawStatus() }),
    () => {
      const img = printEl?.querySelector('img') as HTMLImageElement | null;
      if (!img) return undefined;
      let gone = false;
      const start = () => {
        if (gone) return;
        setLoaded(img);
        wake();
      };
      if (img.complete && img.naturalWidth) {
        wake();
        return undefined;
      }
      img.addEventListener('load', start, { once: true });
      return () => {
        gone = true;
        img.removeEventListener('load', start);
      };
    }
  );

  onSettled(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      live.reduce = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      disposed = true;
      mq.removeEventListener('change', sync);
      cancelAnimationFrame(sim.raf);
      sim.raf = 0;
    };
  });

  return (
    <div
      class={['refine-frame', props.className]}
      role="img"
      aria-label={statusText()}
      aria-busy={active() ? 'true' : undefined}
      data-status={rawStatus()}
      data-active={active() ? '' : undefined}
      data-sweep={sweep() && active() ? '' : undefined}
      data-mosaic={mosaicOn() ? '' : undefined}
      data-resolved={mosaicOn() && resolved() ? '' : undefined}
      style={{
        '--rf-w': `${width()}px`,
        '--rf-aspect': aspectRatio(),
        '--rf-radius': `${props.radius ?? 16}px`,
        '--rf-bg': props.background ?? '#27272a',
        '--rf-ink': props.color ?? '#f5f5f5',
        '--rf-stage': `${stageDuration()}ms`,
        '--rf-blur': `${mosaicOn() ? 0 : stage().blur}px`,
        '--rf-sat': String(stage().sat),
        '--rf-scale': String(mosaicOn() ? 1 : stage().scale),
        '--rf-opacity': String(stage().opacity)
      }}
    >
      <div class="refine-frame__media" aria-hidden="true">
        <div ref={el => (printEl = el)} class="refine-frame__print">
          {resolvedChildren()}
        </div>
        <canvas ref={el => (canvasEl = el)} class="refine-frame__mosaic" />
      </div>
      <div class="refine-frame__sweep" aria-hidden="true" />
      <Show when={chip()}>
        <div class="refine-frame__chip" aria-hidden="true">
          <span class="refine-frame__mark" data-kind={active() ? 'spin' : rawStatus()}>
            <Show
              when={rawStatus() === 'complete'}
              fallback={
                <Show
                  when={rawStatus() === 'error'}
                  fallback={<Icon icon={Loading03Icon} size={13} strokeWidth={2.2} />}
                >
                  <Icon icon={Alert02Icon} size={13} strokeWidth={2.2} />
                </Show>
              }
            >
              <Icon icon={Tick02Icon} size={13} strokeWidth={2.5} />
            </Show>
          </span>
          <Show when={rawStatus()} keyed>
            {_s => <span class="refine-frame__label">{statusText()}</span>}
          </Show>
        </div>
      </Show>
      <Show when={rawStatus() === 'error' && props.onRetry}>
        <button type="button" class="refine-frame__retry" onClick={() => props.onRetry?.()}>
          <Icon icon={RefreshIcon} size={14} strokeWidth={2.2} />
          <span>{props.retryLabel ?? 'Retry'}</span>
        </button>
      </Show>
      <span class="refine-frame__sr" role="status">
        {statusText()}
      </span>
    </div>
  );
}
