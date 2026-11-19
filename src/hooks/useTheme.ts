import { createSignal } from 'solid-js';

export type ColorMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'solid-bits-theme';

const readInitial = (): ColorMode => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
};

const [mode, setMode] = createSignal<ColorMode>(readInitial());

const disableTransitions = () => {
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode(
      '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
    )
  );
  document.head.appendChild(style);
  return () => {
    void window.getComputedStyle(document.body).opacity;
    setTimeout(() => document.head.removeChild(style), 1);
  };
};

export const colorMode = mode;
export const isLight = () => mode() === 'light';
export const isDark = () => mode() === 'dark';

export function setColorMode(next: ColorMode) {
  if (next !== 'dark' && next !== 'light') return;
  setMode(next);
  if (typeof document === 'undefined') return;
  const restore = disableTransitions();
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  restore();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    return;
  }
}

export function toggleColorMode() {
  setColorMode(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

let shortcutInstalled = false;

export function installThemeShortcut() {
  if (shortcutInstalled || typeof window === 'undefined') return;
  shortcutInstalled = true;

  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== 'd' && key !== 't') return;
    const target = event.target;
    const isEditing =
      target instanceof Element &&
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"]'
      );
    if (isEditing) return;
    event.preventDefault();
    toggleColorMode();
  });

  window.addEventListener('storage', event => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const next = event.newValue === 'light' ? 'light' : 'dark';
    if (next !== readInitial()) setColorMode(next);
  });
}

export function useColorMode() {
  return { colorMode, isLight, isDark, setColorMode, toggleColorMode };
}

export function useColorModeValue<T>(light: T | (() => T), dark: T | (() => T)) {
  const read = (value: T | (() => T)) => (typeof value === 'function' ? (value as () => T)() : value);
  return () => (mode() === 'dark' ? read(dark) : read(light));
}
