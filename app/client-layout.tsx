'use client';

import { useEffect, useState } from 'react';

// Funkcja do konwersji Base64 URL-encoded na Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function unsubscribeOldSubscription() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    console.log('Old subscription removed.');
  }
}

async function setupPushNotifications() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const registration = await navigator.serviceWorker.ready;

        // Remove old subscription if it exists
        await unsubscribeOldSubscription();

        // Subscribe with the new applicationServerKey
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log('Subscription successful:', subscription);

        await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
      } else {
        console.log('Notification permission denied.');
      }
    } catch (error) {
      console.error('Error in setupPushNotifications:', error);
    }
  }
}


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('ServiceWorker registered with scope:', registration.scope);
          await setupPushNotifications();
        } catch (error) {
          console.error('ServiceWorker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
