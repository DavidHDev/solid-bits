import code from '@content/Micro/DodgeField/DodgeField.tsx?raw';
import css from '@content/Micro/DodgeField/DodgeField.css?raw';
import { createCodeObject } from '@/types/code';

export const dodgeField = createCodeObject(code, 'Micro/DodgeField', {
  dependencies: 'motion',
  usage: `import DodgeField from './DodgeField';

<DodgeField />

<DodgeField
  inkColor="#f5f5f5"
  contrastColor="#18181b"
  fieldHeight={240}
  reach={72}
  radius={120}
  falloff={2}
  fleeDuration={130}
  returnDuration={620}
  returnBounce={0.1}
  axis="both"
  wall="clamp"
  patience={4}
  onCatch={() => console.log('caught')}
>
  <img class="avatar" src="/me.png" alt="" />
</DodgeField>

<DodgeField patience={3}>
  {state => (
    <button type="button">{state.gave ? 'Okay, okay' : state.dodges ? \`Nope x\${state.dodges}\` : 'Catch me'}</button>
  )}
</DodgeField>`,
  css
});
