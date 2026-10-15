import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { useDialog } from '@/components/ui/use_dialog';
import { useLocale } from '@/lib/i18n';
import type { ConfirmationContextValue, ConfirmationOptions, ConfirmationProviderProps } from './ConfirmationProvider.types';

type ConfirmationRequest = ConfirmationOptions & {
  resolve: (confirmed: boolean) => void;
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirmation(): ConfirmationContextValue['confirm'] {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useConfirmation must be used inside ConfirmationProvider');
  return context.confirm;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [active, setActive] = useState<ConfirmationRequest | null>(null);
  const queue = useRef<ConfirmationRequest[]>([]);
  const { t } = useLocale();
  const dialogRef = useDialog(Boolean(active));

  const confirm = useCallback((options: ConfirmationOptions) => new Promise<boolean>((resolve) => {
    const request = { ...options, resolve };
    if (queue.current.length === 0) setActive(request);
    queue.current.push(request);
  }), []);

  const finish = useCallback((confirmed: boolean) => {
    const current = queue.current.shift();
    if (!current) return;
    current.resolve(confirmed);
    setActive(queue.current[0] || null);
  }, []);
  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return <ConfirmationContext.Provider value={contextValue}>
    {children}
    <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirmation-title" aria-describedby={active?.description ? 'confirmation-description' : undefined} onCancel={(event) => { event.preventDefault(); finish(false); }}>
      {active ? <>
        <div className="confirm-copy">
          <h2 id="confirmation-title">{active.title}</h2>
          {active.description ? <p id="confirmation-description">{active.description}</p> : null}
        </div>
        <div className="confirm-actions">
          <Button variant="quiet" onClick={() => finish(false)}>{t('common.cancel')}</Button>
          <Button variant={active.destructive ? 'ghost' : 'solid'} danger={active.destructive} onClick={() => finish(true)}>{t('common.confirm')}</Button>
        </div>
      </> : null}
    </dialog>
  </ConfirmationContext.Provider>;
}
