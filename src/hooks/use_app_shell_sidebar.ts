import { useEffect, useState } from 'react';
import { useDialog } from '@/components/ui/use_dialog';

const MOBILE_QUERY = '(max-width: 760px)';

function toggleStoredCollapse(value: boolean) {
  localStorage.setItem('sidebarCollapsed', String(!value));
  return !value;
}

/** Sidebar state: collapsed on desktop (remembered, toggled with [), a dialog menu on mobile, and per-group folding. */
export function useAppShellSidebar(view: string, activeGroup: string | undefined) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE_QUERY).matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useDialog(menuOpen && mobile);
  // Navigating unfolds the group of the page you land on and closes the mobile menu.
  const [location, setLocation] = useState(`${view}|${activeGroup}`);
  if (location !== `${view}|${activeGroup}`) {
    setLocation(`${view}|${activeGroup}`);
    if (activeGroup) setCollapsedGroups((current) => ({ ...current, [activeGroup]: false }));
    setMenuOpen(false);
  }

  useEffect(() => {
    const query = matchMedia(MOBILE_QUERY);
    const change = () => { setMobile(query.matches); setMenuOpen(false); };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]');
      if (event.key !== '[' || typing || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]') || matchMedia(MOBILE_QUERY).matches) return;
      setCollapsed(toggleStoredCollapse);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return {
    collapsed, mobile, menuOpen, menuRef, collapsedGroups,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
    toggleCollapsed: () => setCollapsed(toggleStoredCollapse),
    toggleGroup: (group: string) => setCollapsedGroups((current) => ({ ...current, [group]: !current[group] })),
  };
}
