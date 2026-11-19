import { createSignal } from 'solid-js';

const [isSearchOpen, setSearchOpen] = createSignal(false);
const [mounted, setMounted] = createSignal(false);

const openSearch = () => {
  setMounted(true);
  setSearchOpen(true);
};
const closeSearch = () => setSearchOpen(false);
const toggleSearch = () => {
  if (isSearchOpen()) closeSearch();
  else openSearch();
};

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

let installed = false;

export function installSearchShortcut() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', event => {
    const commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (commandK) {
      event.preventDefault();
      toggleSearch();
      return;
    }
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (isTypingTarget(event.target) && !isSearchOpen()) return;
      event.preventDefault();
      toggleSearch();
      return;
    }
    if (event.key === 'Escape' && isSearchOpen()) closeSearch();
  });
}

export function useSearch() {
  return { isSearchOpen, mounted, openSearch, closeSearch, toggleSearch };
}
