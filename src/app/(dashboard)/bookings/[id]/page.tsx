"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Car,
  MessageSquare,
  Wrench,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
} from "lucide-react";

interface BookingDetail {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  customer_name: string;
  customer_phone?: string;
  comment?: string;
  created_at: string;
  service: {
    id: string;
    title: string;
    description?: string;
    price_from?: number;
    price_fixed?: number;
    duration_minutes: number;
  } | null;
  specialist: {
    id: string;
    full_name: string;
    photo_url?: string;
    specialization?: string;
    bio?: string;
  } | null;
  car: {
    id: string;
    make: string;
    model: string;
    year?: number;
    license_plate?: string;
  } | null;
}

interface HistoryItem {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  service_name: string;
  specialist_name: string;
  comment?: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
  }, [params.id]);

  async function loadBooking() {
    setLoading(true);
    try {
      const res = await api.get<{ booking: BookingDetail }>(
        `/api/business/bookings/${params.id}`
      );
      setBooking(res.booking);
      if (res.booking.customer_phone) {
        loadClientHistory(res.booking.customer_phone);
      }
    } catch {
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  }

  async function loadClientHistory(phone: string) {
    try {
      const res = await api.get<{ history: HistoryItem[] }>(
        `/api/business/clients/history?phone=${encodeURIComponent(phone)}`
      );
      setHistory(res.history.filter((h) => h.id !== params.id));
    } catch {}
  }

  async function handleStatusChange(newStatus: string) {
    setActionLoading(newStatus);
    try {
      await api.patch(`/api/business/bookings/${params.id}/status`, {
        status: newStatus,
      });
      await loadBooking();
    } catch {}
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!booking) return null;

  const time = new Date(booking.scheduled_at).toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(booking.scheduled_at).toLocaleDateString("ru", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const createdDate = new Date(booking.created_at).toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const price = booking.service?.price_fixed ?? booking.service?.price_from;
  const priceLabel = booking.service?.price_fixed
    ? `${price} ₽`
    : booking.service?.price_from
    ? `от ${price} ₽`
    : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/bookings")}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к записям
      </Button>

      {/* Status actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
            {booking.customer_name}
          </h1>
          <StatusBadge status={booking.status as any} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {booking.status === "pending" && (
            <Button
              onClick={() => handleStatusChange("confirmed")}
              disabled={actionLoading === "confirmed"}
              className="bg-success text-white hover:bg-success/90"
              size="sm"
            >
              {actionLoading === "confirmed" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Подтвердить
            </Button>
          )}
          {booking.status === "confirmed" && (
            <Button
              onClick={() => handleStatusChange("in_progress")}
              disabled={actionLoading === "in_progress"}
              size="sm"
            >
              {actionLoading === "in_progress" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Начать работу
            </Button>
          )}
          {booking.status === "in_progress" && (
            <Button
              onClick={() => handleStatusChange("completed")}
              disabled={actionLoading === "completed"}
              className="bg-success text-white hover:bg-success/90"
              size="sm"
            >
              {actionLoading === "completed" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Завершить
            </Button>
          )}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("cancelled")}
              disabled={actionLoading === "cancelled"}
              className="text-danger border-danger hover:bg-danger/5"
            >
              {actionLoading === "cancelled" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Отменить
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-orange" />
                Услуга и расписание
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-text-secondary">Услуга</p>
                  <p className="font-medium">{booking.service?.title || "—"}</p>
                  {booking.service?.description && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      {booking.service.description}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Стоимость</p>
                  <p className="font-medium">{priceLabel || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Дата и время</p>
                  <p className="font-medium">{date}</p>
                  <p className="text-sm text-text-secondary">{time}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Длительность</p>
                  <p className="font-medium">{booking.duration_minutes} мин</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-text-secondary">Специалист</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold text-white">
                    {booking.specialist?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "??"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {booking.specialist?.full_name || "—"}
                    </p>
                    {booking.specialist?.specialization && (
                      <p className="text-sm text-text-secondary">
                        {booking.specialist.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment */}
          {booking.comment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-blue" />
                  Комментарий
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-primary">{booking.comment}</p>
              </CardContent>
            </Card>
          )}

          {/* Client history */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-blue" />
                  История посещений клиента
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.slice(0, 10).map((h) => {
                    const hDate = new Date(h.scheduled_at).toLocaleDateString(
                      "ru",
                      {
                        day: "numeric",
                        month: "short",
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
                        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 text-sm hover:bg-surface-hover cursor-pointer"
                        onClick={() => router.push(`/bookings/${h.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-text-secondary text-xs sm:text-sm sm:w-32">
                            {hDate} {hTime}
                          </span>
                          <span>{h.service_name}</span>
                          <span className="text-text-secondary text-xs">
                            {h.specialist_name}
                          </span>
                        </div>
                        <Badge
                          className={
                            h.status === "completed"
                              ? "bg-status-completed-bg text-status-completed border-0"
                              : h.status === "cancelled"
                              ? "bg-status-cancelled-bg text-status-cancelled border-0"
                              : "bg-status-pending-bg text-status-pending border-0"
                          }
                        >
                          {BOOKING_STATUS_LABELS[h.status as keyof typeof BOOKING_STATUS_LABELS]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — Client info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-brand-orange" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                  <User className="h-6 w-6 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-lg">
                    {booking.customer_name}
                  </p>
                </div>
              </div>

              {booking.customer_phone && (
                <a
                  href={`tel:${booking.customer_phone}`}
                  className="flex items-center gap-2 text-brand-blue hover:underline text-sm"
                >
                  <Phone className="h-4 w-4" />
                  {booking.customer_phone}
                </a>
              )}

              {booking.car && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Car className="h-4 w-4" />
                  {booking.car.make} {booking.car.model}
                  {booking.car.license_plate && (
                    <span className="text-xs font-mono">
                      {booking.car.license_plate}
                    </span>
                  )}
                </div>
              )}

              <Separator />

              <div className="text-sm text-text-secondary">
                <p>Создана: {createdDate}</p>
                {history.length > 0 && (
                  <p className="mt-1">
                    Посещений: {history.length + 1}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
