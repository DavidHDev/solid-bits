import type { Component } from 'solid-js';
import { componentMetadata } from './Information';

export type PageModule = { default: Component };
export type PageLoader = () => Promise<PageModule>;

const demoModules = import.meta.glob<PageModule>('../demo/*/*Demo.tsx');

const slugOf = (docsUrl: string) => docsUrl.replace(/\/+$/, '').split('/').pop() ?? '';

const demos: Record<string, PageLoader> = {};
for (const [key, meta] of Object.entries(componentMetadata)) {
  const loader = demoModules[`../demo/${key}Demo.tsx`];
  if (loader) demos[slugOf(meta.docsUrl)] = loader;
}

export const getStarted: Record<string, PageLoader> = {
  introduction: () => import('../docs/Introduction'),
  installation: () => import('../docs/Installation'),
  mcp: () => import('../docs/McpServer'),
  changelog: () => import('../docs/Changelog')
};

export const componentMap: Record<string, PageLoader> = {
  ...getStarted,
  ...demos
};

export const componentSlugs = new Set(Object.values(componentMetadata).map(meta => slugOf(meta.docsUrl)));
