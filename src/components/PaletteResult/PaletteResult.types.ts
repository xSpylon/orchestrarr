import type { PaletteCommand } from '@/helpers/palette_commands';

export type PaletteResultProps = {
  command: PaletteCommand;
  index: number;
  selected: boolean;
  /** Repeats the group label above the first command of each group. */
  showGroup: boolean;
  onHover: () => void;
  onChoose: () => void;
};
