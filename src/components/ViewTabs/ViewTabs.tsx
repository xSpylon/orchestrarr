import type { KeyboardEvent } from 'react';
import type { ViewTabsProps } from './ViewTabs.types';

export function ViewTabs({ id, label, tabs, value, onChange, children }: ViewTabsProps) {
  const select = (next: string) => {
    onChange(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(tabs[(target + tabs.length) % tabs.length].value);
  };
  return <>
    <div className="view-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => <button key={tab.value} id={`${id}-tab-${tab.value}`} className={`view-tab${tab.value === value ? ' active' : ''}`} role="tab" aria-selected={tab.value === value} aria-controls={`${id}-panel`} tabIndex={tab.value === value ? 0 : -1} onKeyDown={onKeyDown} onClick={() => onChange(tab.value)}>
        {tab.label}{tab.count === undefined ? null : <span>{tab.count}</span>}
      </button>)}
    </div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${value}`}>{children}</div>
  </>;
}
