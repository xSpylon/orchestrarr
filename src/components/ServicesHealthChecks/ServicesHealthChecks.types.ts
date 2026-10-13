import type { Service } from '@/types/dashboard.types';

export type ServicesHealthChecksProps = {
  services: Service[];
  onSelect: (item: Service) => void;
};
