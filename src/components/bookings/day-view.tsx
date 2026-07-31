"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "./bookings-page-types";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/lib/constants";
import { Check, Phone, X } from "lucide-react";

interface Specialist {
  id: string;
  full_name: string;
  photo_url?: string;
}

interface Props {
  bookings: Booking[];
  specialists: Specialist[];
  date: string;
  onBookingClick: (id: string) => void;
  onSlotClick: (specialistId: string, time: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const ROW_HEIGHT = 72;

function getBookingPosition(booking: Booking) {
  const d = new Date(booking.scheduled_at);
  const startMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const top = ((startMin - 8 * 60) / 60) * ROW_HEIGHT;
  const height = (booking.duration_minutes / 60) * ROW_HEIGHT;
  return { top, height };
}

export function DayView({
  bookings,
  specialists,
  date,
  onBookingClick,
  onSlotClick,
  onStatusChange,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;
  const now = new Date();
  const nowTop =
    ((now.getHours() * 60 + now.getMinutes() - 8 * 60) / 60) * ROW_HEIGHT;

  return (
    <div className="overflow-auto bg-white">
      <div className="min-w-[760px]">
        {/* Header */}
        <div className="sticky top-0 z-20 flex border-b border-orange-100 bg-white shadow-sm">
          <div className="w-20 shrink-0 border-r border-orange-100" />
          {specialists.map((s) => (
            <div
              key={s.id}
              className="flex min-w-44 flex-1 items-center justify-center gap-2 border-r border-orange-100 px-3 py-3 last:border-r-0"
            >
              {s.photo_url ? (
                <img
                  src={s.photo_url}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-orange-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-brand-orange">
                  {s.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.full_name}</p>
                <p className="text-[10px] text-text-muted">08:00 — 21:00</p>
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {/* Time labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-orange-50 last:border-b-0"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="flex w-20 shrink-0 items-start justify-center border-r border-orange-100 pt-2">
                <span className="text-sm font-semibold text-text-secondary">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
              {specialists.map((s) => (
                <div
                  key={s.id}
                  className="relative min-w-44 flex-1 cursor-pointer border-r border-orange-100 bg-[linear-gradient(to_bottom,transparent_49%,#fff1e8_50%,transparent_51%)] transition-colors last:border-r-0 hover:bg-orange-50"
                  onClick={() => {
                    const time = `${String(hour).padStart(2, "0")}:00`;
                    onSlotClick(s.id, time);
                  }}
                />
              ))}
            </div>
          ))}

          {isToday && nowTop >= 0 && nowTop <= HOURS.length * ROW_HEIGHT && (
            <div
              className="pointer-events-none absolute left-20 right-0 z-10 border-t-2 border-brand-orange"
              style={{ top: nowTop }}
            >
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-brand-orange" />
            </div>
          )}

          {/* Booking chips */}
          {bookings.map((booking) => {
            const { top, height } = getBookingPosition(booking);
            const specIndex = specialists.findIndex(
              (s) => s.id === booking.specialist_id
            );
            if (specIndex === -1) return null;

            const statusColor = booking.status === "cancelled"
              ? "border-l-status-cancelled bg-status-cancelled-bg"
              : booking.status === "confirmed"
              ? "border-l-status-confirmed bg-status-confirmed-bg"
              : booking.status === "in_progress"
              ? "border-l-status-progress bg-status-progress-bg"
              : booking.status === "completed"
              ? "border-l-status-completed bg-status-completed-bg"
              : "border-l-status-pending bg-status-pending-bg";

            return (
              <div
                key={booking.id}
                className={cn(
                  "absolute z-[5] cursor-pointer overflow-hidden rounded-xl border border-orange-200 border-l-4 px-2 py-1.5 shadow-sm transition hover:shadow-md",
                  statusColor
                )}
                style={{
                  top,
                  height: Math.max(height, 24),
                  left: `calc(80px + ${specIndex} * (100% - 80px) / ${specialists.length} + 4px)`,
                  width: `calc((100% - 80px) / ${specialists.length} - 8px)`,
                }}
                onClick={() => onBookingClick(booking.id)}
              >
                <p className="truncate text-xs font-bold">
                  {booking.customer_name}
                </p>
                <p className="text-[10px] text-text-secondary truncate">
                  {booking.service_name}
                </p>
                {height >= 40 && booking.customer_phone && (
                  <p className="flex items-center gap-1 truncate text-[10px] text-text-secondary">
                    <Phone className="h-3 w-3" />
                    {booking.customer_phone}
                  </p>
                )}
                {height >= 50 && (
                  <Badge
                    className={cn(
                      "text-[9px] px-1 py-0 border-0 mt-0.5",
                      BOOKING_STATUS_COLORS[booking.status]
                    )}
                  >
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </Badge>
                )}
                {booking.status === "pending" && height >= 65 && (
                  <div
                    className="mt-1 flex gap-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="flex h-6 flex-1 items-center justify-center gap-1 rounded bg-brand-orange px-1 text-[9px] font-semibold text-white hover:bg-orange-600"
                      onClick={() => onStatusChange(booking.id, "confirmed")}
                    >
                      <Check className="h-3 w-3" />
                      Принять
                    </button>
                    <button
                      className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-red-200 bg-white px-1 text-[9px] font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => onStatusChange(booking.id, "cancelled")}
                    >
                      <X className="h-3 w-3" />
                      Отказать
                    </button>
                  </div>
                )}
                {booking.status === "confirmed" && height >= 65 && (
                  <div
                    className="mt-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="h-6 w-full rounded border border-red-200 bg-white text-[9px] font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => onStatusChange(booking.id, "cancelled")}
                    >
                      Отменить запись
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
