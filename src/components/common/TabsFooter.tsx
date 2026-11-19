import { HeartIcon } from '@/components/icons/Icons';

export default function TabsFooter() {
  return (
    <div class="preview-footer">
      <p class="footer-description" style={{ opacity: 0.8 }}>
        Created with <HeartIcon filled size={14} class="footer-heart" /> by{' '}
        <a href="https://x.com/davidhaz" target="_blank" rel="noopener noreferrer" class="footer-creator-link">
          David Haz
        </a>
      </p>
    </div>
  );
}
