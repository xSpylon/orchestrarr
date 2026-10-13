import { useCallback, useState } from 'react';
import type { DashboardItem } from '@/types/dashboard.types';

/** The detail drawer shows either an item or the editor for one service, never both. */
export function useAppDrawer() {
  const [drawerItem, setDrawerItem] = useState<DashboardItem | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const closeDrawer = useCallback(() => { setDrawerItem(null); setEditingService(null); }, []);
  const showItem = useCallback((item: DashboardItem) => { setDrawerItem(item); setEditingService(null); }, []);
  const editService = useCallback((key: string) => { setEditingService(key); setDrawerItem(null); }, []);
  return { drawerItem, editingService, closeDrawer, showItem, editService };
}
