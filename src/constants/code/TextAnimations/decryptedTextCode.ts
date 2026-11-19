import code from '@content/TextAnimations/DecryptedText/DecryptedText.tsx?raw';
import { createCodeObject } from '@/types/code';

export const decryptedText = createCodeObject(code, 'TextAnimations/DecryptedText', {
  dependencies: '',
  usage: `import DecryptedText from './DecryptedText';

<DecryptedText
  text="Hacking into the mainframe..."
  animateOn="inViewHover"
  effect="scramble"
  sequential={true}
  revealDirection="start"
  speed={60}
  maxIterations={10}
  hoverRadius={100}
  scrambleColor="#2bb673"
  loop={false}
  loopDelay={2000}
  useOriginalCharsOnly={false}
  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+"
  className="revealed"
  encryptedClassName="encrypted"
/>`
});
