import type { DiscoverSkeletonProps } from './DiscoverSkeleton.types';
import { useLocale } from '@/lib/i18n';

export function DiscoverSkeleton({ count = 12 }: DiscoverSkeletonProps) {
  const { t } = useLocale();
  return <div className="discovery-grid" role="status" aria-label={t('discovery.loadingTitles')}>{Array.from({ length: count }, (_, index) => <div key={index}><div className="skeleton discovery-skeleton" /><div className="skeleton" /></div>)}</div>;
}
