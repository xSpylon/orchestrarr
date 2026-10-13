import type { Service } from '@/types/dashboard.types';

export type InfrastructureServersProps = {
  servers: Service[];
  onSelect: (item: Service) => void;
};
