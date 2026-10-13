import type { ToggleProps } from './Toggle.types';
import { useLocale } from '@/lib/i18n';

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const { t } = useLocale();
  return <button className={`toggle ${checked ? '' : 'off'}`} aria-pressed={checked} aria-label={`${label} ${checked ? t('common.enabled') : t('common.disabled')}`} disabled={disabled} onClick={() => onChange(!checked)} />;
}
