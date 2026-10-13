export type SearchFieldProps = {
  /** Accessible name, read by screen readers instead of the placeholder. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};
