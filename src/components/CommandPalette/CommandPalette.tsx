import { useEffect, useMemo, useState } from 'react';
import type { CommandPaletteProps } from './CommandPalette.types';
import { paletteCommands, type PaletteCommand } from '@/helpers/palette_commands';
import { Icon } from '@/components/ui/Icon';
import { useDialog } from '@/components/ui/use_dialog';
import { Button } from '@/components/Button/Button';
import { PaletteResult } from '@/components/PaletteResult/PaletteResult';
import { useLocale } from '@/lib/i18n';

function readRecent(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem('recentDestinations') || '[]'); return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []; } catch { return []; }
}

export function CommandPalette({ open, dashboard, onClose, onNavigate, onSelect, onThemeToggle, onRefresh, theme }: CommandPaletteProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [cursor, setSelected] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const ref = useDialog(open);
  const items = useMemo(() => paletteCommands(dashboard, query, recent, theme, t), [dashboard, query, recent, theme, t]);

  // Every open starts from an empty search.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setQuery(''); setSelected(0); }
  }
  const selected = Math.min(cursor, Math.max(0, items.length - 1));
  useEffect(() => { if (open) document.getElementById(`command-${selected}`)?.scrollIntoView({ block: 'nearest' }); }, [selected, open]);

  function choose(command: PaletteCommand) {
    onClose();
    if (command.view) {
      const next = [command.id, ...recent.filter((id) => id !== command.id)].slice(0, 3);
      setRecent(next);
      localStorage.setItem('recentDestinations', JSON.stringify(next));
      onNavigate(command.view);
    } else if (command.item) onSelect(command.item);
    else if (command.action === 'theme') onThemeToggle();
    else if (command.action === 'refresh') onRefresh();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = Math.max(items.length, 1);
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelected((selected + 1) % count); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelected((selected - 1 + count) % count); }
    if (event.key === 'Enter' && items[selected]) { event.preventDefault(); choose(items[selected]); }
  }

  // The backdrop click is a mouse shortcut; Esc and the close button cover the keyboard.
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
  return <dialog ref={ref} className="palette-dialog" aria-label={t('shell.searchCommands')} onCancel={onClose} onClick={(event) => {
    // Only a click on the backdrop (outside the box) closes; clicks inside land on the dialog element too.
    if (event.target === event.currentTarget) {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }
  }}>
    <div className="palette-search"><Icon name="search" />{/* eslint-disable-next-line jsx-a11y/no-autofocus -- the palette is a search box; opening it means you want to type. */}
    <input autoFocus type="text" role="combobox" aria-label={t('shell.searchWorkspace')} aria-autocomplete="list" aria-expanded={open} aria-controls="command-results" aria-activedescendant={items.length ? `command-${selected}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} placeholder={t('shell.searchPlaceholder')} autoComplete="off" onKeyDown={onKeyDown} /><Button variant="icon" onClick={onClose} title={t('shell.closeSearch')} aria-label={t('common.close')}><Icon name="close" /></Button></div>
    <div className="palette-results" role="listbox" id="command-results" aria-label={t('shell.searchCommands')}>
      {items.length ? items.map((command, index) => <PaletteResult key={command.id} command={command} index={index} selected={index === selected} showGroup={index === 0 || items[index - 1].group !== command.group} onHover={() => setSelected(index)} onChoose={() => choose(command)} />) : <div className="palette-empty" role="presentation">{t('common.noResults')}</div>}
    </div>
    <div className="palette-footer"><kbd>↑</kbd><kbd>↓</kbd><span>{t('common.navigate')}</span><kbd>↵</kbd><span>{t('common.open')}</span><kbd>esc</kbd><span>{t('common.close')}</span></div>
  </dialog>;
}
