import code from '@content/Micro/SwipeRow/SwipeRow.tsx?raw';
import css from '@content/Micro/SwipeRow/SwipeRow.css?raw';
import { createCodeObject } from '@/types/code';

export const swipeRow = createCodeObject(code, 'Micro/SwipeRow', {
  dependencies: 'motion @hugeicons/core-free-icons',
  usage: `import { Archive02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import SwipeRow from './SwipeRow';

<SwipeRow
  actions={[
    { id: 'delete', label: 'Delete', icon: Delete02Icon },
    { id: 'archive', label: 'Archive', icon: Archive02Icon, dismiss: true }
  ]}
  onAction={action => console.log(action.id)}
  onCommit={action => removeRow(item.id, action.id)}
  actionColor="#e5484d"
  drawerColor="#3f3f46"
  rowColor="#27272a"
  textColor="#f5f5f5"
  height={64}
  radius={16}
  actionWidth={80}
  direction="left"
  snapBounce={0.2}
  resistance={0.55}
  collapseMs={200}
  commitAt={0.6}
  fullSwipe
  style={{ 'margin-bottom': '8px' }}
>
  <span>Design review notes</span>
</SwipeRow>`,
  css
});
