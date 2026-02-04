'use client';

import { LanguageProvider } from './LanguageContext';
import { NotificationProvider } from './NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </LanguageProvider>
  );
}
