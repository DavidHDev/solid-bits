import { createEffect, createMemo, createSignal, onSettled, type Accessor } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { getBackgroundLightProps } from '@/constants/backgroundThemeProps';
import { colorMode } from './useTheme';

type Parser = {
  parse: (value: string | null) => unknown;
  serialize: (value: unknown) => string;
};

const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(value);

const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b;

const createParser = (defaultValue: unknown): Parser => {
  if (Array.isArray(defaultValue)) {
    return {
      parse: v =>
        v === null || v === ''
          ? null
          : v.split(',').map(item => (isHexColor(item) && !item.startsWith('#') ? `#${item}` : item)),
      serialize: v =>
        Array.isArray(v) ? v.map(item => (isHexColor(item) ? item.replace(/^#/, '') : item)).join(',') : String(v)
    };
  }
  if (typeof defaultValue === 'number') {
    return {
      parse: v => (v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v)),
      serialize: v => String(v)
    };
  }
  if (typeof defaultValue === 'boolean') {
    return {
      parse: v => (v === 'true' ? true : v === 'false' ? false : null),
      serialize: v => String(v)
    };
  }
  if (typeof defaultValue === 'string' && defaultValue.startsWith('#') && isHexColor(defaultValue)) {
    return {
      parse: v => (v === null || v === '' ? null : isHexColor(v) ? `#${v.replace(/^#/, '')}` : v),
      serialize: v => (isHexColor(v) ? v.replace(/^#/, '') : String(v))
    };
  }
  return {
    parse: v => (v === null || v === '' ? null : v),
    serialize: v => String(v)
  };
};

const URL_THROTTLE_MS = 50;

export type ComponentPropsApi<T extends Record<string, unknown>> = {
  props: Accessor<T>;
  defaultProps: Accessor<T>;
  updateProp: <K extends keyof T>(name: K, value: T[K]) => void;
  updateProps: (updates: Partial<T>) => void;
  resetProps: () => void;
  hasChanges: Accessor<boolean>;
  getShareUrl: () => string;
};

export function useComponentProps<T extends Record<string, unknown>>(defaultProps: T): ComponentPropsApi<T> {
  const location = useLocation();
  const navigate = useNavigate();
  const baseDefaults = { ...defaultProps };
  const keys = Object.keys(baseDefaults);
  const lightProps = getBackgroundLightProps(window.location.pathname);

  const parsers: Record<string, Parser> = {};
  for (const key of keys) parsers[key] = createParser(baseDefaults[key]);

  const readQuery = (search: string) => {
    const params = new URLSearchParams(search);
    const state: Record<string, unknown> = {};
    for (const key of keys) {
      const parsed = parsers[key].parse(params.get(key));
      if (parsed !== null) state[key] = parsed;
    }
    return state;
  };

  const serializeState = (state: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const key of keys) if (key in state) out[key] = parsers[key].serialize(state[key]);
    return out;
  };

  const initial = readQuery(window.location.search);
  const [overrides, setOverrides] = createSignal<Record<string, unknown>>(initial);
  let lastWritten = JSON.stringify(serializeState(initial));
  let timer: ReturnType<typeof setTimeout> | undefined;

  const effectiveDefaultProps = createMemo<T>(() =>
    colorMode() === 'light' && lightProps ? ({ ...baseDefaults, ...lightProps } as T) : baseDefaults
  );

  const props = createMemo<T>(() => ({ ...effectiveDefaultProps(), ...overrides() }) as T);
  const hasChanges = createMemo(() => Object.keys(overrides()).length > 0);

  let pending: Record<string, unknown> = initial;

  const flushUrl = () => {
    timer = undefined;
    const serialized = serializeState(pending);
    const params = new URLSearchParams(window.location.search);
    for (const key of keys) params.delete(key);
    for (const [key, value] of Object.entries(serialized)) params.set(key, value);
    lastWritten = JSON.stringify(serialized);
    const query = params.toString();
    navigate(`${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`, {
      replace: true,
      scroll: false
    });
  };

  const scheduleUrl = () => {
    if (timer) return;
    timer = setTimeout(flushUrl, URL_THROTTLE_MS);
  };

  const commit = (next: Record<string, unknown>) => {
    pending = next;
    setOverrides(next);
    scheduleUrl();
  };

  const applyPatch = (patch: Record<string, unknown>) => {
    const next = { ...pending };
    const defaults = effectiveDefaultProps();
    for (const [name, value] of Object.entries(patch)) {
      if (!keys.includes(name)) continue;
      if (value === null || value === undefined || sameValue(value, defaults[name])) delete next[name];
      else next[name] = value;
    }
    commit(next);
  };

  const updateProp = <K extends keyof T>(name: K, value: T[K]) => applyPatch({ [name as string]: value });
  const updateProps = (updates: Partial<T>) => applyPatch(updates as Record<string, unknown>);
  const resetProps = () => commit({});
  const getShareUrl = () => window.location.href;

  createEffect(
    () => location.search,
    search => {
      if (timer) return;
      const current = readQuery(search);
      const serialized = JSON.stringify(serializeState(current));
      if (serialized === lastWritten) return;
      lastWritten = serialized;
      pending = current;
      setOverrides(current);
    }
  );

  onSettled(() => () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  });

  return { props, defaultProps: effectiveDefaultProps, updateProp, updateProps, resetProps, hasChanges, getShareUrl };
}

export default useComponentProps;
