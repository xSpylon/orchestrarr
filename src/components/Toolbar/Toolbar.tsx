import type { ToolbarProps } from './Toolbar.types';

/** The row above a collection: search, filter chips, and (after a ToolbarSpacer) sort. */
export function Toolbar({ children }: ToolbarProps) {
  return <div className="filter-toolbar">{children}</div>;
}

/** Pushes what follows (usually Sort) to the right; hidden on phones. */
export function ToolbarSpacer() {
  return <span className="toolbar-spacer" />;
}
