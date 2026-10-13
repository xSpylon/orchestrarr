import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useDialog } from '@/components/ui/use_dialog';
import type { DetailDrawerProps } from './DetailDrawer.types';
import { Button } from '@/components/Button/Button';
import { useLocale } from '@/lib/i18n';

export function DetailDrawer({ title, open, onClose, children }: DetailDrawerProps) {
  const { t } = useLocale();
  const ref = useDialog(open);
  // While the panel slides out, keep showing what it held instead of an emptied panel.
  const [shown, setShown] = useState({ title, children });
  if (open && (shown.title !== title || shown.children !== children)) setShown({ title, children });
  // The backdrop click is a mouse shortcut; Esc and the close button cover the keyboard.
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
  return <dialog ref={ref} className="drawer-panel" aria-labelledby="drawer-title" onCancel={onClose} onClick={(event) => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left) onClose();
    }
  }}>
    <div className="drawer-head"><span className="eyebrow">{t('common.details')}</span><Button variant="icon" onClick={onClose} aria-label={t('drawer.closeDetails')} title={`${t('drawer.closeDetails')} (Esc)`}><Icon name="close" /></Button></div>
    <h2 id="drawer-title">{shown.title}</h2><div className="drawer-content">{shown.children}</div>
  </dialog>;
}
