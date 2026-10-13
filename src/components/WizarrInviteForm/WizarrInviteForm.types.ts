import type { WizarrInvite } from '@/hooks/use_wizarr_manager';
import type { WizarrServer } from '@/components/WizarrManager/WizarrManager.types';

export type WizarrInviteFormProps = { servers: WizarrServer[]; invite: WizarrInvite };
