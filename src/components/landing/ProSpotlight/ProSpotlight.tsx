import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import ProPillars from '@/components/common/Pro/ProPillars';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { proLinkProps } from '@/utils/pro';
import { createReveal } from '../reveal';
import './ProSpotlight.css';

const PLACEMENT = 'landing-pro-spotlight';

const cta = proLinkProps('/', PLACEMENT);

export default function ProSpotlight() {
  const reveal = createReveal();

  return (
    <section class="ln-prospot-section" aria-labelledby="ln-prospot-title">
      <div ref={reveal(0)} class="ln-prospot-inner">
        <header class="ln-prospot-header">
          <div class="ln-prospot-copy">
            <h2 id="ln-prospot-title">Also building with React?</h2>
            <p>
              React Bits Pro has page sections, app UI, full Next.js templates and agent skills for React, all as source
              you own. It is from the maker of Solid Bits, and there is no Solid version.
            </p>
          </div>

          <a class="ln-prospot-btn ln-prospot-btn--primary" {...cta}>
            Explore React Bits Pro
            <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
          </a>
        </header>

        <ProPillars placement="landing-pro" />
      </div>
    </section>
  );
}
