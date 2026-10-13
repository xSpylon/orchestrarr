import { Button } from '@/components/Button/Button';
import type { CalendarToolbarProps } from './CalendarToolbar.types';
import { useLocale } from '@/lib/i18n';

export function CalendarToolbar({ label, onPrevious, onNext }: CalendarToolbarProps) {
  const { t } = useLocale();
  return <div className="calendar-toolbar"><Button onClick={onPrevious}>← {t('calendar.previous')}</Button><h2>{label}</h2><Button onClick={onNext}>{t('calendar.next')} →</Button></div>;
}
