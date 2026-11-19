import { Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import CTA from '@/components/landing/CTA/CTA';
import FAQ from '@/components/landing/FAQ/FAQ';
import Features from '@/components/landing/Features/Features';
import Footer from '@/components/landing/Footer/Footer';
import Hero from '@/components/landing/Hero/Hero';
import HowItWorks from '@/components/landing/HowItWorks/HowItWorks';
import LandingLoader from '@/components/landing/LandingLoader/LandingLoader';
import LiveDemo from '@/components/landing/LiveDemo/LiveDemo';
import Navbar from '@/components/landing/Navbar/Navbar';
import ProSpotlight from '@/components/landing/ProSpotlight/ProSpotlight';
import Tools from '@/components/landing/Tools/Tools';
import { usePauseOffscreenAnimations } from '@/components/landing/hooks/usePauseOffscreenAnimations';

const MIN_LOADER_MS = 800;
const MAX_FONT_WAIT_MS = 2500;
const LOADER_FADE_MS = 600;
const LOADING_ATTR = 'data-sb-landing-loading';

type Phase = 'loading' | 'revealing' | 'ready';

export default function LandingPage() {
  const [phase, setPhase] = createSignal<Phase>('loading');
  const [hidingLoader, setHidingLoader] = createSignal(false);
  const ready = createMemo(() => phase() === 'ready');

  usePauseOffscreenAnimations(() => phase() !== 'loading');

  createEffect(ready, isReady => {
    if (isReady) document.documentElement.removeAttribute(LOADING_ATTR);
    else document.documentElement.setAttribute(LOADING_ATTR, '');
  });

  createEffect(phase, value => {
    if (value !== 'revealing') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('ready');
      return;
    }
    let secondFrame = 0;
    let fadeTimer = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setHidingLoader(true);
        fadeTimer = window.setTimeout(() => setPhase('ready'), LOADER_FADE_MS);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fadeTimer);
    };
  });

  onSettled(() => {
    document.title = 'Solid Bits - Animated UI Components For Solid';
    window.scrollTo(0, 0);
    let cancelled = false;
    let minimumTimer = 0;
    let fontTimer = 0;
    const started = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fontDeadline = new Promise<void>(resolve => {
      fontTimer = window.setTimeout(resolve, MAX_FONT_WAIT_MS);
    });
    const reveal = () => setPhase(reducedMotion ? 'ready' : 'revealing');

    Promise.race([document.fonts?.ready ?? Promise.resolve(), fontDeadline])
      .catch(() => {})
      .then(() => {
        window.clearTimeout(fontTimer);
        if (cancelled) return;
        const remaining = reducedMotion ? 0 : Math.max(0, MIN_LOADER_MS - (performance.now() - started));
        if (remaining > 0) minimumTimer = window.setTimeout(reveal, remaining);
        else reveal();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fontTimer);
      document.documentElement.removeAttribute(LOADING_ATTR);
    };
  });

  return (
    <>
      <Show when={!ready()}>
        <LandingLoader hiding={hidingLoader()} />
      </Show>
      <section
        class={['landing-wrapper no-side-fades', phase() === 'loading' ? 'ln-loading' : 'ln-loaded']}
        inert={!ready()}
      >
        <Navbar />
        <Hero />
        <Features />
        <LiveDemo />
        <HowItWorks />
        <ProSpotlight />
        <Tools />
        <FAQ />
        <Footer lead={<CTA />} />
      </section>
    </>
  );
}
