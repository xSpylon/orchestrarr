import styles from './PageHeading.module.scss';
import type { PageHeadingProps } from './PageHeading.types';
import { useLocale } from '@/lib/i18n';

export function PageHeading({ eyebrow, title, copy, actions }: PageHeadingProps) {
  const { t } = useLocale();
  return (
    <section className="page-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {/* An empty title means the name is still loading: hold its place instead of showing a stand-in. */}
        <h1 aria-busy={!title}>{title || <><span className="skeleton skeleton-title" aria-hidden="true" /><span className="sr-only">{t('common.loadingTitle')}</span></>}</h1>
        {copy ? <p>{copy}</p> : null}
      </div>
      {actions ? <div className={`heading-actions ${styles.actions}`}>{actions}</div> : null}
    </section>
  );
}
