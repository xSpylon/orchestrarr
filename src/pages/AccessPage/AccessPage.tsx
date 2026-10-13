import { WizarrManager } from '@/components/WizarrManager/WizarrManager';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import styles from './AccessPage.module.scss';
import { useLocale } from '@/lib/i18n';

type AccessPageProps = { onToast: (message: string) => void; onChanged: () => void; refreshKey?: string };

export function AccessPage({ onToast, onChanged, refreshKey }: AccessPageProps) {
  const { t } = useLocale();
  return <>
    <PageHeading eyebrow={t('access.eyebrow')} title={t('access.title')} />
    <section className={styles.panel}>
      <WizarrManager onToast={onToast} onChanged={onChanged} refreshKey={refreshKey} />
    </section>
  </>;
}
