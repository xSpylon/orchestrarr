export type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Accessible name, e.g. "Request pages". */
  label: string;
};
