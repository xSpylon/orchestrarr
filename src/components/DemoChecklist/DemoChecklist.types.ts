import type { DemoTour } from '@/types/dashboard.types';

export type DemoChecklistProps = {
  tour?: DemoTour;
  onNavigate: (view: string) => void;
};
