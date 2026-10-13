import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { WizarrCreatedInvite, WizarrInvitationResponse, WizarrManagement, WizarrUser } from '@/components/WizarrManager/WizarrManager.types';

export type WizarrInviteOption = 'unlimitedUses' | 'allowDownloads' | 'allowLiveTv' | 'allowMobileUploads';
export type WizarrInvite = ReturnType<typeof useWizarrManager>['invite'];

const toggleId = (ids: number[], id: number, on: boolean) => on ? [...ids, id] : ids.filter((entry) => entry !== id);

/** Wizarr users and invitations: loading, removing users, and the create-invitation form. */
export function useWizarrManager({ onToast, onChanged, refreshKey = '' }: { onToast: (message: string) => void; onChanged: () => void; refreshKey?: string }) {
  const [data, setData] = useState<WizarrManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selectedServers, setSelectedServers] = useState<number[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<number[]>([]);
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [duration, setDuration] = useState('');
  const [options, setOptions] = useState<Record<WizarrInviteOption, boolean>>({ unlimitedUses: false, allowDownloads: false, allowLiveTv: false, allowMobileUploads: false });
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<WizarrCreatedInvite | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<WizarrManagement>('/api/wizarr/management');
      setData(result);
      setSelectedServers((current) => current.filter((id) => result.servers.some((server) => server.id === id)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Wizarr users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  // Libraries without a server work everywhere; the rest only show for a selected server.
  const availableLibraries = (data?.libraries || []).filter((library) => {
    const serverId = library.server_id ?? library.serverId ?? (typeof library.server === 'object' ? library.server.id : undefined);
    return serverId == null || selectedServers.includes(Number(serverId));
  });
  const visibleSelectedLibraries = selectedLibraries.filter((id) => availableLibraries.some((library) => library.id === id));

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedServers.length) return;
    setCreating(true);
    setError('');
    setCreatedInvite(null);
    try {
      const result = await apiRequest<WizarrInvitationResponse>('/api/wizarr/invitations', {
        method: 'POST',
        body: JSON.stringify({
          server_ids: selectedServers,
          expires_in_days: expiresInDays === 'never' ? null : Number(expiresInDays),
          duration: duration ? String(Number(duration)) : 'unlimited',
          unlimited: options.unlimitedUses,
          allow_downloads: options.allowDownloads,
          allow_live_tv: options.allowLiveTv,
          allow_mobile_uploads: options.allowMobileUploads,
          ...(selectedLibraries.length ? { library_ids: selectedLibraries.filter((id) => availableLibraries.some((library) => library.id === id)) } : {})
        })
      });
      // The server only returns a link when a public invite URL is set; otherwise show the code so it is still usable.
      setCreatedInvite({ url: result.invitation?.url || result.url || '', code: result.invitation?.code || '' });
      onToast('Wizarr invitation created');
      await load();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the invitation');
    } finally {
      setCreating(false);
    }
  }

  async function removeUser(user: WizarrUser) {
    const label = user.username || user.email || `User ${user.id}`;
    if (!window.confirm(`Remove ${label} from Wizarr? This may revoke their media-server access.`)) return;
    setRemovingId(user.id);
    setError('');
    try {
      await apiRequest(`/api/wizarr/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      onToast(`${label} removed from Wizarr`);
      await load();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not remove ${label}`);
    } finally {
      setRemovingId(null);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(createdInvite?.url || createdInvite?.code || '');
      onToast(createdInvite?.url ? 'Invitation link copied' : 'Invitation code copied');
    } catch {
      onToast('Could not copy the invitation link');
    }
  }

  return {
    data, loading, error, load, removingId, removeUser, createdInvite, copyInvite,
    invite: {
      expiresInDays, setExpiresInDays, duration, setDuration, options,
      setOption: (option: WizarrInviteOption, value: boolean) => setOptions((current) => ({ ...current, [option]: value })),
      selectedServers, toggleServer: (id: number, on: boolean) => setSelectedServers((current) => toggleId(current, id, on)),
      availableLibraries, visibleSelectedLibraries, toggleLibrary: (id: number, on: boolean) => setSelectedLibraries((current) => toggleId(current, id, on)),
      creating, create,
    },
  };
}
