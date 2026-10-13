import { SectionHeading } from '@/components/SectionHeading/SectionHeading';
import type { LibrarySectionProps } from './LibrarySection.types';

export function LibrarySection({ title, description, children }: LibrarySectionProps) {
  return <section className="media-library-section">
    <SectionHeading title={title} description={description} />
    {children}
  </section>;
}
