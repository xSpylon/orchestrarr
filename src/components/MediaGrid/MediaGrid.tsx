import { LazyImage } from '@/components/ui/LazyImage';
import { displayText, mediaTypeLabel } from '@/helpers/format';
import type { MediaGridProps } from './MediaGrid.types';
import { useLocale } from '@/lib/i18n';

export function MediaGrid({ items, onSelect, className }: MediaGridProps) {
  const { t } = useLocale();
  return <div className={`media-grid${className ? ` ${className}` : ''}`}>
    {items.map((item, index) => <button className="media-card media-card-button" key={`${item.ratingKey || item.title}-${index}`} data-poster-key={String(item.ratingKey || item.title)} onClick={() => onSelect(item)}>
      <div className="media-cover" data-poster>{item.thumb ? <LazyImage src={item.thumb} alt={t('detail.artworkFor', undefined, { title: displayText(item.title) })} /> : null}<span>{displayText(item.title)}</span></div>
      <strong>{displayText(item.title)}</strong>
      <small>{item.recentEpisode ? t('media.newEpisode', undefined, { title: item.recentEpisode }) : item.recentlyAdded ? t('media.recentlyAdded') : [mediaTypeLabel(item.type), item.year || item.library].filter(Boolean).join(' · ')}</small>
    </button>)}
  </div>;
}
