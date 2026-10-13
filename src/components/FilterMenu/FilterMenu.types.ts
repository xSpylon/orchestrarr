export type FilterOption = { value: string; label: string };
export type FilterMenuProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** The value that means "no filter". Chips at this value read quietly and show no clear button. */
  defaultValue?: string;
  /** Sort menus always have a value, so they never offer a clear button. */
  clearable?: boolean;
};
