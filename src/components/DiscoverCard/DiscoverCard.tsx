import { LazyImage } from '@/components/ui/LazyImage';
import type { DiscoverCardProps } from './DiscoverCard.types';
import { useLocale } from '@/lib/i18n';

/** data-poster-key and data-poster let the poster transition find this card's artwork. */
export function DiscoverCard({ item, onOpen }: DiscoverCardProps) {
  const { t } = useLocale();
  return <button className="discovery-card" data-poster-key={`${item.mediaType}-${item.id}`} onClick={() => onOpen(item)} aria-label={t('discovery.openCard', undefined, { title: item.title, type: item.mediaType === 'tv' ? t('media.show').toLowerCase() : t('media.movie').toLowerCase(), detail: item.detail || '' })}>
    <span className="discovery-poster" data-poster>{item.poster ? <LazyImage src={item.poster} alt="" /> : null}<span className="poster-fallback" aria-hidden="true">{item.title}</span></span>
    <span className="discovery-card-copy"><strong>{item.title}</strong><small>{item.mediaType === 'tv' ? t('media.show') : t('media.movie')} · {item.detail}</small></span>
  </button>;
}
