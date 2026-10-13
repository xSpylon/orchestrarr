import { Button } from '@/components/Button/Button';
import type { DiscoverErrorProps } from './DiscoverError.types';
import { useLocale } from '@/lib/i18n';

export function DiscoverError({ message, onRetry }: DiscoverErrorProps) {
  const { t } = useLocale();
  return <div className="inline-error" role="alert"><strong>{t('discovery.couldNotLoad')}</strong><span>{message}</span><Button variant="link" onClick={onRetry}>{t('common.tryAgain')}</Button></div>;
}
