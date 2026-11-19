import { Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { colorMode } from '@/hooks/useTheme';

export default function LazyCardMedia(props: { videoUrl: string; playing: boolean; title?: string }) {
  let wellEl: HTMLDivElement | undefined;
  let videoEl: HTMLVideoElement | undefined;
  const [visible, setVisible] = createSignal(false);
  const [videoIndex, setVideoIndex] = createSignal(0);
  const [posterIndex, setPosterIndex] = createSignal(0);
  let sourceErrors = 0;

  const plain = () => (props.videoUrl ? props.videoUrl.replace(/\.(webm|mp4)$/i, '') : '');
  const bases = createMemo(() => {
    if (!plain()) return [] as string[];
    return colorMode() === 'light' ? [`${plain()}-light`, plain()] : [plain()];
  });
  const videoBase = () => bases()[videoIndex()] ?? '';
  const posterBase = () => (videoBase() ? '' : (bases()[posterIndex()] ?? ''));

  const onSourceError = () => {
    sourceErrors += 1;
    if (sourceErrors < 2) return;
    sourceErrors = 0;
    setVideoIndex(index => index + 1);
  };

  const onLoadedMetadata = (event: Event) => {
    const video = event.currentTarget as HTMLVideoElement;
    if (props.playing) {
      video.play().catch(() => {});
      return;
    }
    if (video.currentTime === 0) video.currentTime = 0.1;
  };

  createEffect(
    bases,
    () => {
      sourceErrors = 0;
      setVideoIndex(0);
      setPosterIndex(0);
    },
    { defer: true }
  );

  createEffect(
    () => props.playing,
    playing => {
      const video = videoEl;
      if (!video) return;
      if (playing) video.play().catch(() => {});
      else video.pause();
    }
  );

  onSettled(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (wellEl) observer.observe(wellEl);
    return () => {
      observer.disconnect();
      videoEl?.pause();
    };
  });

  return (
    <div ref={el => (wellEl = el)} class="browse-card-well">
      <Show when={visible()}>
        <Show
          when={videoBase()}
          keyed
          fallback={
            <Show when={posterBase()} keyed>
              {base => (
                <img src={`${base}.webp`} alt="" class="browse-card-video" onError={() => setPosterIndex(i => i + 1)} />
              )}
            </Show>
          }
        >
          {base => (
            <video
              ref={el => (videoEl = el)}
              loop
              muted
              playsinline
              preload="metadata"
              poster={`${base}.webp`}
              class="browse-card-video"
              onLoadedMetadata={onLoadedMetadata}
            >
              <source src={`${base}.webm`} type="video/webm" onError={onSourceError} />
              <source src={`${base}.mp4`} type="video/mp4" onError={onSourceError} />
            </video>
          )}
        </Show>
      </Show>
      <Show when={!videoBase() && !posterBase()}>
        <div class="browse-card-empty" aria-hidden="true">
          <span>{`<${(props.title || '').replace(/\s+/g, '')} />`}</span>
        </div>
      </Show>
    </div>
  );
}
