import type { ActivityItem } from '@/types/dashboard.types';

export type ActivityDayGroupProps = { day: string; rows: ActivityItem[]; onSelect: (item: ActivityItem) => void };
