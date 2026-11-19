import { For, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Gesture } from '@use-gesture/vanilla';
import './DomeGallery.css';

type ImageItem = string | { src: string; alt?: string };

export type DomeGalleryProps = {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
};

type ItemDef = {
  src: string;
  alt: string;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
};

type Settings = {
  fit: number;
  fitBasis: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius: number;
  maxRadius: number;
  padFactor: number;
  overlayBlurColor: string;
  maxVerticalRotationDeg: number;
  dragSensitivity: number;
  enlargeTransitionMs: number;
  segments: number;
  dragDampening: number;
  openedImageWidth: string;
  openedImageHeight: string;
  imageBorderRadius: string;
  openedImageBorderRadius: string;
  grayscale: boolean;
};

const DEFAULT_IMAGES: ImageItem[] = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Abstract art'
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Modern sculpture'
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Digital artwork'
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Contemporary art'
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Geometric pattern'
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Textured surface'
  },
  {
    src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large',
    alt: 'Social media image'
  }
];

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
    );
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt
  }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery(props: DomeGalleryProps) {
  let rootEl: HTMLDivElement | undefined;
  let mainEl: HTMLElement | undefined;
  let sphereEl: HTMLDivElement | undefined;
  let frameEl: HTMLDivElement | undefined;
  let viewerEl: HTMLDivElement | undefined;
  let scrimEl: HTMLDivElement | undefined;
  let focusedEl: HTMLElement | null = null;
  let originalTilePosition: { left: number; top: number; width: number; height: number } | null = null;

  let rotation = { x: 0, y: 0 };
  let startRot = { x: 0, y: 0 };
  let startPos: { x: number; y: number } | null = null;
  let dragging = false;
  let moved = false;
  let inertiaRAF: number | null = null;

  let opening = false;
  let openStartedAt = 0;
  let lastDragEndAt = 0;

  let scrollLocked = false;
  let current!: Settings;
  let relayout: (() => void) | null = null;

  const settings = createMemo<Settings>(() => ({
    fit: props.fit ?? 0.5,
    fitBasis: props.fitBasis ?? 'auto',
    minRadius: props.minRadius ?? 600,
    maxRadius: props.maxRadius ?? Infinity,
    padFactor: props.padFactor ?? 0.25,
    overlayBlurColor: props.overlayBlurColor ?? '#0c0f13',
    maxVerticalRotationDeg: props.maxVerticalRotationDeg ?? DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity: props.dragSensitivity ?? DEFAULTS.dragSensitivity,
    enlargeTransitionMs: props.enlargeTransitionMs ?? DEFAULTS.enlargeTransitionMs,
    segments: props.segments ?? DEFAULTS.segments,
    dragDampening: props.dragDampening ?? 2,
    openedImageWidth: props.openedImageWidth ?? '400px',
    openedImageHeight: props.openedImageHeight ?? '400px',
    imageBorderRadius: props.imageBorderRadius ?? '30px',
    openedImageBorderRadius: props.openedImageBorderRadius ?? '30px',
    grayscale: props.grayscale ?? true
  }));

  createEffect(settings, value => {
    current = value;
    relayout?.();
  });

  const imagePool = createMemo(() => props.images ?? DEFAULT_IMAGES);
  const segmentCount = createMemo(() => props.segments ?? DEFAULTS.segments);
  const items = createMemo(() => buildItems(imagePool(), segmentCount()));

  const lockScroll = () => {
    if (scrollLocked) return;
    scrollLocked = true;
    document.body.classList.add('dg-scroll-lock');
  };
  const unlockScroll = () => {
    if (!scrollLocked) return;
    if (rootEl?.getAttribute('data-enlarging') === 'true') return;
    scrollLocked = false;
    document.body.classList.remove('dg-scroll-lock');
  };

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereEl;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const stopInertia = () => {
    if (inertiaRAF) {
      cancelAnimationFrame(inertiaRAF);
      inertiaRAF = null;
    }
  };

  const startInertia = (vx: number, vy: number) => {
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = clamp(vy, -MAX_V, MAX_V) * 80;

    let frames = 0;
    const d = clamp(current.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        inertiaRAF = null;
        return;
      }
      if (++frames > maxFrames) {
        inertiaRAF = null;
        return;
      }
      const maxRot = current.maxVerticalRotationDeg;
      const nextX = clamp(rotation.x - vY / 200, -maxRot, maxRot);
      const nextY = wrapAngleSigned(rotation.y + vX / 200);
      rotation = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
      inertiaRAF = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF = requestAnimationFrame(step);
  };

  const openItemFromElement = (el: HTMLElement) => {
    if (opening) return;
    opening = true;
    openStartedAt = performance.now();
    lockScroll();

    const { segments, enlargeTransitionMs, openedImageWidth, openedImageHeight } = current;
    const parent = el.parentElement as HTMLElement;
    focusedEl = el;
    el.setAttribute('data-focused', 'true');

    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);

    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const parentY = normalizeAngle(parentRot.rotateY);
    const globalY = normalizeAngle(rotation.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - rotation.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    void refDiv.offsetHeight;

    const tileR = refDiv.getBoundingClientRect();
    const mainR = mainEl?.getBoundingClientRect();
    const frameR = frameEl?.getBoundingClientRect();

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      opening = false;
      focusedEl = null;
      parent.removeChild(refDiv);
      unlockScroll();
      return;
    }

    originalTilePosition = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height
    };

    el.style.visibility = 'hidden';
    el.style.zIndex = '0';

    const overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.position = 'absolute';
    overlay.style.left = frameR.left - mainR.left + 'px';
    overlay.style.top = frameR.top - mainR.top + 'px';
    overlay.style.width = frameR.width + 'px';
    overlay.style.height = frameR.height + 'px';
    overlay.style.opacity = '0';
    overlay.style.zIndex = '30';
    overlay.style.willChange = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;

    const rawSrc = parent.dataset.src || (el.querySelector('img') as HTMLImageElement)?.src || '';
    const img = document.createElement('img');
    img.src = rawSrc;
    overlay.appendChild(img);
    viewerEl!.appendChild(overlay);

    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;

    const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

    setTimeout(() => {
      if (!overlay.parentElement) return;
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
      rootEl?.setAttribute('data-enlarging', 'true');
    }, 16);

    const wantsResize = openedImageWidth || openedImageHeight;
    if (wantsResize) {
      const onFirstEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return;
        overlay.removeEventListener('transitionend', onFirstEnd);
        const prevTransition = overlay.style.transition;
        overlay.style.transition = 'none';
        const tempWidth = openedImageWidth || `${frameR.width}px`;
        const tempHeight = openedImageHeight || `${frameR.height}px`;
        overlay.style.width = tempWidth;
        overlay.style.height = tempHeight;
        const newRect = overlay.getBoundingClientRect();
        overlay.style.width = frameR.width + 'px';
        overlay.style.height = frameR.height + 'px';
        void overlay.offsetWidth;
        overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
        const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
        const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`;
          overlay.style.top = `${centeredTop}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
        });
        const cleanupSecond = () => {
          overlay.removeEventListener('transitionend', cleanupSecond);
          overlay.style.transition = prevTransition;
        };
        overlay.addEventListener('transitionend', cleanupSecond, {
          once: true
        });
      };
      overlay.addEventListener('transitionend', onFirstEnd);
    }
  };

  const onTileClick = (el: HTMLElement) => {
    if (dragging) return;
    if (moved) return;
    if (performance.now() - lastDragEndAt < 80) return;
    if (opening) return;
    openItemFromElement(el);
  };

  const onTilePointerUp = (e: PointerEvent, el: HTMLElement) => {
    if (e.pointerType !== 'touch') return;
    if (dragging) return;
    if (moved) return;
    if (performance.now() - lastDragEndAt < 80) return;
    if (opening) return;
    openItemFromElement(el);
  };

  onSettled(() => {
    current = settings();
    const root = rootEl;
    const main = mainEl;
    const scrim = scrimEl;
    if (!root || !main || !scrim) return;

    let lastWidth = 1;
    let lastHeight = 1;

    const layout = () => {
      const { fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale } = current;
      const { imageBorderRadius, openedImageBorderRadius, openedImageWidth, openedImageHeight } = current;
      const w = lastWidth,
        h = lastHeight;
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      const lockedRadius = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty('--radius', `${lockedRadius}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotation.x, rotation.y);

      const enlargedOverlay = viewerEl?.querySelector('.enlarge') as HTMLElement | null;
      if (enlargedOverlay && frameEl && mainEl) {
        const frameR = frameEl.getBoundingClientRect();
        const mainR = mainEl.getBoundingClientRect();

        const hasCustomSize = openedImageWidth && openedImageHeight;
        if (hasCustomSize) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

          enlargedOverlay.style.left = `${centeredLeft}px`;
          enlargedOverlay.style.top = `${centeredTop}px`;
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
          enlargedOverlay.style.width = `${frameR.width}px`;
          enlargedOverlay.style.height = `${frameR.height}px`;
        }
      }
    };

    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      lastWidth = Math.max(1, cr.width);
      lastHeight = Math.max(1, cr.height);
      layout();
    });
    ro.observe(root);
    relayout = layout;
    applyTransform(rotation.x, rotation.y);

    const gesture = new Gesture(
      main,
      {
        onDragStart: ({ event }) => {
          if (focusedEl) return;
          stopInertia();
          const evt = event as PointerEvent;
          dragging = true;
          moved = false;
          startRot = { ...rotation };
          startPos = { x: evt.clientX, y: evt.clientY };
        },
        onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
          if (focusedEl || !dragging || !startPos) return;

          const { dragSensitivity, maxVerticalRotationDeg } = current;
          const evt = event as PointerEvent;
          const dxTotal = evt.clientX - startPos.x;
          const dyTotal = evt.clientY - startPos.y;

          if (!moved) {
            const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
            if (dist2 > 16) moved = true;
          }

          const nextX = clamp(startRot.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
          const nextY = wrapAngleSigned(startRot.y + dxTotal / dragSensitivity);

          if (rotation.x !== nextX || rotation.y !== nextY) {
            rotation = { x: nextX, y: nextY };
            applyTransform(nextX, nextY);
          }

          if (last) {
            dragging = false;

            const [vMagX, vMagY] = velocity;
            const [dirX, dirY] = direction;
            let vx = vMagX * dirX;
            let vy = vMagY * dirY;

            if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
              const [mx, my] = movement;
              vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
              vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
            }

            if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
              startInertia(vx, vy);
            }

            if (moved) lastDragEndAt = performance.now();

            moved = false;
          }
        }
      },
      { eventOptions: { passive: true } }
    );

    const close = () => {
      if (performance.now() - openStartedAt < 250) return;

      const el = focusedEl;
      if (!el) return;
      const enlargeTransitionMs = current.enlargeTransitionMs;
      const parent = el.parentElement as HTMLElement;
      const overlay = viewerEl?.querySelector('.enlarge') as HTMLElement | null;
      if (!overlay) return;

      const refDiv = parent.querySelector('.item__image--reference') as HTMLElement | null;

      const originalPos = originalTilePosition;
      if (!originalPos) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', `0deg`);
        parent.style.setProperty('--rot-x-delta', `0deg`);
        el.style.visibility = '';
        el.style.zIndex = '0';
        focusedEl = null;
        rootEl?.removeAttribute('data-enlarging');
        opening = false;
        unlockScroll();
        return;
      }

      const currentRect = overlay.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();

      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height
      };

      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height
      };

      const animatingOverlay = document.createElement('div');
      animatingOverlay.className = 'enlarge-closing';
      animatingOverlay.style.cssText = `
        position: absolute;
        left: ${overlayRelativeToRoot.left}px;
        top: ${overlayRelativeToRoot.top}px;
        width: ${overlayRelativeToRoot.width}px;
        height: ${overlayRelativeToRoot.height}px;
        z-index: 9999;
        border-radius: var(--enlarge-radius, 32px);
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: all ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        margin: 0;
        transform: none;
      `;

      const originalImg = overlay.querySelector('img');
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        animatingOverlay.appendChild(img);
      }

      overlay.remove();
      root.appendChild(animatingOverlay);

      void animatingOverlay.getBoundingClientRect();

      requestAnimationFrame(() => {
        animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
        animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
        animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
        animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
        animatingOverlay.style.opacity = '0';
      });

      const cleanup = () => {
        animatingOverlay.remove();
        originalTilePosition = null;

        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition = 'none';

        parent.style.setProperty('--rot-y-delta', `0deg`);
        parent.style.setProperty('--rot-x-delta', `0deg`);

        requestAnimationFrame(() => {
          el.style.visibility = '';
          el.style.opacity = '0';
          el.style.zIndex = '0';
          focusedEl = null;
          rootEl?.removeAttribute('data-enlarging');

          requestAnimationFrame(() => {
            parent.style.transition = '';
            el.style.transition = 'opacity 300ms ease-out';

            requestAnimationFrame(() => {
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
                el.style.opacity = '';
                opening = false;
                if (!dragging && rootEl?.getAttribute('data-enlarging') !== 'true') {
                  document.body.classList.remove('dg-scroll-lock');
                }
              }, 300);
            });
          });
        });
      };

      animatingOverlay.addEventListener('transitionend', cleanup, {
        once: true
      });
    };

    scrim.addEventListener('click', close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      relayout = null;
      ro.disconnect();
      gesture.destroy();
      stopInertia();
      scrim.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('dg-scroll-lock');
    };
  });

  const rootStyle = (): JSX.CSSProperties => {
    const s = settings();
    return {
      '--segments-x': String(s.segments),
      '--segments-y': String(s.segments),
      '--overlay-blur-color': s.overlayBlurColor,
      '--tile-radius': s.imageBorderRadius,
      '--enlarge-radius': s.openedImageBorderRadius,
      '--image-filter': s.grayscale ? 'grayscale(1)' : 'none'
    };
  };

  return (
    <div ref={el => (rootEl = el)} class="sphere-root" style={rootStyle()}>
      <main ref={el => (mainEl = el)} class="sphere-main">
        <div class="stage">
          <div ref={el => (sphereEl = el)} class="sphere">
            <For each={items()}>
              {it => {
                let tileEl!: HTMLDivElement;
                return (
                  <div
                    class="item"
                    data-src={it.src}
                    data-offset-x={it.x}
                    data-offset-y={it.y}
                    data-size-x={it.sizeX}
                    data-size-y={it.sizeY}
                    style={{
                      '--offset-x': String(it.x),
                      '--offset-y': String(it.y),
                      '--item-size-x': String(it.sizeX),
                      '--item-size-y': String(it.sizeY)
                    }}
                  >
                    <div
                      ref={el => (tileEl = el)}
                      class="item__image"
                      role="button"
                      tabindex={0}
                      aria-label={it.alt || 'Open image'}
                      onClick={() => onTileClick(tileEl)}
                      onPointerUp={e => onTilePointerUp(e, tileEl)}
                    >
                      <img src={it.src} draggable="false" alt={it.alt} />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <div class="overlay" />
        <div class="overlay overlay--blur" />
        <div class="edge-fade edge-fade--top" />
        <div class="edge-fade edge-fade--bottom" />

        <div class="viewer" ref={el => (viewerEl = el)}>
          <div ref={el => (scrimEl = el)} class="scrim" />
          <div ref={el => (frameEl = el)} class="frame" />
        </div>
      </main>
    </div>
  );
}
