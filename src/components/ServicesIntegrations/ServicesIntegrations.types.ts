import type { Service } from '@/types/dashboard.types';

export type ServicesIntegrationsProps = {
  services: Service[];
  links?: Record<string, string>;
  onSelect: (item: Service) => void;
  onEdit: (key: string) => void;
};
