export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; the state is added ("enabled"/"disabled"). */
  label: string;
  disabled?: boolean;
};
