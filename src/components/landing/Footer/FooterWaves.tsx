import {
  Errored,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled
} from 'solid-js';
import type { Component } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import { useColorModeValue } from '@/hooks/useTheme';
import { contentLoader } from '../Deferred';

const MODULES = import.meta.glob('/src/content/Backgrounds/ShapeWaves/ShapeWaves.tsx');
const SHAPE_WAVES = contentLoader(MODULES, '/src/content/Backgrounds/ShapeWaves/ShapeWaves.tsx');

const FONT = 'Geist, "Geist Sans", system-ui, sans-serif';
const WEIGHT = 500;
const WORD = 'Solid Bits';
const SHOWN = 0.6;
const CAP = 0.9;
const FADE = 0.4;

type Layout = {
  font: number;
  above: number;
  fade: number;
  boxWidth: number;
  boxHeight: number;
  left: number;
  height: number;
  x: number;
  y: number;
};

const measureWord = () => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `${WEIGHT} 100px ${FONT}`;
  const metrics = context.measureText(WORD);
  return {
    advance: metrics.width / 100,
    left: metrics.actualBoundingBoxLeft / 100,
    right: metrics.actualBoundingBoxRight / 100,
    ascent: metrics.actualBoundingBoxAscent / 100,
    descent: metrics.actualBoundingBoxDescent / 100
  };
};

const SHAPES = Array.from({ length: 16 }, (_, index) => {
  const x = (index % 4) * 9 + 4.5;
  const y = Math.floor(index / 4) * 9 + 4.5;
  return {
    index,
    x,
    y,
    shape: (index + Math.floor(index / 4)) % 3,
    opacity: 0.48 + ((index * 7) % 5) * 0.11
  };
});

export default function FooterWaves() {
  let root: HTMLDivElement | undefined;
  const id = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [layout, setLayout] = createSignal<Layout | null>(null);
  const [near, setNear] = createSignal(false);
  const [visible, setVisible] = createSignal(false);
  const [pageVisible, setPageVisible] = createSignal(true);
  const [liveWaves, setLiveWaves] = createSignal<Component<any> | null>(null);
  const [failed, setFailed] = createSignal(false);
  const [cellSize, setCellSize] = createSignal(9);
  const [capabilities, setCapabilities] = createSignal({ gpu: false, fine: false, reduced: true });
  const color = useColorModeValue('#868a90', '#5c6066');
  const hoverColor = useColorModeValue('#0977ae', '#a8dffa');
  const backgroundColor = useColorModeValue('#f5f6f7', '#11151b');
  const eligible = createMemo(() => capabilities().gpu && !capabilities().reduced && !failed());

  const box = createMemo(() => {
    const value = layout();
    return value
      ? {
          left: `${value.left}px`,
          top: '0px',
          right: 'auto',
          bottom: 'auto',
          width: `${value.boxWidth}px`,
          height: `${value.boxHeight}px`
        }
      : undefined;
  });

  createEffect(
    () => near() && eligible() && !liveWaves(),
    shouldLoad => {
      if (!shouldLoad) return;
      if (!SHAPE_WAVES) {
        setFailed(true);
        return;
      }
      let cancelled = false;
      SHAPE_WAVES()
        .then(module => {
          if (!cancelled) setLiveWaves(() => module.default);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
      return () => {
        cancelled = true;
      };
    }
  );

  onSettled(() => {
    const el = root;
    if (!el) return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    const update = () => {
      const width = el.clientWidth;
      if (cancelled || !width) return;
      const top = el.parentElement?.querySelector('.ln-footer-top');
      const inset = top ? parseFloat(getComputedStyle(top).paddingLeft) || 0 : 0;
      const word = measureWord();
      const font = Math.max(24, (width - inset * 2) / (word.left + word.right));
      const glyph = font * (word.ascent + word.descent);
      const above = Math.max(36, glyph * 0.46);
      const boxWidth = (font * word.advance) / CAP;
      const boxHeight = above * 2 + glyph;
      setCellSize(Math.min(9, Math.max(3, Math.round(width / 135))));
      setLayout({
        font,
        above,
        fade: above + glyph * FADE,
        boxWidth,
        boxHeight,
        left: (width - boxWidth) / 2,
        height: above + glyph * SHOWN,
        x: boxWidth / 2 + ((word.left - word.right) * font) / 2,
        y: boxHeight / 2 + ((word.ascent - word.descent) * font) / 2
      });
    };
    const resize = new ResizeObserver(update);
    resize.observe(el);
    document.fonts.ready.then(update);
    cleanups.push(() => {
      cancelled = true;
      resize.disconnect();
    });

    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateCaps = () => {
      setCapabilities({
        gpu: Boolean(window.isSecureContext && (navigator as Navigator & { gpu?: unknown }).gpu),
        fine: pointer.matches,
        reduced: motion.matches
      });
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateCaps();
    updateVisibility();
    pointer.addEventListener('change', updateCaps);
    motion.addEventListener('change', updateCaps);
    document.addEventListener('visibilitychange', updateVisibility);
    cleanups.push(() => {
      pointer.removeEventListener('change', updateCaps);
      motion.removeEventListener('change', updateCaps);
      document.removeEventListener('visibilitychange', updateVisibility);
    });

    if (typeof IntersectionObserver !== 'undefined') {
      const preload = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setNear(true);
          preload.disconnect();
        },
        { rootMargin: '120px' }
      );
      const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
      preload.observe(el);
      visibility.observe(el);
      cleanups.push(() => {
        preload.disconnect();
        visibility.disconnect();
      });
    }

    return () => cleanups.forEach(fn => fn());
  });

  return (
    <div
      ref={el => (root = el)}
      class="ln-footer-art"
      aria-hidden="true"
      style={layout() ? { height: `${layout()!.height}px`, '--art-fade': `${layout()!.fade}px` } : undefined}
    >
      <svg class="ln-footer-art-fallback" width="100%" height="100%" style={box()}>
        <defs>
          <pattern
            id={`${id}-shapes`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${cellSize() / 9})`}
          >
            <g fill="currentColor">
              <For each={SHAPES}>
                {item => (
                  <Switch>
                    <Match when={item.shape === 0}>
                      <circle cx={item.x} cy={item.y} r="2.8" opacity={item.opacity} />
                    </Match>
                    <Match when={item.shape === 1}>
                      <rect x={item.x - 2.5} y={item.y - 2.5} width="5" height="5" opacity={item.opacity} />
                    </Match>
                    <Match when={item.shape === 2}>
                      <path d={`M${item.x} ${item.y - 3}l3 5.5h-6z`} opacity={item.opacity} />
                    </Match>
                  </Switch>
                )}
              </For>
            </g>
          </pattern>
          <mask id={`${id}-mask`}>
            <rect width="100%" height="100%" fill="white" />
            <Show when={layout()}>
              {value => (
                <text
                  x={value().x}
                  y={value().y}
                  text-anchor="middle"
                  fill="black"
                  font-family={FONT}
                  font-weight={String(WEIGHT)}
                  font-size={String(value().font)}
                >
                  {WORD}
                </text>
              )}
            </Show>
          </mask>
        </defs>
        <g fill="currentColor">
          <rect width="100%" height="100%" fill={`url(#${id}-shapes)`} mask={`url(#${id}-mask)`} />
        </g>
      </svg>
      <Show when={eligible() && visible() && layout() ? liveWaves() : null}>
        {LiveWaves => (
          <div class="ln-footer-art-live" style={box()}>
            <Errored fallback={null}>
              <Dynamic
                component={LiveWaves()}
                text={WORD}
                fontFamily={FONT}
                fontWeight={WEIGHT}
                textSize={2}
                shapes="mixed"
                cellSize={cellSize()}
                dotSize={0.72}
                scale={1.2}
                fade={0}
                color={color()}
                hoverColor={hoverColor()}
                backgroundColor={backgroundColor()}
                speed={0}
                flow={0}
                glow={0}
                intro={false}
                paused={!visible() || !pageVisible()}
                interactive={visible() && pageVisible() && capabilities().fine && !capabilities().reduced}
                onError={() => setFailed(true)}
              />
            </Errored>
          </div>
        )}
      </Show>
    </div>
  );
}
