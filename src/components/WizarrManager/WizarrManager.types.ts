export type WizarrUser = { id: number; username?: string; email?: string; server?: string; server_type?: string; expires?: string | null; created_at?: string };
export type WizarrServer = { id: number; name: string; server_type?: string };
export type WizarrLibrary = { id: number; name: string; server_id?: number | string; serverId?: number | string; server?: { id?: number | string; name?: string } | string };
export type WizarrInvitation = { id: number; code?: string; url?: string; status?: string; expires?: string | null };
export type WizarrManagement = { users: WizarrUser[]; servers: WizarrServer[]; libraries: WizarrLibrary[] };
export type WizarrInvitationResponse = { invitation?: WizarrInvitation; url?: string; message?: string };
export type WizarrCreatedInvite = { url: string; code: string };

export type WizarrManagerProps = { onToast: (message: string) => void; onChanged: () => void; refreshKey?: string };
