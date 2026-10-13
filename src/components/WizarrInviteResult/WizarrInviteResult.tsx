import { Button } from '@/components/Button/Button';
import styles from '@/components/WizarrManager/WizarrManager.module.scss';
import type { WizarrInviteResultProps } from './WizarrInviteResult.types';
import { useLocale } from '@/lib/i18n';

/** The invitation just created: its link, or its code when Wizarr has no public invite URL. */
export function WizarrInviteResult({ invite, onCopy }: WizarrInviteResultProps) {
  const { t } = useLocale();
  return <div className={styles.inviteResult}><div><strong>{t('wizarr.invitationReady')}</strong>{invite.url ? <a href={invite.url} target="_blank" rel="noreferrer">{invite.url}</a> : <span>{t('wizarr.codeHelp', undefined, { value: invite.code || '' })}</span>}</div><Button type="button" onClick={onCopy}>{invite.url ? t('wizarr.copyLink') : t('wizarr.copyCode')}</Button></div>;
}
