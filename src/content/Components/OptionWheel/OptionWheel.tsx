import { For, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import './OptionWheel.css';

type Side = 'left' | 'right';

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: Side;
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
}

interface WheelConfig {
  count: number;
  items: string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: Side;
  loop: boolean;
  smoothing: number;
  draggable: boolean;
  soundUrl: string;
  soundVolume: number;
  onChange?: (index: number, item: string) => void;
}

const DEFAULT_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass'
];

export default function OptionWheel(props: OptionWheelProps) {
  let rootEl: HTMLDivElement | undefined;
  const itemEls: (HTMLDivElement | undefined)[] = [];
  const initial = untrack(() => props.defaultSelected ?? 3);
  let pos = initial;
  let target = initial;
  let raf: number | null = null;
  let last = 0;
  let selected = initial;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let drag: { y: number; start: number; id: number } | null = null;
  let dragMoved = false;
  let audio: HTMLAudioElement | null = null;
  let audioUrl = '';
  let lastTick = 0;
  let alive = true;
  const [selectedIndex, setSelectedIndex] = createSignal(initial);
  const [isDragging, setIsDragging] = createSignal(false);

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const side = () => props.side ?? 'left';
  const fontSize = () => props.fontSize ?? 3;

  const cfgMemo = createMemo<WheelConfig>(() => {
    const remPx =
      typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16;
    const list = items();
    return {
      count: list.length,
      items: list,
      rowH: Math.max(fontSize() * (props.spacing ?? 1.4) * remPx, 1),
      curve: props.curve ?? 1,
      tilt: props.tilt ?? 6,
      blur: props.blur ?? 2,
      fade: props.fade ?? 0.25,
      minOpacity: props.minOpacity ?? 0.05,
      side: side(),
      loop: props.loop ?? false,
      smoothing: props.smoothing ?? 200,
      draggable: props.draggable ?? true,
      soundUrl: props.soundUrl ?? '',
      soundVolume: props.soundVolume ?? 0.5,
      onChange: props.onChange
    };
  });

  let cfg = untrack(cfgMemo);

  const place = (el: HTMLDivElement, i: number, next: number) => {
    const n = cfg.count;
    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    let d = i - next;
    if (cfg.loop && n > 1) {
      d = ((d % n) + n) % n;
      if (d > n / 2) d -= n;
    }
    const dist = Math.abs(d);
    let x = 0;
    let y = d * cfg.rowH;
    let rot = 0;
    if (R > 0) {
      const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
      y = R * Math.sin(ang);
      x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
      rot = (mirror * ang * 180) / Math.PI;
    }
    el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
    el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
    el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
    el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
  };

  const runFrame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    const cur = pos;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    pos = next;

    for (let i = 0; i < cfg.count; i++) {
      const el = itemEls[i];
      if (el) place(el, i, next);
    }

    raf = settled ? null : requestAnimationFrame(runFrame);
  };

  const startLoop = () => {
    if (!alive) return;
    if (raf != null) cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(runFrame);
  };

  const playTick = () => {
    const { soundUrl, soundVolume } = cfg;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - lastTick < 70) return;
    lastTick = now;
    if (!audio || audioUrl !== soundUrl) {
      audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audioUrl = soundUrl;
    }
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  };

  const applyTarget = (value: number, snap: boolean) => {
    let v = value;
    if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
    if (snap) v = Math.round(v);
    target = v;
    const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
    if (idx !== selected) {
      selected = idx;
      setSelectedIndex(idx);
      cfg.onChange?.(idx, cfg.items[idx]);
      playTick();
    }
    startLoop();
  };

  createEffect(cfgMemo, value => {
    const prev = cfg;
    cfg = value;
    const layoutChanged =
      prev === value ||
      prev.items !== value.items ||
      prev.rowH !== value.rowH ||
      prev.curve !== value.curve ||
      prev.tilt !== value.tilt ||
      prev.blur !== value.blur ||
      prev.fade !== value.fade ||
      prev.minOpacity !== value.minOpacity ||
      prev.side !== value.side ||
      prev.loop !== value.loop ||
      prev.smoothing !== value.smoothing;
    if (layoutChanged) applyTarget(target, false);
  });

  onSettled(() => {
    const el = rootEl;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(target + step, false);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => applyTarget(target, true), 140);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    startLoop();
    return () => {
      alive = false;
      el.removeEventListener('wheel', onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      audio?.pause();
    };
  });

  const handlePointerDown = (e: PointerEvent) => {
    if (!cfg.draggable) return;
    drag = { y: e.clientY, start: target, id: e.pointerId };
    dragMoved = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!dragMoved && Math.abs(dy) > 4) {
      dragMoved = true;
      rootEl?.setPointerCapture(drag.id);
    }
    if (dragMoved) applyTarget(drag.start - dy / cfg.rowH, false);
  };

  const handlePointerEnd = () => {
    if (!drag) return;
    drag = null;
    setIsDragging(false);
    if (dragMoved) applyTarget(target, true);
  };

  const handleItemClick = (index: number) => {
    if (dragMoved) return;
    const cur = target;
    let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
    if (cfg.loop && cfg.count > 1) {
      if (d > cfg.count / 2) d -= cfg.count;
      else if (d < -cfg.count / 2) d += cfg.count;
    }
    applyTarget(cur + d, true);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    let delta: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
    if (delta == null) return;
    e.preventDefault();
    applyTarget(Math.round(target) + delta, true);
  };

  return (
    <div
      ref={el => (rootEl = el)}
      role="listbox"
      tabindex={0}
      aria-label="Option wheel"
      class={[
        'option-wheel',
        { 'option-wheel--right': side() === 'right', 'option-wheel--dragging': isDragging() },
        props.className
      ]}
      style={{
        '--ow-text-color': props.textColor ?? '#a6a6a6',
        '--ow-active-color': props.activeColor ?? '#ffffff',
        '--ow-font-size': `${fontSize()}rem`,
        '--ow-inset': `${props.inset ?? 80}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      <For each={items()} keyed={false}>
        {(label, index) => (
          <div
            ref={el => {
              itemEls[index] = el;
              place(el, index, pos);
            }}
            role="option"
            aria-selected={selectedIndex() === index ? 'true' : 'false'}
            class={['option-wheel__item', { 'option-wheel__item--selected': selectedIndex() === index }]}
            onClick={() => handleItemClick(index)}
          >
            {label()}
          </div>
        )}
      </For>
    </div>
  );
}
