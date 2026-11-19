import { children } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { logoWhite } from '@/assets/logos';
import { GITHUB_URL } from '@/constants/cli';
import { proLinkProps, toolsLinkProps } from '@/utils/pro';
import FooterWaves from './FooterWaves';
import './Footer.css';

const proLink = proLinkProps('/', 'footer');
const toolsLink = toolsLinkProps('/tools', 'footer');

export default function Footer(props: { wide?: boolean; lead?: JSX.Element }) {
  const year = new Date().getFullYear();
  const lead = children(() => props.lead);

  return (
    <footer class={['ln-footer', { 'ln-footer--wide': Boolean(props.wide), 'ln-footer--lead': Boolean(lead()) }]}>
      <div class="ln-footer-inner">
        <div class="ln-footer-card">
          {lead()}
          <div class="ln-footer-top">
            <div class="ln-footer-brand">
              <a href="/" aria-label="Solid Bits home">
                <img class="ln-footer-logo" src={logoWhite} alt="Solid Bits" width="168" height="40" />
              </a>
              <p>
                Animated Solid components.
                <br />
                Open source. Fully customizable.
              </p>
            </div>

            <nav class="ln-footer-nav" aria-label="Footer">
              <div class="ln-footer-col">
                <span class="ln-footer-col-title">Community</span>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                <a href="https://reactbits.dev/" target="_blank" rel="noopener noreferrer">
                  React Bits
                </a>
                <a href="https://vue-bits.dev/" target="_blank" rel="noopener noreferrer">
                  Vue Bits
                </a>
                <a href="https://sveltebits.xyz/" target="_blank" rel="noopener noreferrer">
                  Svelte Bits
                </a>
              </div>
              <div class="ln-footer-col">
                <span class="ln-footer-col-title">Product</span>
                <a href="/get-started/introduction">Docs</a>
                <a href="/get-started/index">Components</a>
                <a href="/favorites">Favorites</a>
              </div>
              <div class="ln-footer-col">
                <span class="ln-footer-col-title">React Bits</span>
                <a {...proLink}>React Bits Pro</a>
                <a {...toolsLink}>Tools</a>
              </div>
            </nav>

            <div class="ln-footer-legal">
              <span>© {year} Solid Bits</span>
              <span>
                Built with love by{' '}
                <a href="https://x.com/davidhaz" target="_blank" rel="noopener noreferrer">
                  @davidhaz
                </a>
              </span>
              <a href={`${GITHUB_URL}/blob/main/LICENSE.md`} target="_blank" rel="noopener noreferrer">
                License
              </a>
            </div>
          </div>

          <FooterWaves />
        </div>
      </div>
    </footer>
  );
}
