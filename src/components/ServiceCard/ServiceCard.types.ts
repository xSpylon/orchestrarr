import type { Service } from '@/types/dashboard.types';

export type ServiceCardProps = {
  service: Service;
  onSelect: (service: Service) => void;
  checkLabel?: string;
};
