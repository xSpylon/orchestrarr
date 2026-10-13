import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
import { attentionItems } from '@/helpers/attention';
import { PageHeading } from '@/components/PageHeading/PageHeading';
import { PageFooter } from '@/components/PageFooter/PageFooter';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/Button/Button';
import { OverviewStats } from '@/components/OverviewStats/OverviewStats';
import { OverviewNowWatching } from '@/components/OverviewNowWatching/OverviewNowWatching';
import { OverviewNeedsApproval } from '@/components/OverviewNeedsApproval/OverviewNeedsApproval';
import { OverviewNeedsAttention } from '@/components/OverviewNeedsAttention/OverviewNeedsAttention';
import { OverviewRecentlyAdded } from '@/components/OverviewRecentlyAdded/OverviewRecentlyAdded';
import { OverviewQueue } from '@/components/OverviewQueue/OverviewQueue';
import { OverviewRecentActivity } from '@/components/OverviewRecentActivity/OverviewRecentActivity';
import { useLocale } from '@/lib/i18n';

type OverviewPageProps = {
  dashboard: DashboardData;
  onNavigate: (view: string) => void;
  onSelect: (item: DashboardItem) => void;
};

export function OverviewPage({ dashboard, onNavigate, onSelect }: OverviewPageProps) {
  const { t } = useLocale();
  const pipeline = dashboard.pipeline || [];
  return <>
    <PageHeading title={t('nav.overview')} actions={<Button variant="solid" onClick={() => onNavigate('discovery')}><Icon name="discovery" />{t('nav.discovery')}</Button>} />
    <OverviewStats dashboard={dashboard} onNavigate={onNavigate} />

    <div className="overview-row overview-triage">
      <OverviewNowWatching streams={dashboard.streams || []} plex={dashboard.services?.find((service) => service.name === 'Plex')} onNavigate={onNavigate} />
      <OverviewNeedsApproval requests={dashboard.requests || []} onNavigate={onNavigate} onSelect={onSelect} />
      <OverviewNeedsAttention items={attentionItems(dashboard.alerts || [], pipeline)} onNavigate={onNavigate} onSelect={onSelect} />
    </div>

    <OverviewRecentlyAdded media={dashboard.media} onNavigate={onNavigate} onSelect={onSelect} />

    <div className="overview-row overview-work">
      <OverviewQueue items={pipeline} onNavigate={onNavigate} onSelect={onSelect} />
      <OverviewRecentActivity events={dashboard.activity || []} onNavigate={onNavigate} />
    </div>
    <PageFooter dashboard={dashboard} />
  </>;
}
