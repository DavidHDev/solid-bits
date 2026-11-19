import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://solid-bits.dev';
const GET_STARTED = ['introduction', 'installation', 'mcp', 'changelog'];

const toSlug = value => value.replace(/\s+/g, '-').toLowerCase();

const escapeXml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const pathOf = url => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

export const getLastModified = (meta, today = new Date().toISOString().slice(0, 10)) => {
  const dates = [meta?.added, ...(meta?.updates ?? []).map(update => update.date)];
  return dates
    .filter(
      date =>
        typeof date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(Date.parse(date)) &&
        new Date(date).toISOString().slice(0, 10) === date &&
        date <= today
    )
    .sort()
    .at(-1);
};

export const getSitemapPages = async () => {
  const { CATEGORIES } = await import('../src/constants/Categories.ts');
  const { componentMetadata } = await import('../src/constants/Information.ts');
  const metaByPath = new Map(
    Object.values(componentMetadata)
      .filter(meta => !meta.hidden)
      .map(meta => [pathOf(meta.docsUrl), meta])
  );
  const categories = CATEGORIES.filter(category => category.name !== 'Get Started');
  const components = categories.flatMap(category =>
    category.subcategories.flatMap(name => {
      const path = `/${toSlug(category.name)}/${toSlug(name)}`;
      const meta = metaByPath.get(path);
      return meta ? [{ path, meta }] : [];
    })
  );
  return [
    { path: '/' },
    { path: '/get-started/index' },
    ...categories.map(category => ({ path: `/c/${toSlug(category.name)}` })),
    ...components,
    ...GET_STARTED.map(slug => ({ path: `/get-started/${slug}` }))
  ];
};

export const generateSitemap = async () => {
  const pages = await getSitemapPages();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(page => {
    const lastmod = getLastModified(page.meta);
    return `  <url>\n    <loc>${escapeXml(`${SITE_URL}${page.path}`)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
  })
  .join('\n')}
</urlset>\n`;
  fs.writeFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), xml);
  console.log(`Sitemap: ${pages.length} public pages.`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) await generateSitemap();
