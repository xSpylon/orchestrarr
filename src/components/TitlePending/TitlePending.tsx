import type { TitlePendingProps } from './TitlePending.types';
import { useLocale } from '@/lib/i18n';

// A value that is still on its way, so the page never claims something is missing while it is only loading.
export function TitlePending({ short = false, lines = 1 }: TitlePendingProps) {
  const { t } = useLocale();
  return <>{Array.from({ length: lines }, (_, line) => <span className={`episode-skeleton-value${short ? ' short' : ''}${line ? ' next-line' : ''}`} aria-hidden="true" key={line} />)}<span className="sr-only">{t('common.loading')}</span></>;
}
