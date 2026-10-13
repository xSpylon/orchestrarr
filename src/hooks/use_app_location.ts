import { useCallback, useEffect, useState } from 'react';
import { rememberPosterClick, transitionFromTitle } from '@/lib/poster_transition';

export type AppLocation = { pathname: string; search: string };
export type AppNavigate = (destination: string, replace?: boolean, preserveScroll?: boolean, state?: Record<string, unknown>) => void;

function readLocation(): AppLocation {
  return { pathname: window.location.pathname, search: window.location.search };
}

/** History-backed location. onPopState runs on Back/Forward, onNavigate on every in-app navigation. */
export function useAppLocation({ onPopState, onNavigate }: { onPopState: () => void; onNavigate: () => void }) {
  const [location, setLocation] = useState<AppLocation>(readLocation);

  useEffect(() => {
    // Back/forward returns each page to where it was scrolled (saved by navigate), before the poster morphs into its card.
    const restoreScroll = () => { const main = document.getElementById('main-content'); if (main) main.scrollTop = Number(window.history.state?.scrollTop) || 0; };
    const popState = () => transitionFromTitle(() => { setLocation(readLocation()); onPopState(); }, restoreScroll);
    window.addEventListener('popstate', popState);
    document.addEventListener('click', rememberPosterClick, true);
    return () => { window.removeEventListener('popstate', popState); document.removeEventListener('click', rememberPosterClick, true); };
  }, [onPopState]);

  const navigate = useCallback<AppNavigate>((destination, replace = false, preserveScroll = false, state = {}) => {
    const url = destination.startsWith('/') ? destination : `/${destination}`;
    // Remember how far the page we leave was scrolled, so Back can return there.
    if (!replace) window.history.replaceState({ ...(window.history.state || {}), scrollTop: document.getElementById('main-content')?.scrollTop || 0 }, '');
    if (replace) window.history.replaceState(state, '', url); else window.history.pushState(state, '', url);
    setLocation(readLocation());
    onNavigate();
    document.body.classList.remove('nav-open');
    document.querySelector('.mobile-menu-button')?.setAttribute('aria-expanded', 'false');
    if (!preserveScroll) { window.scrollTo({ top: 0 }); document.getElementById('main-content')?.scrollTo({ top: 0 }); }
  }, [onNavigate]);

  return { location, navigate };
}
