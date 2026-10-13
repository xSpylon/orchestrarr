import type { SectionHeadingProps } from './SectionHeading.types';

export function SectionHeading({ title, count, description, actions, variant = 'section' }: SectionHeadingProps) {
  const content = <><div><h2>{title}{count !== undefined ? <span className="section-count">{count}</span> : null}</h2>{description ? <p>{description}</p> : null}</div>{actions}</>;
  return variant === 'operator' ? <header className="operator-section-heading">{content}</header> : <div className="section-head">{content}</div>;
}
