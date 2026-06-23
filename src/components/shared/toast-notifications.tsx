"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export function ToastNotifications() {
  const seenIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    async function checkNewNotifications() {
      try {
        const data = await api.get<{ notifications: AppNotification[] }>("/api/notifications");
        const list = data.notifications || [];

        if (isFirstLoad.current) {
          list.forEach((n) => seenIds.current.add(n.id));
          isFirstLoad.current = false;
          return;
        }

        const newUnread = list.filter((n) => !n.is_read && !seenIds.current.has(n.id));

        newUnread.forEach((n) => {
          seenIds.current.add(n.id);
          toast(n.title, {
            description: n.body,
            duration: 5000,
          });
        });
      } catch (err) {
        // Fail silently
      }
    }

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  return null;
}
