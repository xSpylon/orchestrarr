import type { WordmarkProps } from './Brand.types';

export const BRAND_NAME = 'Orchestrarr';

// Keep the inline mark and public/favicon.svg in sync when the geometry changes.
export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24">
    <path d="M1.50 17.00A10.5 10.5 0 0 1 5.98 8.40M8.24 7.20A10.5 10.5 0 0 1 15.76 7.20M18.02 8.40A10.5 10.5 0 0 1 22.50 17.00" opacity=".35" />
    <path d="M5.00 17.00A7 7 0 0 1 7.98 11.27M9.49 10.46A7 7 0 0 1 14.51 10.46M16.02 11.27A7 7 0 0 1 19.00 17.00" opacity=".65" />
    <path d="M8.50 17.00A3.5 3.5 0 0 1 15.50 17.00" />
    <circle cx="12" cy="17" r="1.7" />
  </svg></span>;
}

export function Wordmark({ subtitle }: WordmarkProps) {
  return <span className="brand-copy"><strong>Orchestr<span className="brand-arr">arr</span></strong>{subtitle ? <small>{subtitle}</small> : null}</span>;
}
