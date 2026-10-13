import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import { Button } from '@/components/Button/Button';
import { MediaGrid } from '@/components/MediaGrid/MediaGrid';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import type { OverviewRecentlyAddedProps } from './OverviewRecentlyAdded.types';
import { useLocale } from '@/lib/i18n';

export function OverviewRecentlyAdded({ media, onNavigate, onSelect }: OverviewRecentlyAddedProps) {
  const { t } = useLocale();
  return <section className="overview-section operator-library">
    <SectionHeading variant="operator" title={t('overview.recentlyAdded')} actions={<Button variant="link" onClick={() => onNavigate('media')}>{t('overview.viewLibrary')}</Button>} />
    <div className="library-showcase">{media?.length ? <MediaGrid items={media.slice(0, 12)} onSelect={onSelect} className="embedded-media-grid media-recent-grid" /> : <EmptyState>{t('overview.recentEmpty')}</EmptyState>}</div>
  </section>;
}
