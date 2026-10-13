import type { WizarrManagement, WizarrUser } from '@/components/WizarrManager/WizarrManager.types';

export type WizarrUsersProps = {
  data: WizarrManagement | null;
  loading: boolean;
  removingId: number | null;
  onRefresh: () => void;
  onRemove: (user: WizarrUser) => void;
};
