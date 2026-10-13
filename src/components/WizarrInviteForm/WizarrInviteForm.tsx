import { Button } from '@/components/Button/Button';
import { WizarrToggleField } from '@/components/WizarrToggleField/WizarrToggleField';
import styles from '@/components/WizarrManager/WizarrManager.module.scss';
import type { WizarrInviteFormProps } from './WizarrInviteForm.types';
import { useLocale } from '@/lib/i18n';

export function WizarrInviteForm({ servers, invite }: WizarrInviteFormProps) {
  const { t } = useLocale();
  const { options, setOption, selectedServers, availableLibraries, visibleSelectedLibraries } = invite;
  return <form className={styles.form} onSubmit={(event) => void invite.create(event)}>
    <label className={styles.field}><span>{t('wizarr.invitationExpires')}</span><select value={invite.expiresInDays} onChange={(event) => invite.setExpiresInDays(event.target.value)}><option value="1">{t('wizarr.inDays', undefined, { value: 1 })}</option><option value="7">{t('wizarr.inDays', undefined, { value: 7 })}</option><option value="30">{t('wizarr.inDays', undefined, { value: 30 })}</option><option value="never">{t('wizarr.never')}</option></select></label>
    <fieldset className={styles.serverChoices}>
      <legend>{t('wizarr.mediaServers')}</legend>
      {servers.map((server) => <label key={server.id} className={styles.serverChoice}>
        <input type="checkbox" checked={selectedServers.includes(server.id)} onChange={(event) => invite.toggleServer(server.id, event.target.checked)} />
        <span>{server.name}</span><small>{server.server_type || ''}</small>
      </label>)}
    </fieldset>
    <details className={styles.advanced}>
      <summary>{t('wizarr.advancedOptions')}</summary>
      <div className={styles.advancedContent}>
        <WizarrToggleField label={t('wizarr.unlimitedUses')} checked={options.unlimitedUses} onChange={(value) => setOption('unlimitedUses', value)} />
        <label className={styles.field}><span>{t('wizarr.accessDuration')} <small>{t('wizarr.daysAfterSignup')}</small></span><input type="number" min="1" step="1" value={invite.duration} onChange={(event) => invite.setDuration(event.target.value)} placeholder={t('wizarr.noLimit')} /></label>
        <WizarrToggleField label={t('wizarr.allowDownloads')} checked={options.allowDownloads} onChange={(value) => setOption('allowDownloads', value)} />
        <WizarrToggleField label={t('wizarr.allowLiveTv')} checked={options.allowLiveTv} onChange={(value) => setOption('allowLiveTv', value)} />
        <WizarrToggleField label={t('wizarr.allowMobileUploads')} checked={options.allowMobileUploads} onChange={(value) => setOption('allowMobileUploads', value)} />
        {selectedServers.length ? <details className={styles.libraryPicker}>
          <summary>{visibleSelectedLibraries.length ? t('wizarr.librariesSelected', undefined, { value: visibleSelectedLibraries.length }) : t('wizarr.selectLibraries')}</summary>
          <div className={styles.libraryList}>{availableLibraries.length ? availableLibraries.map((library) => <label key={library.id}><input type="checkbox" checked={visibleSelectedLibraries.includes(library.id)} onChange={(event) => invite.toggleLibrary(library.id, event.target.checked)} /><span>{library.name}</span></label>) : <p>{t('wizarr.noLibraries')}</p>}</div>
        </details> : null}
      </div>
    </details>
    <Button variant="solid" type="submit" disabled={invite.creating || !selectedServers.length}>{invite.creating ? t('wizarr.creatingInvitation') : t('wizarr.createInvitation')}</Button>
  </form>;
}
