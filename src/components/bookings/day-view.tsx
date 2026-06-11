"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "./bookings-page-types";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/lib/constants";

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
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00
const ROW_HEIGHT = 60;

function getBookingPosition(booking: Booking) {
  const d = new Date(booking.scheduled_at);
  const startMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const top = ((startMin - 8 * 60) / 60) * ROW_HEIGHT;
  const height = (booking.duration_minutes / 60) * ROW_HEIGHT;
  return { top, height };
}

export function DayView({ bookings, specialists, date, onBookingClick, onSlotClick }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;

  return (
    <div className="overflow-auto rounded-lg border">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="flex border-b bg-surface-muted">
          <div className="w-16 shrink-0 border-r" />
          {specialists.map((s) => (
            <div
              key={s.id}
              className="flex flex-1 items-center justify-center gap-2 px-3 py-3 border-r last:border-r-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-xs font-semibold text-white">
                {s.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <span className="text-sm font-medium truncate">{s.full_name}</span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {/* Time labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b last:border-b-0"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="flex w-16 shrink-0 items-start justify-center border-r pt-1">
                <span className="text-xs text-text-muted">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
              {specialists.map((s) => (
                <div
                  key={s.id}
                  className="flex-1 border-r last:border-r-0 relative cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => {
                    const time = `${String(hour).padStart(2, "0")}:00`;
                    onSlotClick(s.id, time);
                  }}
                />
              ))}
            </div>
          ))}

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
                  "absolute left-0 right-2 rounded border-l-4 px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden",
                  statusColor
                )}
                style={{
                  top,
                  height: Math.max(height, 24),
                  left: `calc(64px + ${specIndex} * (100% - 64px) / ${specialists.length})`,
                  width: `calc((100% - 64px) / ${specialists.length} - 8px)`,
                }}
                onClick={() => onBookingClick(booking.id)}
              >
                <p className="text-xs font-medium truncate">
                  {booking.customer_name}
                </p>
                <p className="text-[10px] text-text-secondary truncate">
                  {booking.service_name}
                </p>
                {height >= 40 && booking.customer_phone && (
                  <p className="text-[10px] text-text-secondary truncate">
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
