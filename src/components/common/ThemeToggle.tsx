import { Show } from 'solid-js';
import { MoonIcon, SunIcon } from '@/components/icons/Icons';
import { isLight, toggleColorMode } from '@/hooks/useTheme';

export default function ThemeToggle() {
  return (
    <button
      type="button"
      class="ln-navbar-icon-btn ln-navbar-theme-btn"
      aria-label={isLight() ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight() ? 'Dark mode' : 'Light mode'}
      onClick={toggleColorMode}
    >
      <Show when={isLight()} fallback={<SunIcon size={16} />}>
        <MoonIcon size={16} />
      </Show>
    </button>
  );
}
