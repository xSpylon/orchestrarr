import { useCallback, useRef, useState } from 'react';

/** An empty message is the drawer's way of asking to close, so it calls onEmpty instead of showing nothing.
 * A persistent message (for work still in progress) stays until the next message replaces it. */
export function useToast(onEmpty: () => void) {
  const [toastMessage, setToastMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const showToast = useCallback((message: string, persist = false) => {
    if (!message) { onEmpty(); return; }
    setToastMessage(message);
    window.clearTimeout(timer.current);
    if (persist) return;
    timer.current = window.setTimeout(() => setToastMessage((current) => current === message ? '' : current), 2600);
  }, [onEmpty]);
  return { toastMessage, showToast };
}
