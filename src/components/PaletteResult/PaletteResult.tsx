import { navigationShortcuts } from '@/lib/navigation';
import { Icon } from '@/components/ui/Icon';
import type { PaletteResultProps } from './PaletteResult.types';
import { useLocale } from '@/lib/i18n';

export function PaletteResult({ command, index, selected, showGroup, onHover, onChoose }: PaletteResultProps) {
  const { t } = useLocale();
  const shortcut = command.view ? navigationShortcuts[command.id] : undefined;
  return <div role="presentation">
    {showGroup ? <div className="palette-group-label" role="presentation">{command.group}</div> : null}
    <button type="button" role="option" id={`command-${index}`} aria-selected={selected} tabIndex={-1} className={`palette-result ${selected ? 'selected' : ''}`} onMouseEnter={onHover} onClick={onChoose}><Icon name={command.icon} /><span><strong>{command.title}</strong><small>{command.subtitle}</small></span>{shortcut ? <span className="palette-shortcut" aria-label={t('common.shortcut', undefined, { value: shortcut.toUpperCase() })}><kbd>G</kbd><kbd>{shortcut.toUpperCase()}</kbd></span> : null}</button>
  </div>;
}
