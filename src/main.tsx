import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { ConfirmationProvider } from '@/components/ConfirmationProvider/ConfirmationProvider';
import { LocaleProvider } from '@/lib/i18n';
import '@fontsource-variable/inter';
import '@/styles/main.scss';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root element');

createRoot(root).render(<React.StrictMode><LocaleProvider><ConfirmationProvider><App /></ConfirmationProvider></LocaleProvider></React.StrictMode>);
