import styles from '@/components/WizarrManager/WizarrManager.module.scss';
import type { WizarrToggleFieldProps } from './WizarrToggleField.types';

export function WizarrToggleField({ label, checked, onChange }: WizarrToggleFieldProps) {
  return <label className={styles.toggleField}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className={styles.switch} aria-hidden="true" /><span>{label}</span></label>;
}
