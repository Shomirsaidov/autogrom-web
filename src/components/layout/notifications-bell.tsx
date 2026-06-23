"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: AppNotification[] }>("/api/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      // Fail silently in background
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.post("/api/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Все уведомления прочитаны");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5 text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-text-primary">Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs font-medium text-brand-orange hover:text-brand-orange/80 hover:bg-brand-orange/5"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Прочитать все
            </Button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
              <Bell className="h-8 w-8 mb-2 opacity-40 text-text-secondary" />
              <p className="text-sm">Нет новых уведомлений</p>
            </div>
          ) : (
            notifications.map((n) => {
              const date = new Date(n.created_at);
              const relativeTime = formatDistanceToNow(date, {
                addSuffix: true,
                locale: ru,
              });

              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex flex-col gap-1 p-4 text-left transition-colors cursor-pointer hover:bg-surface-hover ${
                    !n.is_read ? "bg-brand-orange/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm text-text-primary">
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-brand-orange shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {n.body}
                  </p>
                  <span className="text-[10px] text-text-muted mt-1">
                    {relativeTime}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
