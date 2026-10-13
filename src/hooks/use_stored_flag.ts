import { useCallback, useState } from 'react';

/** A boolean preference kept in localStorage; anything but the opposite of the fallback reads as the fallback. */
export function useStoredFlag(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => fallback ? localStorage.getItem(key) !== 'false' : localStorage.getItem(key) === 'true');
  const update = useCallback((next: boolean) => { setValue(next); localStorage.setItem(key, String(next)); }, [key]);
  return [value, update] as const;
}
