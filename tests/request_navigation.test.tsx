import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/components/AppRoutes/AppRoutes';
import type { AppRoutesProps } from '../src/components/AppRoutes/AppRoutes.types';
import { parseAppRoute } from '../src/helpers/app_route';
import { DiscoveryPage } from '../src/pages/DiscoveryPage/DiscoveryPage';

const dashboard = { mode: 'demo', services: [], requests: [], links: { jellyseerr: 'https://requests.example.com' } } as AppRoutesProps['dashboard'];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('starting a request inside Orchestrarr', () => {
  it.each(['/', '/requests'])('keeps the primary title action inside the app from %s', (path) => {
    window.history.replaceState({}, '', path);
    const onNavigate = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<AppRoutes route={parseAppRoute(path)} locationKey={path} dashboard={dashboard}
      title={{ item: null, onEpisodeSelect: vi.fn() }}
      preferences={{ autoRefresh: false, technicalDetails: false, themePreference: 'dark', onThemeChange: vi.fn(), onAutoRefresh: vi.fn(), onTechnicalDetails: vi.fn() }}
      onNavigate={onNavigate} onSelect={vi.fn()} onOpenTitle={vi.fn()} onAction={vi.fn()}
      onEditService={vi.fn()} onToast={vi.fn()} onRefresh={vi.fn()} />);
    if (path === '/') {
      const discover = screen.getByRole('button', { name: 'Discover' });
      expect(discover).toHaveClass('solid-button');
      expect(screen.queryByRole('button', { name: 'New request' })).not.toBeInTheDocument();
      fireEvent.click(discover);
      expect(onNavigate).toHaveBeenCalledWith('discovery');
    } else {
      fireEvent.click(screen.getByRole('button', { name: 'New request' }));
      expect(onNavigate).toHaveBeenCalledWith('/discovery');
    }
    expect(open).not.toHaveBeenCalled();
  });

  it('searches discovery and opens the selected title', async () => {
    window.history.replaceState({}, '', '/discovery');
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: 123, title: 'Arrival', media_type: 'movie' }], total_pages: 1 }) });
    vi.stubGlobal('fetch', fetchMock);
    const onOpen = vi.fn();
    render(<DiscoveryPage dashboard={dashboard} onOpen={onOpen} />);
    expect(screen.getByRole('heading', { name: 'Discover', level: 1 })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Arrival' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form')!);
    fireEvent.click(await screen.findByRole('button', { name: /Open Arrival/ }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: '123', title: 'Arrival' }));
    expect(new URLSearchParams(window.location.search).get('q')).toBe('Arrival');
    expect(fetchMock).toHaveBeenCalledWith('/api/discovery?q=Arrival', expect.anything());
  });

  it('keeps normal discovery in browsing mode', async () => {
    window.history.replaceState({}, '', '/discovery');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [], total_pages: 1 }) }));
    render(<DiscoveryPage dashboard={dashboard} onOpen={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Discover', level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No titles matched this search. Try another title or spelling.')).toBeInTheDocument());
    expect(window.location.search).toBe('');
  });
});
