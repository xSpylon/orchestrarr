import { buttonClass } from '@/components/Button/button_class';
import { Icon } from '@/components/ui/Icon';
import { useStoredFlag } from '@/hooks/use_stored_flag';
import { useLocale } from '@/lib/i18n';
import type { DemoTour } from '@/types/dashboard.types';
import type { DemoChecklistProps } from './DemoChecklist.types';
import styles from './DemoChecklist.module.scss';

const steps: [keyof DemoTour, string, string][] = [
  ['requested', 'demoTour.request', 'discovery'],
  ['approved', 'demoTour.approve', 'requests'],
  ['declined', 'demoTour.decline', 'requests'],
  ['imported', 'demoTour.import', 'pipeline'],
  ['paused', 'demoTour.pause', 'pipeline'],
  ['blocklisted', 'demoTour.blocklist', 'pipeline'],
  ['invited', 'demoTour.invite', 'access'],
  ['removed', 'demoTour.remove', 'access'],
];

/** A short tour of demo mode: each task opens its page and ticks off once the visitor has done it. */
export function DemoChecklist({ tour, onNavigate }: DemoChecklistProps) {
  const { t } = useLocale();
  // on a phone the open list would cover half the screen, so it starts folded there
  const [open, setOpen] = useStoredFlag('demoChecklistOpen', !window.matchMedia('(max-width: 680px)').matches);
  const done = steps.filter(([step]) => tour?.[step]).length;
  return <section className={styles.checklist} aria-label={t('demoTour.title')}>
    <div className={styles.header}>
      <strong>{t('demoTour.title')}</strong>
      <span className={styles.progress}>{t('demoTour.progress', undefined, { value: done, total: steps.length })}</span>
      <button type="button" className={styles.toggle} aria-label={t(open ? 'demoTour.hide' : 'demoTour.show')} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="chevron" className={open ? styles.open : ''} /></button>
    </div>
    {open ? <ol className={styles.steps}>
      {steps.map(([step, label, view]) => <li key={step}>
        <button type="button" className={`${styles.step} ${tour?.[step] ? styles.done : ''}`} onClick={() => onNavigate(view)}>
          <span className={styles.mark} aria-hidden="true">{tour?.[step] ? '✓' : ''}</span>
          <span className={styles.task}>{t(label)}</span>
          <span className={styles.page}>{t(`nav.${view}`)}</span>
          {tour?.[step] ? <span className="sr-only">{t('demoTour.done')}</span> : null}
        </button>
      </li>)}
    </ol> : null}
    {open && done === steps.length ? <div className={styles.finished}><p>{t('demoTour.finished')}</p><a className={buttonClass({ variant: 'solid', size: 'small' })} href="https://orchestrarr.com" target="_blank" rel="noopener noreferrer">{t('demoTour.install')}</a></div> : null}
  </section>;
}
