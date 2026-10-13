import type { SettingsRowProps } from './SettingsRow.types';

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return <div className="settings-row"><div><strong>{title}</strong><small>{description}</small></div>{children}</div>;
}
