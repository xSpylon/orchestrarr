import { PageFooter } from '@/components/PageFooter/PageFooter';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import type { DashboardData } from '@/types/dashboard.types';
import { useLocale } from '@/lib/i18n';
import styles from './AboutPage.module.scss';

type AboutPageProps = { dashboard: DashboardData };

const newTabLinkProps = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function AboutPage({ dashboard }: AboutPageProps) {
  const { t } = useLocale();
  return <>
    <PageHeading eyebrow={t('about.eyebrow')} title={t('about.title')} />
    <section className={styles.page} aria-label={t('about.title')}>
      <section className={styles.panel} aria-label={t('about.identity')}>
        <SectionHeading title={t('about.identity')} description={t('about.identityDescription')} />
        <p className={styles.copy}>{t('about.projectBy')}</p>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('about.officialProject')}</span>
            <a href="https://orchestrarr.com" {...newTabLinkProps}>orchestrarr.com</a>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('about.license')}</span>
            <span className={styles.inlineLinks}><a href="/licenses/reference_orchestrarr.txt" {...newTabLinkProps}>AGPL-3.0</a><a href="/licenses/reference_orchestrarr_notice.txt" {...newTabLinkProps}>{t('about.notice')}</a></span>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-label={t('about.builtWith')}>
        <SectionHeading title={t('about.builtWith')} />
        <div className={styles.creditGrid}>
          <a href="/licenses/reference_react.txt" {...newTabLinkProps}><strong>React</strong><span>{t('about.license')}</span></a>
          <a href="/licenses/reference_react_dom.txt" {...newTabLinkProps}><strong>React DOM</strong><span>{t('about.license')}</span></a>
          <a href="/licenses/reference_scheduler.txt" {...newTabLinkProps}><strong>Scheduler</strong><span>{t('about.license')}</span></a>
          <a href="/licenses/reference_inter.txt" {...newTabLinkProps}><strong>Inter</strong><span>{t('about.license')}</span></a>
        </div>
      </section>

      <section className={styles.panel} aria-label={t('about.tmdbAttribution')}>
        <SectionHeading title={t('about.tmdbAttribution')} description={t('about.tmdbDisclaimer')} />
        <div className={styles.attribution}>
          <a className={styles.tmdbLink} href="https://www.themoviedb.org/" {...newTabLinkProps}><img src="/reference_tmdb.svg" width="100" height="13" alt={t('about.tmdbAlt')} loading="lazy" /></a>
          <p>{t('about.trademarkDisclaimer')} <a href="https://developer.themoviedb.org/docs/faq" {...newTabLinkProps}>{t('about.tmdbAttribution')}</a>.</p>
        </div>
      </section>
    </section>
    <PageFooter dashboard={dashboard} />
  </>;
}
