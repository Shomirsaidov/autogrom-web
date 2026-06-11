export type Role = "admin" | "moderator" | "master" | "client" | "system_admin";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "in_progress" | "completed";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  name?: string;
  avatar_url?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_type: "fixed" | "from";
  duration_minutes: number;
  buffer_after_minutes?: number;
  category_id?: string;
  category_name?: string;
  image_url?: string;
}

export interface Specialist {
  id: string;
  name: string;
  photo_url?: string;
  specialization?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  visit_count: number;
  last_visit?: string;
}

export interface Booking {
  id: string;
  client_id: string;
  specialist_id: string;
  service_id: string;
  scheduled_at: string;
  duration: number;
  status: BookingStatus;
  comment?: string;
  client_name: string;
  client_phone?: string;
  specialist_name: string;
  service_name: string;
  price: number;
  created_at: string;
}

export interface Schedule {
  id: string;
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  specialist_name?: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  specialization?: string;
  role: Role;
  is_active: boolean;
}

export interface ApiError {
  error: string;
  status?: number;
}
