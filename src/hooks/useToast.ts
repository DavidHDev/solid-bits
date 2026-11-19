import { createSignal } from 'solid-js';

export type ToastSeverity = 'success' | 'error' | 'secondary' | 'info';

export type ToastItem = { id: number; severity: ToastSeverity; summary: string; leaving: boolean };

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let counter = 0;

const LEAVE_MS = 220;

export const toastList = toasts;

export function dismissToast(id: number) {
  setToasts(list => list.map(item => (item.id === id ? { ...item, leaving: true } : item)));
  setTimeout(() => setToasts(list => list.filter(item => item.id !== id)), LEAVE_MS);
}

export function addToast(toast: { severity?: ToastSeverity; summary: string; life?: number }) {
  counter += 1;
  const id = counter;
  setToasts(list => [
    ...list.slice(-3),
    { id, severity: toast.severity ?? 'info', summary: toast.summary, leaving: false }
  ]);
  setTimeout(() => dismissToast(id), toast.life ?? 3000);
  return id;
}

export function useToast() {
  return { add: addToast, dismiss: dismissToast };
}
