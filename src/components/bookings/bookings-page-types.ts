import type { BookingStatus } from "@/lib/types";

export interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: BookingStatus;
  customer_name: string;
  customer_phone?: string;
  comment?: string;
  created_at: string;
  service_name: string;
  service_id?: string;
  specialist_name: string;
  specialist_id: string;
  specialist_photo?: string;
  car?: string;
}
