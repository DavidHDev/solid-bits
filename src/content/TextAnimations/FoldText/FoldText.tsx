import { For, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './FoldText.css';

gsap.registerPlugin(ScrollTrigger);

type SplitBy = 'char' | 'word' | 'line';
type Hinge = 'top' | 'bottom' | 'left' | 'right';
type Trigger = 'mount' | 'hover' | 'scroll' | 'loop';
type StaggerFrom = 'start' | 'center' | 'end' | 'edges' | 'random';
type FoldStyle = 'paper' | 'blinds' | 'flip';
type Axis = 'rotateX' | 'rotateY';

export interface FoldTextProps {
  text?: string;
  splitBy?: SplitBy;
  hinge?: Hinge;
  foldStyle?: FoldStyle;
  duration?: number;
  stagger?: number;
  staggerFrom?: StaggerFrom;
  foldAngle?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  loopDelay?: number;
  hoverRefold?: boolean;
  refoldRadius?: number;
  refoldAngle?: number;
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

type HingeConfig = {
  origin: string;
  axis: Axis;
  sign: number;
};

type Piece = {
  element: HTMLElement;
  parts: HTMLElement[];
  t: number;
  f: number;
  r: number;
  aim: number;
};

type Point = { x: number; y: number };

type PieceData = { content: string; line: boolean };

type Segment =
  | { kind: 'piece'; piece: PieceData }
  | { kind: 'word'; pieces: PieceData[] }
  | { kind: 'space'; value: string }
  | { kind: 'break' };

type Layout = {
  text: string;
  splitBy: SplitBy;
  segments: Segment[];
  hinge: Hinge;
  foldStyle: FoldStyle;
  startsFolded: boolean;
};

type Setup = {
  layout: Layout;
  hingeConfig: HingeConfig;
  foldStyle: FoldStyle;
  duration: number;
  stagger: number;
  staggerFrom: StaggerFrom;
  angle: number;
  ease: string;
  crease: number;
  trigger: Trigger;
  delay: number;
  hoverRefold: boolean;
  radius: number;
  refold: number;
  startsFolded: boolean;
};

const HINGES: Record<Hinge, HingeConfig> = {
  top: { origin: '50% 0%', axis: 'rotateX', sign: -1 },
  bottom: { origin: '50% 100%', axis: 'rotateX', sign: 1 },
  left: { origin: '0% 50%', axis: 'rotateY', sign: 1 },
  right: { origin: '100% 50%', axis: 'rotateY', sign: -1 }
};

const SLATS: Record<Axis, { origins: string[]; clips: string[] }> = {
  rotateX: {
    origins: ['50% 25%', '50% 75%'],
    clips: ['inset(-40% -20% 50% -20%)', 'inset(50% -20% -40% -20%)']
  },
  rotateY: {
    origins: ['25% 50%', '75% 50%'],
    clips: ['inset(-40% 50% -40% -20%)', 'inset(-40% -20% -40% 50%)']
  }
};

const FOLD_STYLES: FoldStyle[] = ['paper', 'blinds', 'flip'];
const SLAT_DELAY = 0.24;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sameFields = <T extends object>(a: T | null, b: T | null, skip?: keyof T): boolean =>
  a === b || (!!a && !!b && (Object.keys(a) as (keyof T)[]).every(key => key === skip || Object.is(a[key], b[key])));

const buildSegments = (text: string, splitBy: SplitBy): Segment[] => {
  if (splitBy === 'line') {
    return text.split('\n').map(line => ({ kind: 'piece', piece: { content: line || ' ', line: true } }));
  }

  return text.split(/(\s+)/).flatMap((part): Segment[] => {
    if (!part) return [];

    if (/^\s+$/.test(part)) {
      return part
        .split('\n')
        .flatMap((spaces, lineIndex): Segment[] => [
          ...(lineIndex > 0 ? [{ kind: 'break' } as const] : []),
          ...(spaces ? [{ kind: 'space', value: spaces } as const] : [])
        ]);
    }

    if (splitBy === 'word') return [{ kind: 'piece', piece: { content: part, line: false } }];

    return [{ kind: 'word', pieces: Array.from(part).map(char => ({ content: char, line: false })) }];
  });
};

export default function FoldText(props: FoldTextProps) {
  let rootEl: HTMLSpanElement | undefined;
  const [ready, setReady] = createSignal(false);

  const text = () => props.text ?? 'Design unfolds';
  const safeHinge = createMemo<Hinge>(() => {
    const hinge = props.hinge ?? 'top';
    return HINGES[hinge] ? hinge : 'top';
  });
  const safeStyle = createMemo<FoldStyle>(() => {
    const style = props.foldStyle ?? 'paper';
    return FOLD_STYLES.includes(style) ? style : 'paper';
  });
  const startsFolded = createMemo(() => (props.trigger ?? 'mount') !== 'hover');

  const layout = createMemo<Layout>(prev => {
    const splitBy = props.splitBy ?? 'char';
    const next = {
      text: text(),
      splitBy,
      segments: prev?.segments ?? [],
      hinge: safeHinge(),
      foldStyle: safeStyle(),
      startsFolded: startsFolded()
    };
    if (prev && sameFields(prev, next, 'segments')) return prev;
    return { ...next, segments: buildSegments(next.text, splitBy) };
  });

  onSettled(() => {
    setReady(true);
  });

  const setup = createMemo<Setup | null>(
    () =>
      ready()
        ? {
            layout: layout(),
            hingeConfig: HINGES[safeHinge()],
            foldStyle: safeStyle(),
            duration: props.duration ?? 0.65,
            stagger: Math.max(0, props.stagger ?? 0.045),
            staggerFrom: props.staggerFrom ?? 'start',
            angle: clamp(props.foldAngle ?? 92, 0, 180),
            ease: props.ease ?? 'power3.out',
            crease: clamp(props.creaseShading ?? 0.55, 0, 1),
            trigger: props.trigger ?? 'mount',
            delay: Math.max(0, props.loopDelay ?? 1.4),
            hoverRefold: props.hoverRefold ?? false,
            radius: Math.max(1, props.refoldRadius ?? 140),
            refold: clamp(props.refoldAngle ?? 45, 0, 180),
            startsFolded: startsFolded()
          }
        : null,
    { equals: (a, b) => sameFields(a, b) }
  );

  createEffect(setup, config => {
    const root = rootEl;
    if (!config || !root) return undefined;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('.fold-text-piece'));
    if (!elements.length) return undefined;

    const {
      hingeConfig,
      foldStyle: safeStyle,
      duration,
      stagger: safeStagger,
      staggerFrom,
      angle: safeAngle,
      ease,
      crease: safeCrease,
      trigger,
      delay: safeDelay,
      hoverRefold,
      radius: safeRadius,
      refold: safeRefold,
      startsFolded
    } = config;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { axis, sign, origin } = hingeConfig;
    const slats = SLATS[axis];
    const unfoldEase = gsap.parseEase(reduceMotion ? 'power1.out' : ease) || gsap.parseEase('power3.out');
    const foldEase = gsap.parseEase(reduceMotion ? 'power1.in' : 'power2.in');
    const angle = reduceMotion ? 0 : safeStyle === 'flip' ? 180 : safeAngle;
    const crease = reduceMotion ? 0 : safeCrease;
    const refold = hoverRefold && !reduceMotion ? safeRefold : 0;
    const lift = safeStyle === 'flip' && !reduceMotion ? 0.45 : 0;
    const unfoldDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
    const staggerVars: gsap.StaggerVars = {
      each: reduceMotion ? Math.min(safeStagger, 0.02) : safeStagger,
      from: staggerFrom
    };

    const pieces = elements.map((element): Piece => {
      const parts = safeStyle === 'blinds' ? (Array.from(element.children) as HTMLElement[]) : [element];
      if (safeStyle === 'blinds') {
        element.style.opacity = '1';
        parts.forEach((part, index) => {
          part.style.transformOrigin = slats.origins[index];
          if (index > 0) part.style.clipPath = slats.clips[index];
        });
      } else {
        element.style.transformOrigin = safeStyle === 'flip' ? '50% 50%' : origin;
        element.style.backfaceVisibility = safeStyle === 'flip' ? 'visible' : '';
      }
      return { element, parts, t: startsFolded ? 0 : 1, f: 0, r: 0, aim: 0 };
    });

    const shade = (progress: number, tilt: number) => String(crease * clamp(1 - progress + tilt / 90, 0, 1));

    const render = () => {
      pieces.forEach(piece => {
        const tilt = piece.r * refold;

        if (safeStyle === 'blinds') {
          let resting = tilt < 0.05;
          piece.parts.forEach((part, index) => {
            const offset = index * SLAT_DELAY;
            const open = unfoldEase(clamp((piece.t - offset) / (1 - SLAT_DELAY), 0, 1));
            const close = foldEase(clamp((piece.f - offset) / (1 - SLAT_DELAY), 0, 1));
            const progress = open * (1 - close);
            if (Math.abs(1 - progress) > 0.002) resting = false;
            part.style.transform = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
            part.style.opacity = String(clamp(progress, 0, 1));
            part.style.setProperty('--fold-crease', shade(progress, tilt));
          });
          piece.parts[0].style.clipPath = resting ? 'none' : slats.clips[0];
          piece.parts[1].style.visibility = resting ? 'hidden' : 'visible';
          return;
        }

        const progress = unfoldEase(piece.t) * (1 - foldEase(piece.f));
        const rise = lift * Math.sin(Math.PI * clamp(progress, 0, 1));
        const turn = `${axis}(${sign * ((1 - progress) * angle + tilt)}deg)`;
        piece.element.style.transform = rise > 0.001 ? `translateZ(${rise}em) ${turn}` : turn;
        piece.element.style.opacity = String(clamp(progress, 0, 1));
        piece.element.style.setProperty('--fold-crease', shade(progress, tilt));
      });
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;

    const play = (loop: boolean) => {
      timeline?.kill();
      timeline = gsap.timeline({ onUpdate: render, ...(loop ? { repeat: -1, repeatDelay: 0.35 } : {}) });
      timeline.fromTo(pieces, { t: 0, f: 0 }, { t: 1, duration: unfoldDuration, ease: 'none', stagger: staggerVars });
      if (loop) {
        timeline.to(
          pieces,
          { f: 1, duration: unfoldDuration * 0.75, ease: 'none', stagger: staggerVars },
          `+=${safeDelay}`
        );
      }
      render();
    };

    const handleEnter = () => play(false);

    if (trigger === 'hover') {
      render();
      root.addEventListener('mouseenter', handleEnter);
    } else if (trigger === 'scroll') {
      render();
      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: 'top 82%',
        once: true,
        onEnter: handleEnter
      });
    } else {
      play(trigger === 'loop');
    }

    let pointer: Point | null = null;
    let centers: Point[] | null = null;
    let measured: { width: number; height: number } | null = null;
    let relaxing = false;

    const measure = (box: DOMRect) => {
      centers = pieces.map(piece => {
        const rect = (piece.element.parentElement ?? piece.element).getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
      measured = { width: box.width, height: box.height };
    };

    const relax = (_time: number, deltaTime: number) => {
      const step = Math.min(deltaTime, 64) / 1000;
      let moving = false;
      pieces.forEach(piece => {
        const rate = piece.aim > piece.r ? 14 : 6;
        piece.r += (piece.aim - piece.r) * (1 - Math.exp(-rate * step));
        if (Math.abs(piece.aim - piece.r) > 0.001) moving = true;
        else piece.r = piece.aim;
      });
      render();
      if (!moving) {
        gsap.ticker.remove(relax);
        relaxing = false;
      }
    };

    const aim = () => {
      const box = root.getBoundingClientRect();
      const near =
        pointer &&
        pointer.x > box.left - safeRadius &&
        pointer.x < box.right + safeRadius &&
        pointer.y > box.top - safeRadius &&
        pointer.y < box.bottom + safeRadius;
      if (
        near &&
        (!centers || !measured || Math.abs(box.width - measured.width) + Math.abs(box.height - measured.height) > 1)
      ) {
        measure(box);
      }
      let changed = false;
      pieces.forEach((piece, index) => {
        let value = 0;
        if (near && pointer && centers) {
          const center = centers[index];
          const distance = Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) / safeRadius;
          if (distance < 1) value = 1 - distance * distance * (3 - 2 * distance);
        }
        if (value !== piece.aim) changed = true;
        piece.aim = value;
      });
      if (changed && !relaxing) {
        relaxing = true;
        gsap.ticker.add(relax);
      }
    };

    const handleMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };

    const handleLeave = () => {
      pointer = null;
      aim();
    };

    const handleScroll = () => {
      if (pointer) aim();
    };

    if (refold) {
      window.addEventListener('pointermove', handleMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.documentElement.addEventListener('pointerleave', handleLeave);
    }

    return () => {
      root.removeEventListener('mouseenter', handleEnter);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', handleLeave);
      gsap.ticker.remove(relax);
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(pieces);
    };
  });

  const rootStyle = (): JSX.CSSProperties => ({
    '--fold-text-font-size': typeof props.fontSize === 'number' ? `${props.fontSize}px` : (props.fontSize ?? '80px'),
    '--fold-text-font-weight': props.fontWeight ?? 500,
    '--fold-text-color': props.color ?? 'currentColor',
    '--fold-perspective': `${Math.max(120, props.perspective ?? 700)}px`,
    ...props.style
  });

  const renderPiece = (piece: PieceData, current: Layout) => (
    <span class="fold-text-segment" data-fold-split={piece.line ? 'line' : undefined}>
      {current.foldStyle === 'blinds' ? (
        <span
          class="fold-text-piece"
          data-fold-hinge={current.hinge}
          data-fold-style="blinds"
          style={current.startsFolded ? { opacity: 0 } : undefined}
        >
          <span class="fold-text-slat" data-fold-text={piece.content}>
            {piece.content}
          </span>
          <span class="fold-text-slat" data-fold-slat="b" data-fold-text={piece.content}>
            {piece.content}
          </span>
        </span>
      ) : (
        <span
          class="fold-text-piece"
          data-fold-hinge={current.hinge}
          data-fold-style={current.foldStyle}
          data-fold-text={piece.content}
          style={current.startsFolded ? { opacity: 0 } : undefined}
        >
          {piece.content}
        </span>
      )}
    </span>
  );

  const renderSegment = (segment: Segment, current: Layout): JSX.Element => {
    if (segment.kind === 'piece') return renderPiece(segment.piece, current);
    if (segment.kind === 'word') {
      return (
        <span class="fold-text-word">
          <For each={segment.pieces}>{piece => renderPiece(piece, current)}</For>
        </span>
      );
    }
    if (segment.kind === 'space') return segment.value;
    return <br />;
  };

  return (
    <span ref={el => (rootEl = el)} class={['fold-text', props.className]} style={rootStyle()}>
      <span class="fold-text-sr-only">{text()}</span>
      <span class="fold-text-visual" aria-hidden="true">
        <For each={[layout()]}>
          {current => <For each={current.segments}>{segment => renderSegment(segment, current)}</For>}
        </For>
      </span>
    </span>
  );
}
