import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createSignal, onSettled } from 'solid-js';
import { useLocation } from '@solidjs/router';
import ThemeToggle from '@/components/common/ThemeToggle';
import DocsMobileMenu from '@/components/navs/DocsMobileMenu';
import { GithubIcon } from '@/components/icons/Icons';
import { logoWhite } from '@/assets/logos';
import { GITHUB_URL } from '@/constants/cli';
import { CATEGORIES } from '@/constants/Categories';
import { useSearch } from '@/hooks/useSearch';
import { useStars } from '@/hooks/useStars';
import { proLinkProps } from '@/utils/pro';
import './Navbar.css';

const DOCS_PRO_LINK = proLinkProps('/', 'docs-navbar');

const DOCS_MATCHES = [
  ...CATEGORIES.map(category => `/${category.name.replace(/\s+/g, '-').toLowerCase()}`),
  '/c',
  '/favorites'
];

const NAV_LINKS = [{ label: 'Docs', to: '/get-started/introduction', match: DOCS_MATCHES }];

export default function Navbar(props: { showDocs?: boolean }) {
  const location = useLocation();
  const stars = useStars();
  const { toggleSearch } = useSearch();
  const [scrolled, setScrolled] = createSignal(false);
  const [menuOpen, setMenuOpen] = createSignal(false);
  let innerEl: HTMLDivElement | undefined;
  let linksEl: HTMLElement | undefined;
  let highlightEl: HTMLDivElement | undefined;

  const formattedStars = () => {
    const v = stars() ?? 0;
    return v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(v);
  };

  const isActive = (match: string[]) =>
    match.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));

  const positionHighlight = (el: HTMLElement | null) => {
    if (!el || !highlightEl || !linksEl) return;
    const linkRect = el.getBoundingClientRect();
    const containerRect = linksEl.getBoundingClientRect();
    highlightEl.style.width = `${linkRect.width}px`;
    highlightEl.style.height = `${linkRect.height}px`;
    highlightEl.style.transform = `translateX(${linkRect.left - containerRect.left}px)`;
    highlightEl.style.opacity = '1';
  };

  const getActiveEl = () => linksEl?.querySelector<HTMLElement>('.ln-navbar-link-active') ?? null;

  const handleLinksLeave = () => {
    const active = getActiveEl();
    if (active) positionHighlight(active);
    else if (highlightEl) highlightEl.style.opacity = '0';
  };

  createEffect(
    () => location.pathname,
    () => {
      setMenuOpen(false);
      const frame = requestAnimationFrame(() => {
        const active = getActiveEl();
        if (active) positionHighlight(active);
        else if (highlightEl) highlightEl.style.opacity = '0';
      });
      return () => cancelAnimationFrame(frame);
    }
  );

  createEffect(menuOpen, open => {
    document.body.style.overflow = open ? 'hidden' : '';
  });

  onSettled(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen()) setMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (props.showDocs || !menuOpen()) return;
      if (e.target instanceof Node && innerEl?.contains(e.target)) return;
      setMenuOpen(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      document.body.style.overflow = '';
    };
  });

  return (
    <>
      <header class={['ln-navbar', { 'ln-navbar-scrolled': scrolled(), 'ln-navbar-docs': Boolean(props.showDocs) }]}>
        <div ref={el => (innerEl = el)} class="ln-navbar-inner">
          <div class="ln-navbar-left">
            <a href="/" class="ln-navbar-logo" aria-label="Solid Bits home">
              <img src={logoWhite} alt="Solid Bits" />
            </a>
            <span class="ln-navbar-divider">/</span>
            <nav ref={el => (linksEl = el)} class="ln-navbar-links" onMouseLeave={handleLinksLeave}>
              <div ref={el => (highlightEl = el)} class="ln-navbar-link-highlight" />
              <For each={NAV_LINKS}>
                {link => (
                  <a
                    class={['ln-navbar-link', { 'ln-navbar-link-active': isActive(link.match) }]}
                    href={link.to}
                    onMouseEnter={e => positionHighlight(e.currentTarget)}
                  >
                    {link.label}
                  </a>
                )}
              </For>
            </nav>
          </div>

          <div class="ln-navbar-right">
            <Show when={props.showDocs}>
              <button type="button" class="ln-navbar-search" aria-label="Search" onClick={toggleSearch}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>Search</span>
                <kbd>/</kbd>
              </button>
            </Show>

            <ThemeToggle />

            <a
              class="ln-navbar-github"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <GithubIcon size={16} color="#fff" />
              <span>{formattedStars()}</span>
            </a>

            <Show when={props.showDocs}>
              <a class="ln-navbar-pro" {...DOCS_PRO_LINK}>
                React Bits Pro
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            </Show>

            <button
              type="button"
              class={['ln-navbar-hamburger', { open: menuOpen() }]}
              aria-expanded={ariaBool(menuOpen())}
              aria-label="Menu"
              onClick={() => setMenuOpen(value => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <Show when={menuOpen() && !props.showDocs}>
            <div class="ln-navbar-mobile-menu">
              <For each={NAV_LINKS}>
                {link => (
                  <a class="ln-navbar-mobile-link" href={link.to} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                )}
              </For>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="ln-navbar-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                <span style={{ display: 'inline-flex', 'align-items': 'center', gap: '8px' }}>
                  <GithubIcon size={14} />
                  GitHub
                </span>
                <span style={{ opacity: 0.6 }}>{formattedStars()}</span>
              </a>
            </div>
          </Show>
        </div>
      </header>

      <Show when={menuOpen() && props.showDocs}>
        <DocsMobileMenu onClose={() => setMenuOpen(false)} />
      </Show>
    </>
  );
}
