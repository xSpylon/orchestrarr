import type { Service } from '@/types/dashboard.types';
import type { IntegrationDefinition } from '@/components/ServicesIntegrations/integration_definitions';

export type ServicesIntegrationCardProps = {
  definition: IntegrationDefinition;
  /** Missing when the integration is not configured. */
  service?: Service;
  /** The service's own web UI, when known. */
  url?: string;
  onSelect: (item: Service) => void;
  onEdit: (key: string) => void;
};
