import type { Ref } from 'react';
import type { DiscoveryItem } from '@/types/dashboard.types';

export type DiscoverGridProps = { items: DiscoveryItem[]; onOpen: (item: DiscoveryItem) => void; ref?: Ref<HTMLDivElement> };
