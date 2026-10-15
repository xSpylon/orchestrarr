import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationProvider, useConfirmation } from '../src/components/ConfirmationProvider/ConfirmationProvider';

function ConfirmationButton({ onResult }: { onResult: (confirmed: boolean) => void }) {
  const confirm = useConfirmation();
  return <button onClick={async () => onResult(await confirm({ title: 'Remove this user?', description: 'They will lose access.', destructive: true }))}>Remove user</button>;
}

describe('confirmation dialog', () => {
  it('shows the supplied copy and resolves the action from the user choice', async () => {
    const onResult = vi.fn();
    render(<ConfirmationProvider><ConfirmationButton onResult={onResult} /></ConfirmationProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Remove user' }));
    expect(await screen.findByRole('dialog', { name: 'Remove this user?' })).toBeInTheDocument();
    expect(screen.getByText('They will lose access.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('ghost-button', 'danger-button');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));

    fireEvent.click(screen.getByRole('button', { name: 'Remove user' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });
});
