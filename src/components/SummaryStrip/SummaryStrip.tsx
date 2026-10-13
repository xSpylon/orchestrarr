import type { SummaryStripProps } from './SummaryStrip.types';

export function SummaryStrip({ items }: SummaryStripProps) {
  return <div className="view-summary">{items.map((item, index) => <div className="summary-cell" key={index}><strong>{item.value}</strong><small>{item.label}</small></div>)}</div>;
}
