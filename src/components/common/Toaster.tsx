import { For } from 'solid-js';
import { dismissToast, toastList } from '@/hooks/useToast';

export default function Toaster() {
  return (
    <div class="sb-toaster" aria-live="polite" role="status">
      <For each={toastList()}>
        {toast => (
          <div
            class="sb-toast"
            data-severity={toast.severity}
            data-leaving={toast.leaving ? '' : undefined}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.summary}
          </div>
        )}
      </For>
    </div>
  );
}
