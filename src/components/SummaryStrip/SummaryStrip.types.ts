import type { ReactNode } from 'react';

export type SummaryItem = { label: ReactNode; value: ReactNode };
export type SummaryStripProps = { items: SummaryItem[] };
