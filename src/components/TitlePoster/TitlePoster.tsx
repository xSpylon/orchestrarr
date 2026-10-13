import type { TitlePosterProps } from './TitlePoster.types';
import { useLocale } from '@/lib/i18n';

// .universal-media-poster is the target of the poster view transition.
export function TitlePoster({ image, title, loading }: TitlePosterProps) {
  const { t } = useLocale();
  return <div className="discovery-detail-poster universal-media-poster">{image ? <img src={image} alt={`${t('detail.artworkFor')} ${title}`} /> : title && !loading ? <span>{title.slice(0, 1).toUpperCase()}</span> : null}</div>;
}
