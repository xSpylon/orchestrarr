import { DiscoverCard } from '@/components/DiscoverCard/DiscoverCard';
import type { DiscoverGridProps } from './DiscoverGrid.types';

export function DiscoverGrid({ items, onOpen, ref }: DiscoverGridProps) {
  return <div className="discovery-grid" ref={ref}>{items.map((item) => <DiscoverCard key={`${item.mediaType}-${item.id}`} item={item} onOpen={onOpen} />)}</div>;
}
