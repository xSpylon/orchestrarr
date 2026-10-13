import styles from '@/components/WizarrManager/WizarrManager.module.scss';
import type { WizarrSectionHeadProps } from './WizarrSectionHead.types';

export function WizarrSectionHead({ title, description, actions }: WizarrSectionHeadProps) {
  return <div className={styles.sectionHead}><div><h3>{title}</h3><p>{description}</p></div>{actions}</div>;
}
