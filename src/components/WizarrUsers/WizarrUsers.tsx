import { Button } from '@/components/Button/Button';
import { WizarrSectionHead } from '@/components/WizarrSectionHead/WizarrSectionHead';
import styles from '@/components/WizarrManager/WizarrManager.module.scss';
import type { WizarrUsersProps } from './WizarrUsers.types';
import { useLocale } from '@/lib/i18n';

function displayDate(value: string | null | undefined, locale: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale);
}

export function WizarrUsers({ data, loading, removingId, onRefresh, onRemove }: WizarrUsersProps) {
  const { locale, t } = useLocale();
  return <section className={styles.section}>
    <WizarrSectionHead title={t('wizarr.users')} description={data ? t('wizarr.userCount', undefined, { value: data.users.length }) : t('common.loading')} actions={<Button type="button" onClick={onRefresh} disabled={loading}>{loading && data ? t('common.refreshing') : t('common.refresh')}</Button>} />
    {loading && !data ? <div role="status" aria-label={t('wizarr.loadingUsers')}>{Array.from({ length: 4 }, (_, index) => <div className="skeleton-row" key={index}><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>)}</div> : data?.users.length ? <div className={styles.userList}>
      {data.users.map((user) => <article className={styles.user} key={user.id}>
        <div className={styles.userDetails}>
          <strong>{user.username || user.email || `User ${user.id}`}</strong>
          {user.username && user.email ? <span>{user.email}</span> : null}
        </div>
        <div className={styles.userAccess}>
          <span>{[user.server, user.server_type].filter(Boolean).join(' · ') || t('wizarr.mediaServerUser')}</span>
          <small>{t('wizarr.expires', undefined, { value: displayDate(user.expires, locale) || t('wizarr.never') })}</small>
        </div>
        <Button variant="ghost" danger type="button" onClick={() => onRemove(user)} disabled={removingId === user.id}>{removingId === user.id ? t('wizarr.removing') : t('common.remove')}</Button>
      </article>)}
    </div> : <p className="empty-state compact">{t('wizarr.noUsers')}</p>}
  </section>;
}
