import { ariaBool } from '@/utils/aria';
import { createSignal, onSettled } from 'solid-js';
import { ArrowUpIcon } from '@/components/icons/Icons';
import { addToast } from '@/hooks/useToast';

const MESSAGES = [
  '🐴  Country roads, take me home!',
  '🚀  To infinity and beyond!',
  '🦾  Get to the choppa!',
  '🚕  Grove Street, home...',
  '🐉  Fus Ro Dah!',
  '🍄  The princess is in another castle!',
  '🦸‍♂️  Avengers, assemble!',
  '🗡️  It’s dangerous to go alone! Take this.',
  '📜  A wizard is never late.',
  '💍  Foul Tarnished, in search of the Elden Ring!',
  '🐊  See you later, alligator.',
  '🔥  Dracarys!'
];

export default function BackToTopButton() {
  const [visible, setVisible] = createSignal(false);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
    addToast({ severity: 'secondary', summary: MESSAGES[Math.floor(Math.random() * MESSAGES.length)], life: 3000 });
  };

  onSettled(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  return (
    <button
      type="button"
      class={['back-to-top', { 'back-to-top--visible': visible() }]}
      aria-hidden={ariaBool(!visible())}
      aria-label="Back to top"
      onClick={() => visible() && scrollToTop()}
    >
      <ArrowUpIcon size={16} color="var(--text-primary)" />
    </button>
  );
}
