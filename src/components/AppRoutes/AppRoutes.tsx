import { ActivityPage } from '@/pages/ActivityPage/ActivityPage';
import { CalendarPage } from '@/pages/CalendarPage/CalendarPage';
import { DiscoveryPage } from '@/pages/DiscoveryPage/DiscoveryPage';
import { MediaPage } from '@/pages/MediaPage/MediaPage';
import { OverviewPage } from '@/pages/OverviewPage/OverviewPage';
import { PipelinePage } from '@/pages/PipelinePage/PipelinePage';
import { RequestsPage } from '@/pages/RequestsPage/RequestsPage';
import { ServersPage } from '@/pages/ServersPage/ServersPage';
import { ServicesPage } from '@/pages/ServicesPage/ServicesPage';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';
import { StreamsPage } from '@/pages/StreamsPage/StreamsPage';
import { AccessPage } from '@/pages/AccessPage/AccessPage';
import { AboutPage } from '@/pages/AboutPage/AboutPage';
import { UniversalMediaDetailPage } from '@/pages/UniversalMediaDetailPage/UniversalMediaDetailPage';
import { Button } from '@/components/Button/Button';
import type { AppRoutesProps } from './AppRoutes.types';
import { useLocale } from '@/lib/i18n';

export function AppRoutes({ route, locationKey, dashboard: data, title, preferences, onNavigate, onSelect, onOpenTitle, onAction, onEditService, onToast, onRefresh }: AppRoutesProps) {
  const { t } = useLocale();
  const { view, isCanonicalTitle, titleMediaType, itemKey } = route;
  const startRequest = () => onNavigate('/discovery');

  if (isCanonicalTitle && title.item) return <UniversalMediaDetailPage key={`title:${titleMediaType}:${itemKey}`} dashboard={data} item={title.item} focus={title.focus} onEpisodeSelect={title.onEpisodeSelect} onBack={() => typeof window.history.state?.returnTo === 'string' ? window.history.back() : onNavigate('/media')} onToast={onToast} onRefresh={() => onRefresh()} />;
  switch (view) {
    case 'requests': return <RequestsPage key={locationKey} dashboard={data} onSelect={onSelect} onToast={onToast} onRefresh={() => onRefresh()} onNewRequest={startRequest} />;
    case 'pipeline': return <PipelinePage key={locationKey} dashboard={data} onSelect={onSelect} onAction={onAction} />;
    case 'streams': return <StreamsPage dashboard={data} />;
    case 'media': return <MediaPage key={locationKey} dashboard={data} onSelect={onSelect} />;
    case 'discovery': return <DiscoveryPage key={locationKey} dashboard={data} onOpen={(item) => { void onOpenTitle(item, 'discovery'); }} />;
    case 'calendar': return <CalendarPage key={locationKey} dashboard={data} onOpen={(entry) => { void onOpenTitle(entry, 'calendar'); }} />;
    case 'activity': return <ActivityPage key={locationKey} dashboard={data} onSelect={onSelect} />;
    case 'services': return <ServicesPage dashboard={data} onSelect={onSelect} onEdit={onEditService} />;
    case 'access': return <AccessPage refreshKey={data.mode === 'demo' ? data.demoProfile || 'medium' : data.mode || 'live'} onToast={onToast} onChanged={() => { void onRefresh(); }} />;
    case 'servers': return <ServersPage dashboard={data} onSelect={onSelect} />;
    case 'settings': return <SettingsPage dashboard={data} {...preferences} onToast={onToast} onNavigate={onNavigate} onRefresh={onRefresh} />;
    case 'about': return <AboutPage dashboard={data} />;
    case 'overview': return <OverviewPage dashboard={data} onNavigate={onNavigate} onSelect={onSelect} />;
    default: return <section className="loading-state"><h1>{t('common.pageNotFound')}</h1><p>{t('common.pageNotFoundDescription')}</p><Button onClick={() => onNavigate('/')}>{t('common.backToOverview')}</Button></section>;
  }
}
