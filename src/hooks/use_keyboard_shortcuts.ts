import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { shortcutDestination } from '@/lib/navigation';
import type { AppNavigate } from './use_app_location';

/** ⌘K and / open the palette; G then a letter jumps to a page. */
export function useKeyboardShortcuts(navigate: AppNavigate, setPaletteOpen: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      const dialogOpen = document.querySelector('dialog[open]');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!dialogOpen || dialogOpen.classList.contains('palette-dialog')) setPaletteOpen((value) => !value);
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !typing && !dialogOpen) { event.preventDefault(); setPaletteOpen(true); }
      if (typing || dialogOpen || event.metaKey || event.ctrlKey || event.altKey) return;
      const destination = shortcutDestination(previousKey, event.key);
      previousKey = destination ? '' : event.key;
      window.clearTimeout(resetKey);
      resetKey = window.setTimeout(() => { previousKey = ''; }, 1000);
      if (destination) { event.preventDefault(); navigate(destination); }
    };
    let previousKey = '';
    let resetKey: number | undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); window.clearTimeout(resetKey); };
  }, [navigate, setPaletteOpen]);
}
