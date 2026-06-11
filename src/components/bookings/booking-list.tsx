"use client";

import { BookingCard } from "./booking-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import type { Booking } from "./bookings-page-types";

interface Props {
  bookings: Booking[];
  onStatusChange: (id: string, status: string) => void;
  onBookingClick: (id: string) => void;
}

export function BookingListView({ bookings, onStatusChange, onBookingClick }: Props) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<Calendar />}
        title="Нет записей"
        description="На выбранную дату записей нет. Измените фильтры или создайте новую запись."
      />
    );
  }

  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onStatusChange={onStatusChange}
          onClick={onBookingClick}
        />
      ))}
    </div>
  );
}
