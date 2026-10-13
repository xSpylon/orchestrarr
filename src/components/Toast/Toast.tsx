import styles from './Toast.module.scss';
import type { ToastProps } from './Toast.types';

export function Toast({ message }: ToastProps) {
  return <div className={`toast ${styles.toast} ${message ? 'visible' : ''}`} role="status" aria-live="polite">{message}</div>;
}
