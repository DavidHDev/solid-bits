import { markBlack, markWhite } from '@/assets/logos';
import { isLight } from '@/hooks/useTheme';
import './LandingLoader.css';

export default function LandingLoader(props: { hiding?: boolean }) {
  return (
    <div
      class={['ln-loader', { 'ln-loader--hide': Boolean(props.hiding) }]}
      role="status"
      aria-label="Loading Solid Bits"
      aria-hidden={props.hiding ? 'true' : undefined}
    >
      <span class="ln-loader-logo" aria-hidden="true">
        <img src={isLight() ? markBlack : markWhite} alt="" />
      </span>
    </div>
  );
}
