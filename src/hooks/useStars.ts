import { createSignal, onSettled } from 'solid-js';
import { GITHUB_STARS_ENABLED } from '@/constants/cli';
import { getStarsCount } from '@/utils/utils';

const CACHE_KEY = 'github_stars_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useStars() {
  const [stars, setStars] = createSignal(0);

  onSettled(() => {
    if (!GITHUB_STARS_ENABLED) return;
    let active = true;
    const run = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { count, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            if (active) setStars(count);
            return;
          }
        }
        const count = await getStarsCount();
        localStorage.setItem(CACHE_KEY, JSON.stringify({ count, timestamp: Date.now() }));
        if (active) setStars(count);
      } catch {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData && active) setStars(JSON.parse(cachedData).count);
      }
    };
    run();
    return () => {
      active = false;
    };
  });

  return stars;
}
