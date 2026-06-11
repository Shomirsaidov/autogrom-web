"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  User,
  Phone,
  Clock,
  Calendar,
  MessageSquare,
  Send,
} from "lucide-react";
import type { BookingStatus } from "@/lib/types";

interface HistoryItem {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  service_name: string;
  specialist_name: string;
  customer_name?: string;
  comment?: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const phone = decodeURIComponent(params.id as string);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingChat, setFindingChat] = useState(false);

  async function goToChat() {
    setFindingChat(true);
    try {
      const clientName = history[0]?.customer_name || "Клиент";
      const res = await api.post<{ conversation: { id: string } | null }>(
        "/api/business/clients/start-conversation",
        { phone, name: clientName }
      );
      if (res.conversation?.id) {
        router.push(`/chats/${res.conversation.id}`);
        return;
      }
    } catch (err) {
      console.error("start-conversation error:", err);
    }
    router.push("/chats");
    setFindingChat(false);
  }

  useEffect(() => {
    if (phone) loadHistory();
  }, [phone]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get<{ history: HistoryItem[] }>(
        `/api/business/clients/history?phone=${encodeURIComponent(phone)}`
      );
      setHistory(res.history);
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const clientName = history[0]?.customer_name || "Клиент";
  const visitCount = history.length;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/clients")}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к клиентам
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-brand-orange" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
                  <User className="h-7 w-7 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-lg">{history[0]?.customer_name || "Без имени"}</p>
                </div>
              </div>

              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-brand-blue hover:underline text-sm"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>

              <div className="text-sm text-text-secondary space-y-1">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Всего посещений: {visitCount}
                </p>
                {history[0] && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Последний визит:{" "}
                    {new Date(history[0].scheduled_at).toLocaleDateString("ru")}
                  </p>
                )}
              </div>

              <Button
                className="w-full gap-2"
                onClick={goToChat}
                disabled={findingChat}
              >
                <Send className="h-4 w-4" />
                {findingChat ? "Поиск чата..." : "Написать в чат"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-blue" />
                История записей
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">
                  У клиента нет записей
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => {
                    const hDate = new Date(h.scheduled_at).toLocaleDateString(
                      "ru",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    );
                    const hTime = new Date(h.scheduled_at).toLocaleTimeString(
                      "ru",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-surface-hover cursor-pointer transition-colors"
                        onClick={() => router.push(`/bookings/${h.id}`)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{h.service_name}</p>
                          <p className="text-sm text-text-secondary">
                            {hDate} в {hTime} · {h.duration_minutes} мин
                          </p>
                          <p className="text-sm text-text-secondary">
                            {h.specialist_name}
                          </p>
                          {h.comment && (
                            <p className="text-xs text-text-muted italic flex items-center gap-1 mt-1">
                              <MessageSquare className="h-3 w-3" />
                              {h.comment}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            h.status === "completed"
                              ? "bg-status-completed-bg text-status-completed border-0"
                              : h.status === "cancelled"
                              ? "bg-status-cancelled-bg text-status-cancelled border-0"
                              : h.status === "confirmed"
                              ? "bg-status-confirmed-bg text-status-confirmed border-0"
                              : h.status === "in_progress"
                              ? "bg-status-progress-bg text-status-progress border-0"
                              : "bg-status-pending-bg text-status-pending border-0"
                          }
                        >
                          {BOOKING_STATUS_LABELS[h.status as BookingStatus]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
