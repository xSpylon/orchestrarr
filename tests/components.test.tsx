import { act, fireEvent, render, within, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/Button/Button';
import { AboutPage } from '../src/pages/AboutPage/AboutPage';
import { DetailDrawer } from '../src/components/DetailDrawer/DetailDrawer';
import { DiscoverError } from '../src/components/DiscoverError/DiscoverError';
import { DiscoverSkeleton } from '../src/components/DiscoverSkeleton/DiscoverSkeleton';
import { EmptyState } from '../src/components/EmptyState/EmptyState';
import { FilterMenu } from '../src/components/FilterMenu/FilterMenu';
import { AppShellNavGroup } from '../src/components/AppShellNavGroup/AppShellNavGroup';
import { AppShellNavLink } from '../src/components/AppShellNavLink/AppShellNavLink';
import { AppShell } from '../src/components/AppShell/AppShell';
import { DataTable } from '../src/components/DataTable/DataTable';
import { SettingsAccess } from '../src/components/SettingsAccess/SettingsAccess';
import { IntegrationField } from '../src/components/IntegrationField/IntegrationField';
import { TitleProgress } from '../src/components/TitleProgress/TitleProgress';
import { TitlePending } from '../src/components/TitlePending/TitlePending';
import { LoginForm } from '../src/components/LoginForm/LoginForm';
import { Toggle } from '../src/components/Toggle/Toggle';
import { useAccessSettings } from '../src/hooks/use_access_settings';
import { useActivityFilters } from '../src/hooks/use_activity_filters';
import { useAppDrawer } from '../src/hooks/use_app_drawer';
import { useAppShellSidebar } from '../src/hooks/use_app_shell_sidebar';
import { useKeyboardShortcuts } from '../src/hooks/use_keyboard_shortcuts';
import { useCalendarMonth } from '../src/hooks/use_calendar_month';
import { useLibraryFilters } from '../src/hooks/use_library_filters';
import { useStoredFlag } from '../src/hooks/use_stored_flag';
import { useThemePreference } from '../src/hooks/use_theme_preference';
import { useToast } from '../src/hooks/use_toast';
import { SettingsPage } from '../src/pages/SettingsPage/SettingsPage';
import { setAuthorizationHeader } from '../src/lib/api';
import { rememberPosterClick, takeClickedPoster, transitionToTitle } from '../src/lib/poster_transition';

describe('core controls', () => {
  it('renders a button variant and forwards clicks', () => {
    const onClick = vi.fn();
    render(<Button variant="solid" size="small" onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('solid-button', 'button-small');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reports the next toggle state and exposes it accessibly', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle checked label="Notifications" onChange={onChange} />);
    const toggle = screen.getByRole('button', { name: 'Notifications enabled' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
    rerender(<Toggle checked={false} label="Notifications" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Notifications disabled' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('can disable a toggle while its setting is loading or saving', () => {
    const onChange = vi.fn();
    render(<Toggle checked label="Demo mode" disabled onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Demo mode enabled' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Demo mode enabled' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('demo mode shell state', () => {
  const shellProps = {
    view: 'overview',
    dashboard: { mode: 'demo', demoProfile: 'medium', alerts: [], services: [] } as never,
    lastSync: '',
    onNavigate: vi.fn(),
    onSearch: vi.fn(),
    onRefresh: vi.fn(),
    onAlerts: vi.fn(),
    theme: 'dark' as const,
    onThemeToggle: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
  });

  it('keeps a persistent demo banner visible in the shell', () => {
    render(<AppShell {...shellProps}>Workspace</AppShell>);
    expect(screen.getByRole('status')).toHaveTextContent('Demo mode');
    expect(screen.getByRole('status')).toHaveTextContent('Connected services are not being queried');
  });

  it('does not show the demo banner for live data', () => {
    render(<AppShell {...shellProps} dashboard={{ mode: 'live', alerts: [], services: [] } as never}>Workspace</AppShell>);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('lets the banner change the usage profile and open settings', () => {
    const onDemoProfileChange = vi.fn();
    const onNavigate = vi.fn();
    render(<AppShell {...shellProps} onNavigate={onNavigate} onDemoProfileChange={onDemoProfileChange}>Workspace</AppShell>);
    fireEvent.change(screen.getByRole('combobox', { name: 'Demo usage profile' }), { target: { value: 'large' } });
    expect(onDemoProfileChange).toHaveBeenCalledWith('large');
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('shows a demo checklist that ticks off done tasks and links to the right page', () => {
    const onNavigate = vi.fn();
    render(<AppShell {...shellProps} onNavigate={onNavigate} dashboard={{ mode: 'demo', demoTour: { requested: true, approved: false, declined: false, imported: false, paused: false, blocklisted: false, invited: false, removed: false }, alerts: [], services: [] } as never}>Workspace</AppShell>);
    const checklist = screen.getByRole('region', { name: 'Try the demo' });
    expect(checklist).toHaveTextContent('1 of 8 done');
    expect(within(checklist).getByRole('button', { name: /Request “Daybreak Motel”.*Discover/ })).toHaveTextContent('Done');
    fireEvent.click(within(checklist).getByRole('button', { name: /Blocklist a stalled download/ }));
    expect(onNavigate).toHaveBeenLastCalledWith('pipeline');
    fireEvent.click(within(checklist).getByRole('button', { name: /Remove someone's access/ }));
    expect(onNavigate).toHaveBeenCalledWith('access');
    fireEvent.click(within(checklist).getByRole('button', { name: /Approve your request/ }));
    expect(onNavigate).toHaveBeenCalledWith('requests');
    fireEvent.click(within(checklist).getByRole('button', { name: 'Hide checklist' }));
    expect(within(checklist).queryByRole('button', { name: /Approve your request/ })).toBeNull();
    fireEvent.click(within(checklist).getByRole('button', { name: 'Show checklist' }));
    expect(within(checklist).getByRole('button', { name: /Approve your request/ })).toBeInTheDocument();
  });

  it('ends the demo checklist with a way to install your own', () => {
    const all = { requested: true, approved: true, declined: true, imported: true, paused: true, blocklisted: true, invited: true, removed: true };
    render(<AppShell {...shellProps} dashboard={{ mode: 'demo', demoTour: all, alerts: [], services: [] } as never}>Workspace</AppShell>);
    const checklist = screen.getByRole('region', { name: 'Try the demo' });
    expect(checklist).toHaveTextContent('That was everything. Ready for your own server?');
    const install = within(checklist).getByRole('link', { name: 'Install Orchestrarr' });
    expect(install).toHaveAttribute('href', 'https://orchestrarr.com');
    expect(install).toHaveAttribute('target', '_blank');
    expect(install).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not show the demo checklist for live data', () => {
    render(<AppShell {...shellProps} dashboard={{ mode: 'live', alerts: [], services: [] } as never}>Workspace</AppShell>);
    expect(screen.queryByRole('region', { name: 'Try the demo' })).toBeNull();
  });

  it('marks a public demo as shared and points to installing your own, without the profile switch', () => {
    render(<AppShell {...shellProps} dashboard={{ mode: 'demo', publicDemo: true, alerts: [], services: [] } as never} onDemoProfileChange={vi.fn()}>Workspace</AppShell>);
    expect(screen.getByRole('status')).toHaveTextContent('Public demo');
    expect(screen.getByRole('status')).toHaveTextContent('Your changes only show for you');
    expect(screen.getByRole('link', { name: 'Install your own' })).toHaveAttribute('href', 'https://orchestrarr.com');
    expect(screen.getByRole('link', { name: 'Install your own' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('combobox', { name: 'Demo usage profile' })).toBeNull();
  });
});

describe('AboutPage', () => {
  it('keeps project and third-party links opening in a new tab', () => {
    render(<AboutPage dashboard={{ mode: 'demo', runtime: { uptime: '1 minute' } } as never} />);
    const links = screen.getByRole('region', { name: 'About' }).querySelectorAll('a');
    expect(links).toHaveLength(9);
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
    expect(screen.getByRole('heading', { name: 'About', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project identity', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Built with', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TMDB usage and attribution', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText('Settings')).toBeNull();
  });
});

describe('LoginForm', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => setAuthorizationHeader(''));
  afterEach(() => {
    globalThis.fetch = originalFetch;
    setAuthorizationHeader('');
  });

  it('logs in with an API key and confirms the server session', async () => {
    const onAuthenticated = vi.fn();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true }), { status: 200 }));
    globalThis.fetch = fetchMock;
    render(<LoginForm mode="apikey" onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('Orchestrarr API key'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/login', expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'secret' }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/status', expect.objectContaining({ credentials: 'same-origin' }));
  });

  it('shows the API error and does not authenticate after a failed login', async () => {
    const onAuthenticated = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Invalid access key' }), { status: 401 }));
    render(<LoginForm mode="apikey" onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('Orchestrarr API key'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid access key');
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});

describe('filters and navigation hooks', () => {
  it('filters activity, updates the URL and reveals more results', () => {
    const dashboard = {
      generatedAt: '2026-10-13T12:00:00.000Z',
      activity: [
        { title: 'Movie', detail: 'Downloaded', service: 'Radarr', severity: 'info', type: 'download', at: '2026-10-13T11:00:00.000Z' },
        { title: 'Old', detail: 'Ignored', service: 'Sonarr', severity: 'failed', type: 'error', at: '2026-10-01T11:00:00.000Z' },
      ],
      alerts: [{ title: 'Alert', service: 'Radarr', severity: 'attention', updatedAt: '2026-10-13T11:30:00.000Z', resolved: false }],
    };
    const { result } = renderHook(() => useActivityFilters(dashboard));
    act(() => { result.current.setFilter('all'); result.current.setMediaQuery('movie'); });
    expect(result.current.filtered).toHaveLength(1);
    expect(window.location.pathname + window.location.search).toBe('/activity?filter=all');
    act(() => result.current.showMore());
    expect(result.current.visible).toHaveLength(1);
  });

  it('filters the library by type and search and resets pagination', () => {
    const dashboard = {
      media: [{ title: 'Movie', type: 'movie', year: 2025 }, { title: 'Show', type: 'show', year: 2024, episodeCount: 8 }],
      allMedia: [{ title: 'Movie', type: 'movie', year: 2025 }, { title: 'Show', type: 'show', year: 2024, episodeCount: 8 }],
    };
    const { result } = renderHook(() => useLibraryFilters(dashboard));
    act(() => { result.current.setType('show'); result.current.setQuery('show'); });
    expect(result.current.label).toBe('Shows');
    expect(result.current.pageItems).toHaveLength(1);
    expect(result.current.episodeCount).toBe(8);
    expect(window.location.pathname).toBe('/media');
  });

  it('sorts the library by the date items were added', () => {
    window.history.replaceState({}, '', '/media');
    const dashboard = {
      media: [{ title: 'Oldest', type: 'movie', year: 2020, addedAt: '2024-01-01T12:00:00.000Z' }],
      allMedia: [
        { title: 'Oldest', type: 'movie', year: 2020, addedAt: '2024-01-01T12:00:00.000Z' },
        { title: 'Newest', type: 'movie', year: 2018, addedAt: '2026-01-01T12:00:00.000Z' },
        { title: 'Middle', type: 'movie', year: 2025, addedAt: '2025-01-01T12:00:00.000Z' },
      ],
    };
    const { result } = renderHook(() => useLibraryFilters(dashboard));
    act(() => result.current.setSort('added'));
    expect(result.current.pageItems.map((item) => item.title)).toEqual(['Newest', 'Middle', 'Oldest']);
    expect(window.location.search).toBe('?sort=added');
  });

  it('reloads calendar data when the demo profile changes', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [{ title: 'Small profile release' }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [{ title: 'Large profile release' }] }), { status: 200 }));
    globalThis.fetch = fetchMock;
    window.history.replaceState({}, '', '/calendar');

    try {
      const { result, rerender } = renderHook(({ profile }) => useCalendarMonth(profile), { initialProps: { profile: 'small' } });
      await waitFor(() => expect(result.current.entries[0]?.title).toBe('Small profile release'));
      rerender({ profile: 'large' });
      await waitFor(() => expect(result.current.entries[0]?.title).toBe('Large profile release'));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('paginates a full library page', () => {
    window.history.replaceState({}, '', '/media');
    const movies = Array.from({ length: 41 }, (_, index) => ({ title: `Movie ${index}`, type: 'movie', year: 2025 }));
    const { result } = renderHook(() => useLibraryFilters({ media: movies, allMedia: movies }));
    expect(result.current.pageCount).toBe(2);
    act(() => result.current.setPage(2));
    expect(result.current.pageItems).toHaveLength(1);
  });

  it('keeps drawer modes exclusive and closes both', () => {
    const item = { title: 'Movie' };
    const { result } = renderHook(() => useAppDrawer());
    act(() => result.current.showItem(item));
    expect(result.current.drawerItem).toEqual(item);
    expect(result.current.editingService).toBeNull();
    act(() => result.current.editService('radarr'));
    expect(result.current.drawerItem).toBeNull();
    expect(result.current.editingService).toBe('radarr');
    act(() => result.current.closeDrawer());
    expect(result.current.editingService).toBeNull();
  });

  it('opens the command palette and navigates with G shortcuts while ignoring inputs', () => {
    const navigate = vi.fn();
    const setPaletteOpen = vi.fn();
    renderHook(() => useKeyboardShortcuts(navigate, setPaletteOpen));
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: '/' });
    fireEvent.keyDown(document.body, { key: 'g' });
    fireEvent.keyDown(document.body, { key: 's' });
    expect(setPaletteOpen).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/services');
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    fireEvent.keyDown(input, { key: '/' });
    expect(setPaletteOpen).toHaveBeenCalledTimes(2);
  });
});

describe('settings, filters and detail interactions', () => {
  it('changes theme, persists it and follows system changes', () => {
    const listeners = new Set<() => void>();
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true, addEventListener: (_event: string, listener: () => void) => listeners.add(listener), removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener) })) });
    const toast = vi.fn();
    const { result } = renderHook(() => useThemePreference(toast));
    act(() => result.current.changeTheme('light'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(toast).toHaveBeenCalled();
    act(() => result.current.changeTheme('system'));
    expect(result.current.theme).toBe('light');
    act(() => [...listeners].forEach((listener) => listener()));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('persists stored boolean preferences', () => {
    const { result } = renderHook(() => useStoredFlag('sidebar-collapsed', false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('submits access settings with the selected authentication mode', async () => {
    const saveConfig = vi.fn().mockResolvedValue(true);
    const settings = { config: { authMode: 'none', auth: { mode: 'none', username: 'admin' } }, loaded: true, saving: false, saveConfig };
    render(<SettingsAccess settings={settings} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'basic' } });
    fireEvent.change(document.querySelector('input[autocomplete="username"]'), { target: { value: 'sven' } });
    fireEvent.change(screen.getByPlaceholderText('Required'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save access' }).closest('form'));
    await waitFor(() => expect(saveConfig).toHaveBeenCalled());
    expect(saveConfig.mock.calls[0][0]).toEqual({ auth: { mode: 'basic', username: 'sven', password: 'secret' } });
  });

  it('chooses a filter option and closes on Escape', () => {
    const onChange = vi.fn();
    render(<FilterMenu label="Service" value="all" options={[{ value: 'all', label: 'All services' }, { value: 'radarr', label: 'Radarr' }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Service/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Radarr' }));
    expect(onChange).toHaveBeenCalledWith('radarr');
    fireEvent.click(screen.getByRole('button', { name: /Service/ }));
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Service' }), { key: 'Escape' });
    expect(screen.queryByRole('listbox', { name: 'Service' })).toBeNull();
  });

  it('keeps the title progress and service action states visible', () => {
    render(<TitleProgress relatedRequest={{ title: 'Movie', requester: 'Sven', age: 'today', state: 'Downloading' }} plexLibraryMatch={{ status: 'missing' }} currentStage={3} progressStage={3} matchedPipeline={[{ title: 'Movie', service: 'Radarr', state: 'Downloading', detail: '42%' }]} />);
    expect(screen.getByText('Requested by Sven · today')).toBeInTheDocument();
    expect(screen.getByText('Radarr')).toBeInTheDocument();
    expect(screen.getAllByText('Downloading').length).toBeGreaterThanOrEqual(2);
  });

  it('renders loading, empty, error and integration field states accessibly', () => {
    const onRetry = vi.fn();
    const onChange = vi.fn();
    render(<><DiscoverSkeleton count={2} /><EmptyState title="Nothing here" role="status">Try another filter.</EmptyState><DiscoverError message="Network unavailable" onRetry={onRetry} /><TitlePending short lines={2} /><IntegrationField fieldKey="apiKey" label="API key" value="" onChange={onChange} /></>);
    expect(screen.getByRole('status', { name: 'Loading titles' })).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Leave blank to keep current value')).toHaveAttribute('type', 'password');
  });

  it('opens and closes the detail drawer while restoring focus', () => {
    const onClose = vi.fn();
    render(<DetailDrawer title="Movie" open onClose={onClose}><p>Details</p></DetailDrawer>);
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps navigation links accessible and preserves modified-click behavior', () => {
    const onNavigate = vi.fn();
    render(<AppShellNavLink navKey="settings" label="Settings" active count={2} showTitle onNavigate={onNavigate} />);
    const link = screen.getByRole('link', { name: 'Settings2' });
    expect(link).toHaveAttribute('aria-current', 'page');
    link.setAttribute('href', '#');
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith('settings');
    const modifiedClick = new MouseEvent('click', { bubbles: true, metaKey: true });
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    modifiedClick.preventDefault();
    link.dispatchEvent(modifiedClick);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders the About navigation icon', () => {
    render(<AppShellNavLink navKey="about" label="About" active showTitle onNavigate={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'About' }).querySelector('path')).toHaveAttribute('d', expect.stringContaining('M12 2'));
  });

  it('folds navigation groups and exposes their state', () => {
    const onToggle = vi.fn();
    render(<AppShellNavGroup group="Media" folded count={2} hidden onToggle={onToggle}><a href="/media">Library</a></AppShellNavGroup>);
    const toggle = screen.getByRole('button', { name: 'Media2' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.nav-group-items')).toHaveAttribute('hidden');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('supports desktop collapse shortcuts and mobile menu state', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
    const { result } = renderHook(() => useAppShellSidebar('overview', undefined));
    expect(result.current.mobile).toBe(false);
    act(() => result.current.toggleCollapsed());
    expect(result.current.collapsed).toBe(true);
    act(() => result.current.openMenu());
    expect(result.current.menuOpen).toBe(true);
    act(() => result.current.closeMenu());
    expect(result.current.menuOpen).toBe(false);

    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
    const mobile = renderHook(() => useAppShellSidebar('media', 'Media'));
    expect(mobile.result.current.mobile).toBe(true);
    act(() => mobile.result.current.openMenu());
    expect(mobile.result.current.menuOpen).toBe(true);
  });

  it('remembers a poster click and clears the transition name after a view transition', async () => {
    const card = document.createElement('article');
    card.dataset.posterKey = 'movie-123';
    const poster = document.createElement('div');
    poster.dataset.poster = 'true';
    const image = document.createElement('img');
    image.src = '/movie.jpg';
    poster.append(image);
    card.append(poster);
    document.body.append(card);
    rememberPosterClick({ target: image } as unknown as MouseEvent);
    expect(takeClickedPoster()?.key).toBe('movie-123');
    const titlePoster = document.createElement('div');
    titlePoster.className = 'universal-media-poster';
    document.body.append(titlePoster);
    const transition = { finished: Promise.resolve() };
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: false })) });
    document.startViewTransition = vi.fn((update) => { update(); return transition; });
    const remembered = { element: poster, key: 'movie-123', src: '/movie.jpg' };
    transitionToTitle(remembered, () => {});
    await transition.finished;
    expect(poster.style.viewTransitionName).toBe('');
  });
});

describe('switching demo mode', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; vi.useRealTimers(); });

  it('keeps a persistent toast until another message replaces it', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(() => {}));
    act(() => result.current.showToast('Switching to live data…', true));
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current.toastMessage).toBe('Switching to live data…');
    act(() => result.current.showToast('Demo mode off'));
    expect(result.current.toastMessage).toBe('Demo mode off');
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.toastMessage).toBe('');
  });

  it('says it is switching while the dashboard reloads, then says where it landed', async () => {
    let config = { demoMode: true, demoProfile: 'medium', services: {} };
    globalThis.fetch = vi.fn(async (_path: string, init?: RequestInit) => {
      if (init?.method === 'PUT') { config = { ...config, ...JSON.parse(String(init.body)) }; return new Response(JSON.stringify({ ok: true }), { status: 200 }); }
      return new Response(JSON.stringify(config), { status: 200 });
    }) as typeof fetch;
    let finishReload = () => {};
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => { finishReload = resolve; }));
    const onToast = vi.fn();
    render(<SettingsPage dashboard={{ mode: 'demo', services: [] } as never} autoRefresh technicalDetails={false} themePreference="system" onThemeChange={vi.fn()} onAutoRefresh={vi.fn()} onTechnicalDetails={vi.fn()} onToast={onToast} onNavigate={vi.fn()} onRefresh={onRefresh} />);
    const toggle = await screen.findByRole('button', { name: 'Demo mode enabled' });
    await waitFor(() => expect(toggle).not.toBeDisabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(onToast).toHaveBeenLastCalledWith('Switching to live data…', true);
    await act(async () => { finishReload(); });
    await waitFor(() => expect(onToast).toHaveBeenLastCalledWith('Demo mode off · showing live data'));
  });

  it('cannot be switched off in a public demo', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ demoMode: true, publicDemo: true, demoProfile: 'medium', services: {} }), { status: 200 })) as typeof fetch;
    render(<SettingsPage dashboard={{ mode: 'demo', publicDemo: true, services: [] } as never} autoRefresh technicalDetails={false} themePreference="system" onThemeChange={vi.fn()} onAutoRefresh={vi.fn()} onTechnicalDetails={vi.fn()} onToast={vi.fn()} onNavigate={vi.fn()} onRefresh={vi.fn()} />);
    const toggle = await screen.findByRole('button', { name: 'Demo mode enabled' });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(toggle).toBeDisabled();
    expect(screen.queryByRole('combobox', { name: 'Demo usage profile' })).toBeNull();
  });
});

describe('data table', () => {
  it('shows when a row was updated as a readable time, not a raw timestamp', () => {
    const updated = new Date(2026, 2, 3, 9, 5).toISOString();
    render(<DataTable items={[{ title: 'Sintel', service: 'Radarr', state: 'Downloading', updated }]} empty="Nothing" onSelect={vi.fn()} />);
    expect(screen.queryByText(updated)).toBeNull();
    expect(screen.getByText(/^(3 Mar( 2026)?)$/)).toBeInTheDocument();
  });
});
