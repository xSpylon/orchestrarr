import { isSecretField } from '@/helpers/integration_fields';
import type { IntegrationFieldProps } from './IntegrationField.types';
import { useLocale } from '@/lib/i18n';

/** One connection setting. Secrets are write-only; publicUrl is the address invite links are built on. */
export function IntegrationField({ fieldKey, label, value, onChange }: IntegrationFieldProps) {
  const { t } = useLocale();
  const secret = isSecretField(fieldKey);
  const publicUrl = fieldKey === 'publicUrl';
  return <label><span>{label}</span><input type={secret ? 'password' : publicUrl ? 'url' : 'text'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={secret ? t('services.secretPlaceholder') : publicUrl ? 'https://join.example.com' : ''} autoComplete={secret ? 'new-password' : 'off'} /><small>{secret ? t('services.secretHelp') : publicUrl ? t('services.publicUrlHelp') : t('services.serverSideHelp')}</small></label>;
}
