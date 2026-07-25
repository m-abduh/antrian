'use client';

import { useEffect, useState } from 'react';
import api from '../axios';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const getSubscription = async () => {
    if (!VAPID_PUBLIC_KEY) return null;
    if (typeof Notification === 'undefined') return null;
    if (Notification.permission !== 'granted') await requestPermission();
    if (Notification.permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  };

  const subscribe = async (slug?: string) => {
    const sub = await getSubscription();
    if (!sub || !slug) return sub;

    try {
      await api.post(`/merchant/${slug}/subscribe`, sub.toJSON());
    } catch {
      // silently fail
    }
    return sub;
  };

  return { permission, requestPermission, subscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
