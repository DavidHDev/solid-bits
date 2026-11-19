import { componentMetadata } from './Information';

export const SITE_ORIGIN = 'https://solid-bits.dev';
export const REGISTRY_BASE = `${SITE_ORIGIN}/r`;
export const GITHUB_URL = 'https://github.com/DavidHDev/solid-bits';
export const GITHUB_REPO = 'DavidHDev/solid-bits';
export const GITHUB_STARS_ENABLED = false;

const normalizeSlug = (slug: string): string => slug.replace(/[^a-z0-9]/gi, '').toLowerCase();

const REGISTRY_NAME_BY_SLUG = new Map(Object.values(componentMetadata).map(({ name }) => [normalizeSlug(name), name]));

export const registryItemName = (slug: string): string => REGISTRY_NAME_BY_SLUG.get(normalizeSlug(slug)) ?? slug;

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type Runner = 'npx' | 'pnpm dlx' | 'yarn dlx' | 'bunx --bun';

export const PKG_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

export const PKG_TO_RUNNER: Record<PackageManager, Runner> = {
  npm: 'npx',
  pnpm: 'pnpm dlx',
  yarn: 'yarn dlx',
  bun: 'bunx --bun'
};

export const RUNNER_TO_PKG: Record<Runner, PackageManager> = {
  npx: 'npm',
  'pnpm dlx': 'pnpm',
  'yarn dlx': 'yarn',
  'bunx --bun': 'bun'
};

export const RUNNERS: Runner[] = ['npx', 'pnpm dlx', 'bunx --bun', 'yarn dlx'];

export const registryUrl = (slug: string): string => `${REGISTRY_BASE}/${registryItemName(slug)}.json`;

export function jsrepoAddSnippet(slug: string, pkg: PackageManager): string {
  return `${PKG_TO_RUNNER[pkg]} jsrepo add ${registryUrl(slug)}`;
}

export const SAMPLE_COMPONENTS_JSON_REGISTRIES_DOC = `{
  "registries": {
    "@solid-bits": "${REGISTRY_BASE}/{name}.json"
  }
}`;

export function shadcnAddSnippet(slug: string, pkg: PackageManager): string {
  return `${PKG_TO_RUNNER[pkg]} shadcn@latest add ${registryUrl(slug)}`;
}
