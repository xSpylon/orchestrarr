import { useWizarrManager } from '@/hooks/use_wizarr_manager';
import { WizarrInviteForm } from '@/components/WizarrInviteForm/WizarrInviteForm';
import { WizarrInviteResult } from '@/components/WizarrInviteResult/WizarrInviteResult';
import { WizarrSectionHead } from '@/components/WizarrSectionHead/WizarrSectionHead';
import { WizarrUsers } from '@/components/WizarrUsers/WizarrUsers';
import type { WizarrManagerProps } from './WizarrManager.types';
import styles from './WizarrManager.module.scss';
import { useLocale } from '@/lib/i18n';

export function WizarrManager(props: WizarrManagerProps) {
  const { t } = useLocale();
  const { data, loading, error, load, removingId, removeUser, createdInvite, copyInvite, invite } = useWizarrManager(props);
  return <div className={styles.manager}>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.sections}>
      <WizarrUsers data={data} loading={loading} removingId={removingId} onRefresh={() => void load()} onRemove={(user) => void removeUser(user)} />
      <section className={`${styles.section} ${styles.invitation}`}>
      <WizarrSectionHead title={t('wizarr.createInvitation')} description={t('wizarr.invitationDescription')} />
        {data?.servers.length ? <WizarrInviteForm servers={data.servers} invite={invite} /> : loading && !data ? <div className="skeleton skeleton-toolbar" /> : <p className="empty-state compact">{t('wizarr.noMediaServers')}</p>}
        {createdInvite ? <WizarrInviteResult invite={createdInvite} onCopy={() => void copyInvite()} /> : null}
      </section>
    </div>
  </div>;
}
