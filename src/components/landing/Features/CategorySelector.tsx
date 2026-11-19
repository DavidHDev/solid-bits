import { markBlack, markWhite } from '@/assets/logos';
import { isLight } from '@/hooks/useTheme';
import FeatureIcon from './FeatureIcon';

export default function CategorySelector() {
  return (
    <div class="ln-feat-orbit">
      <div class="ln-feat-orbit-center">
        <img src={isLight() ? markBlack : markWhite} alt="" aria-hidden="true" />
      </div>
      <div class="ln-feat-orbit-ring ln-feat-orbit-ring--1">
        <div class="ln-feat-orbit-node--top ln-feat-orbit-node">
          <FeatureIcon name="type" />
        </div>
        <div class="ln-feat-orbit-node--right ln-feat-orbit-node">
          <FeatureIcon name="code" />
        </div>
        <div class="ln-feat-orbit-node--bottom ln-feat-orbit-node">
          <FeatureIcon name="layers" />
        </div>
        <div class="ln-feat-orbit-node--left ln-feat-orbit-node">
          <FeatureIcon name="grid" />
        </div>
      </div>
      <div class="ln-feat-orbit-ring ln-feat-orbit-ring--2">
        <div class="ln-feat-orbit-node--top ln-feat-orbit-node">
          <FeatureIcon name="zap" />
        </div>
        <div class="ln-feat-orbit-node ln-feat-orbit-node--tr">
          <FeatureIcon name="star" />
        </div>
        <div class="ln-feat-orbit-node--right ln-feat-orbit-node">
          <FeatureIcon name="circle" />
        </div>
        <div class="ln-feat-orbit-node ln-feat-orbit-node--br">
          <FeatureIcon name="eye" />
        </div>
        <div class="ln-feat-orbit-node--bottom ln-feat-orbit-node">
          <FeatureIcon name="box" />
        </div>
        <div class="ln-feat-orbit-node ln-feat-orbit-node--bl">
          <FeatureIcon name="heart" />
        </div>
        <div class="ln-feat-orbit-node--left ln-feat-orbit-node">
          <FeatureIcon name="image" />
        </div>
        <div class="ln-feat-orbit-node ln-feat-orbit-node--tl">
          <FeatureIcon name="compass" />
        </div>
      </div>
    </div>
  );
}
