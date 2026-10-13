import type { PageFooterProps } from './PageFooter.types';
import styles from './PageFooter.module.scss';
import { useLocale } from '@/lib/i18n';

export function PageFooter({ dashboard }: PageFooterProps) {
  const { t } = useLocale();
  return <footer className={`page-footer ${styles.footer}`}><span>{dashboard?.mode === 'live' ? t('footer.liveData') : t('footer.demoData')} · {dashboard?.runtime?.uptime || t('footer.uptimeUnavailable')}</span></footer>;
}
