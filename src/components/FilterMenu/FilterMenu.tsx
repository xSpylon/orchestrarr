import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { navigateRows } from '@/components/ui/list_keyboard';
import type { FilterMenuProps } from './FilterMenu.types';
import { useLocale } from '@/lib/i18n';

/** A composable query chip: "Service: Radarr ×". Opens a small listbox, searchable when the list is long. */
export function FilterMenu({ label, value, options, onChange, defaultValue = 'all', clearable = true }: FilterMenuProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = options.find((option) => option.value === value);
  const active = clearable && value !== defaultValue;
  const searchable = options.length > 8;
  const visible = term ? options.filter((option) => option.label.toLowerCase().includes(term.toLowerCase())) : options;

  useEffect(() => {
    if (!open) return;
    const menu = root.current?.querySelector<HTMLElement>(searchable ? '.filter-popover input' : '.filter-option[aria-selected="true"], .filter-option');
    menu?.focus();
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, searchable]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    trigger.current?.focus();
  }

  // Keyboard handlers on the wrappers catch keys from the buttons inside them (Esc closes, arrows move between options).
  /* eslint-disable jsx-a11y/no-static-element-interactions */
  return <div className="filter-menu" ref={root} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className={`filter-chip ${active ? 'active' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => { setTerm(''); setOpen(!open); }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setTerm(''); setOpen(true); } }}>
      {clearable && !active ? <Icon name="plus" /> : null}<span className="filter-chip-label">{label}</span>{active || !clearable ? <span>{current?.label || value}</span> : null}
    </button>
    {active ? <button type="button" className="filter-chip-clear" aria-label={t('filters.clear', undefined, { value: label })} title={t('filters.clear', undefined, { value: label })} onClick={() => choose(defaultValue)}><Icon name="close" /></button> : null}
    {open ? <div className="filter-popover" onKeyDown={(event) => navigateRows(event, '.filter-option')}>
      {searchable ? <input type="text" aria-label={t('filters.search', undefined, { value: label })} placeholder={`${label}…`} value={term} onChange={(event) => setTerm(event.target.value)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); root.current?.querySelector<HTMLElement>('.filter-option')?.focus(); }
        if (event.key === 'Enter' && visible[0]) { event.preventDefault(); choose(visible[0].value); }
      }} /> : null}
      <div role="listbox" aria-label={label}>
        {visible.map((option) => <button type="button" role="option" aria-selected={option.value === value} className="filter-option" key={option.value} onClick={() => choose(option.value)}><span>{option.label}</span>{option.value === value ? <Icon name="check" /> : null}</button>)}
        {!visible.length ? <p className="filter-empty">{t('filters.noMatches')}</p> : null}
      </div>
    </div> : null}
  </div>;
  /* eslint-enable jsx-a11y/no-static-element-interactions */
}
