import type { IconName } from '@/components/ui/Icon';
import type { DashboardData, DashboardItem } from '@/types/dashboard.types';
import { navigationGroups, navigationPaths } from '../lib/navigation.ts';
import { createTranslator, type Translator } from '../lib/i18n.ts';

export type PaletteCommand = { id: string; title: string; subtitle: string; group: string; icon: IconName; view?: string; item?: DashboardItem; action?: 'theme' | 'refresh' };

const english = createTranslator('en');

function destinations(t: Translator): PaletteCommand[] {
  return [
    { id: 'overview', title: t('nav.overview'), subtitle: 'Your media stack at a glance', group: 'Navigate', icon: 'overview', view: navigationPaths.overview },
    ...navigationGroups.flatMap(({ group, items }) => items.map(([key, label, description]): PaletteCommand => ({ id: key, title: t(`nav.${key}`, label), subtitle: `${t(`group.${group.toLowerCase()}`, group)} · ${description}`, group: t('common.navigate', 'Navigate'), icon: key as IconName, view: navigationPaths[key] }))),
  ];
}

/** Without a query: recent pages first, then every page and the actions. With one: pages, actions and live items that match. */
export function paletteCommands(dashboard: DashboardData | null, query: string, recent: string[], theme: 'dark' | 'light', t: Translator = english): PaletteCommand[] {
  const pages = destinations(t);
  const actions: PaletteCommand[] = [
    { id: 'theme', title: t('shell.switchTheme', undefined, { value: (theme === 'dark' ? t('settings.light') : t('settings.dark')).toLocaleLowerCase() }), subtitle: t('common.appearance', 'Appearance'), group: t('common.actions', 'Actions'), icon: theme === 'dark' ? 'sun' : 'moon', action: 'theme' },
    { id: 'refresh', title: t('common.refreshWorkspace', 'Refresh workspace'), subtitle: t('common.fetchLatest', 'Fetch the latest service data'), group: t('common.actions', 'Actions'), icon: 'refresh', action: 'refresh' },
  ];
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [
    ...recent.flatMap((id) => { const command = pages.find((entry) => entry.id === id); return command ? [{ ...command, group: 'Recent' }] : []; }),
    ...pages.filter((command) => !recent.includes(command.id)), ...actions,
  ];
  const live: PaletteCommand[] = [
    ...(dashboard?.requests || []).map((item, index): PaletteCommand => ({ id: `request-${item.requestId || index}`, title: item.title, subtitle: `${item.requester || t('common.request', 'Request')} · ${item.state || t('common.unknown', 'Unknown')}`, group: t('nav.requests', 'Requests'), icon: 'requests', item })),
    ...(dashboard?.pipeline || []).map((item, index): PaletteCommand => ({ id: `pipeline-${index}`, title: item.title, subtitle: `${item.service || t('common.pipeline', 'Pipeline')} · ${item.state || t('common.unknown', 'Unknown')}`, group: t('nav.pipeline', 'Pipeline'), icon: 'pipeline', item })),
    ...(dashboard?.allMedia?.length ? dashboard.allMedia : dashboard?.media || []).map((item, index): PaletteCommand => ({ id: `media-${item.ratingKey || index}`, title: item.title, subtitle: `${item.type || t('common.media', 'Media')} · ${item.year || item.library || t('common.library', 'Library')}`, group: t('nav.media', 'Library'), icon: 'media', item })),
    ...(dashboard?.services || []).map((item, index): PaletteCommand => ({ id: `service-${index}`, title: item.name, subtitle: `${item.state} · ${item.detail || ''}`, group: t('common.services', 'Services'), icon: 'services', item: { ...item, title: item.name } })),
  ];
  return [...pages, ...actions, ...live].filter((command) => `${command.title} ${command.subtitle}`.toLocaleLowerCase().includes(term)).slice(0, 80);
}
