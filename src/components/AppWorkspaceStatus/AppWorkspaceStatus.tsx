import { Button } from '@/components/Button/Button';
import type { AppWorkspaceStatusProps } from './AppWorkspaceStatus.types';
import { useLocale } from '@/lib/i18n';

/** What the workspace shows before there is any dashboard data: a skeleton while loading, or the failure. */
export function AppWorkspaceStatus({ loading, error, onRetry }: AppWorkspaceStatusProps) {
  const { t } = useLocale();
  if (loading) return <section className="workspace-loading" role="status" aria-label={t('workspace.loading')}><span className="sr-only">{t('workspace.loading')}</span><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-toolbar" />{Array.from({ length: 8 }, (_, index) => <div className="skeleton-row" key={index}><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>)}</section>;
  return <section className="loading-state error-state" role="alert"><div className="loading-kicker"><span className="status-light bad" /><span>{t('workspace.connectionFailed')}</span></div><div className="loading-copy"><h1>{t('workspace.couldNotLoad')}</h1><p>{error || t('workspace.apiNoResponse')}</p></div><div className="drawer-actions"><Button variant="solid" onClick={onRetry}>{t('common.tryAgain')}</Button></div></section>;
}
