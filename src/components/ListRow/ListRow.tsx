import type { ListRowProps } from './ListRow.types';

export function ListRow({ title, detail, meta, tone, onClick }: ListRowProps) {
  const content = <><span className={`activity-marker${tone ? ` ${tone}` : ''}`} /><span><strong>{title}</strong>{detail ? <p>{detail}</p> : null}</span>{meta ? <span className="activity-meta">{meta}</span> : null}</>;
  return onClick ? <button className="activity-row" onClick={onClick}>{content}</button> : <div className="activity-row">{content}</div>;
}
