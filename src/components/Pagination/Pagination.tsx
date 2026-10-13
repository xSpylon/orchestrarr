import { Button } from '@/components/Button/Button';
import type { PaginationProps } from './Pagination.types';
import { useLocale } from '@/lib/i18n';

export function Pagination({ page, pageCount, onChange, label }: PaginationProps) {
  const { t } = useLocale();
  if (pageCount <= 1) return null;
  return <nav className="pagination" aria-label={label}>
    <Button disabled={page === 1} onClick={() => onChange(page - 1)}>{t('calendar.previous')}</Button>
    <span>{t('pagination.pageOf', undefined, { page, total: pageCount })}</span>
    <Button disabled={page === pageCount} onClick={() => onChange(page + 1)}>{t('calendar.next')}</Button>
  </nav>;
}
