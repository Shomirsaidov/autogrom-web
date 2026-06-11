import type { BookingStatus, Role } from "./types";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  in_progress: "В работе",
  completed: "Выполнена",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-status-pending-bg text-status-pending",
  confirmed: "bg-status-confirmed-bg text-status-confirmed",
  cancelled: "bg-status-cancelled-bg text-status-cancelled",
  in_progress: "bg-status-progress-bg text-status-progress",
  completed: "bg-status-completed-bg text-status-completed",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  master: "Мастер",
  client: "Клиент",
  system_admin: "Системный администратор",
};

export const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
export const DAY_NAMES_FULL = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];
