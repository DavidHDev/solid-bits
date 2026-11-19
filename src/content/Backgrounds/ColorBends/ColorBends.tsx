import { createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import * as THREE from 'three';
import './ColorBends.css';

export interface ColorBendsProps {
  className?: string;
  style?: JSX.CSSProperties;
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  iterations?: number;
  intensity?: number;
  bandWidth?: number;
}

type Settings = {
  rotation: number;
  autoRotate: number;
  speed: number;
  colors: string[];
  transparent: boolean;
  scale: number;
  frequency: number;
  warpStrength: number;
  mouseInfluence: number;
  parallax: number;
  noise: number;
  iterations: number;
  intensity: number;
  bandWidth: number;
};

const MAX_COLORS = 8 as const;

const frag = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 shift = vec2(0.2 * cos(t) - 7.56);
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
      shift *= 0.85;
    }

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
            if (i >= uColorCount) break;
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float spare = 1.0 - kBelow * gain;
            if (spare != 0.0) warped -= shift * spare;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float m = mix(m0, m1, kMix);
            float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
            sumCol += uColors[i] * w;
            cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float spare = 1.0 - kBelow * gain;
            if (spare != 0.0) warped -= shift * spare;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float m = mix(m0, m1, kMix);
            col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
    }

    col *= uIntensity;

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const toVec3 = (hex: string) => {
  const h = hex.replace('#', '').trim();
  const v =
    h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
};

export default function ColorBends(props: ColorBendsProps) {
  let containerEl: HTMLDivElement | undefined;
  let current!: Settings;
  let applyFn: ((value: Settings) => void) | null = null;

  const settings = createMemo<Settings>(() => ({
    rotation: props.rotation ?? 90,
    autoRotate: props.autoRotate ?? 0,
    speed: props.speed ?? 0.2,
    colors: props.colors ?? [],
    transparent: props.transparent ?? true,
    scale: props.scale ?? 1,
    frequency: props.frequency ?? 1,
    warpStrength: props.warpStrength ?? 1,
    mouseInfluence: props.mouseInfluence ?? 1,
    parallax: props.parallax ?? 0.5,
    noise: props.noise ?? 0.15,
    iterations: props.iterations ?? 1,
    intensity: props.intensity ?? 1.5,
    bandWidth: props.bandWidth ?? 6
  }));

  createEffect(settings, value => {
    current = value;
    applyFn?.(value);
  });

  onSettled(() => {
    current = settings();
    const container = containerEl;
    if (!container) return;
    const initial = current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0));
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: initial.speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: 0 },
        uColors: { value: uColorsArray },
        uTransparent: { value: initial.transparent ? 1 : 0 },
        uScale: { value: initial.scale },
        uFrequency: { value: initial.frequency },
        uWarpStrength: { value: initial.warpStrength },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uMouseInfluence: { value: initial.mouseInfluence },
        uParallax: { value: initial.parallax },
        uNoise: { value: initial.noise },
        uIterations: { value: initial.iterations },
        uIntensity: { value: initial.intensity },
        uBandWidth: { value: initial.bandWidth }
      },
      premultipliedAlpha: true,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, initial.transparent ? 0 : 1);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);
    const pointerSmooth = 8;

    const apply = (s: Settings) => {
      material.uniforms.uSpeed.value = s.speed;
      material.uniforms.uScale.value = s.scale;
      material.uniforms.uFrequency.value = s.frequency;
      material.uniforms.uWarpStrength.value = s.warpStrength;
      material.uniforms.uMouseInfluence.value = s.mouseInfluence;
      material.uniforms.uParallax.value = s.parallax;
      material.uniforms.uNoise.value = s.noise;
      material.uniforms.uIterations.value = s.iterations;
      material.uniforms.uIntensity.value = s.intensity;
      material.uniforms.uBandWidth.value = s.bandWidth;

      const arr = (s.colors || []).filter(Boolean).slice(0, MAX_COLORS).map(toVec3);
      for (let i = 0; i < MAX_COLORS; i++) {
        const vec = (material.uniforms.uColors.value as THREE.Vector3[])[i];
        if (i < arr.length) vec.copy(arr[i]);
        else vec.set(0, 0, 0);
      }
      material.uniforms.uColorCount.value = arr.length;

      material.uniforms.uTransparent.value = s.transparent ? 1 : 0;
      renderer.setClearColor(0x000000, s.transparent ? 0 : 1);
    };
    apply(initial);
    applyFn = apply;

    const clock = new THREE.Clock();

    const handleResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      (material.uniforms.uCanvas.value as THREE.Vector2).set(w, h);
      renderer.render(scene, camera);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let elapsed = 0;
    let visible = true;
    let resumed = false;
    let raf: number | null = null;

    const loop = () => {
      raf = null;
      if (!visible || document.hidden) return;
      const delta = clock.getDelta();
      const dt = resumed ? 0 : delta;
      resumed = false;
      elapsed += dt;
      material.uniforms.uTime.value = elapsed;

      const deg = (current.rotation % 360) + current.autoRotate * elapsed;
      const rad = (deg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      (material.uniforms.uRot.value as THREE.Vector2).set(c, s);

      const amt = Math.min(1, dt * pointerSmooth);
      pointerCurrent.lerp(pointerTarget, amt);
      (material.uniforms.uPointer.value as THREE.Vector2).copy(pointerCurrent);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (raf !== null || !visible || document.hidden) return;
      resumed = true;
      raf = requestAnimationFrame(loop);
    };

    const handleVisibility = () => {
      if (document.hidden) return;
      resumed = true;
      wake();
    };

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    visibility.observe(container);
    document.addEventListener('visibilitychange', handleVisibility);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
      pointerTarget.set(x, y);
    };
    container.addEventListener('pointermove', handlePointerMove);

    raf = requestAnimationFrame(loop);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      applyFn = null;
      visibility.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      container.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  });

  return <div ref={el => (containerEl = el)} class={['color-bends-container', props.className]} style={props.style} />;
}
