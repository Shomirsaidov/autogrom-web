"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Phone, User, Car, Clock } from "lucide-react";
import type { Booking } from "./bookings-page-types";

interface Props {
  booking: Booking;
  onStatusChange: (id: string, status: string) => void;
  onClick: (id: string) => void;
}

export function BookingCard({ booking, onStatusChange, onClick }: Props) {
  const time = new Date(booking.scheduled_at).toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(booking.scheduled_at).toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
  });

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(booking.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
              <User className="h-5 w-5 text-text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary truncate">
                  {booking.customer_name}
                </span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {date}, {time}
                </span>
                <span>{booking.duration_minutes} мин</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-secondary">
                <span>{booking.service_name}</span>
                <span>{booking.specialist_name}</span>
                {booking.car && (
                  <span className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {booking.car}
                  </span>
                )}
              </div>
              {booking.comment && (
                <p className="mt-1 text-sm text-text-muted italic">
                  {booking.comment}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Позвонить"
              onClick={(e) => {
                e.stopPropagation();
                if (booking.customer_phone) {
                  window.location.href = `tel:${booking.customer_phone}`;
                }
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(booking.status === "pending" || booking.status === "confirmed") && (
          <div className="mt-3 flex gap-2 border-t pt-3" onClick={(e) => e.stopPropagation()}>
            {booking.status === "pending" && (
              <Button
                size="sm"
                className="bg-success text-white hover:bg-success/90"
                onClick={() => onStatusChange(booking.id, "confirmed")}
              >
                Подтвердить
              </Button>
            )}
            {booking.status === "confirmed" && (
              <Button
                size="sm"
                onClick={() => onStatusChange(booking.id, "in_progress")}
              >
                Начать
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-danger border-danger hover:bg-danger/5"
              onClick={() => onStatusChange(booking.id, "cancelled")}
            >
              Отменить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
