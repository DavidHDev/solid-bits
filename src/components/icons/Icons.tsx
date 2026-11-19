import type { JSX } from '@solidjs/web';

type IconProps = { size?: number; class?: string; color?: string; strokeWidth?: number };

const Lucide = (props: IconProps & { children: JSX.Element }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color ?? 'currentColor'}
    stroke-width={props.strokeWidth ?? 2}
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
    aria-hidden="true"
  >
    {props.children}
  </svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Lucide>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Lucide>
);

export const ArrowUpIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Lucide>
);

export const RotateCcwIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </Lucide>
);

export const MinusIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M5 12h14" />
  </Lucide>
);

export const PlusIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Lucide>
);

export const CheckIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Lucide>
);

export const CopyIcon = (props: IconProps) => (
  <Lucide {...props}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Lucide>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="m6 9 6 6 6-6" />
  </Lucide>
);

export const LayoutGridIcon = (props: IconProps) => (
  <Lucide {...props}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </Lucide>
);

export const SearchIcon = (props: IconProps) => (
  <Lucide {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Lucide>
);

export const MoonIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Lucide>
);

export const SunIcon = (props: IconProps) => (
  <Lucide {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Lucide>
);

export const GripVerticalIcon = (props: IconProps) => (
  <Lucide {...props}>
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </Lucide>
);

export const TrashIcon = (props: IconProps) => (
  <Lucide {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Lucide>
);

export const HeartIcon = (props: IconProps & { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 24 24"
    fill={props.filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
    aria-hidden="true"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export const VercelIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 24 24"
    fill="currentColor"
    class={props.class}
    aria-hidden="true"
  >
    <path d="M24 22.525H0l12-21.05 12 21.05z" />
  </svg>
);

export const GithubIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 16}
    height={props.size ?? 16}
    viewBox="0 0 16 16"
    fill={props.color ?? 'currentColor'}
    class={props.class}
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
