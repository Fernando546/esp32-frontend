'use client';

import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((registration) => {
        console.log('ServiceWorker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('ServiceWorker registration failed:', error);
      });
    }
  }, []);

  return <>{children}</>;
}
