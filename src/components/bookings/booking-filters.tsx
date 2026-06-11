"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";

interface Specialist {
  id: string;
  full_name: string;
}

interface Props {
  date: string;
  onDateChange: (date: string) => void;
  specialistId: string;
  onSpecialistChange: (id: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  specialists: Specialist[];
}

export function BookingFilters({
  date,
  onDateChange,
  specialistId,
  onSpecialistChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  specialists,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-36 sm:w-40"
      />

      <Select value={specialistId} onValueChange={onSpecialistChange}>
        <SelectTrigger className="w-36 sm:w-44">
          <SelectValue placeholder="Все специалисты" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все специалисты</SelectItem>
          {specialists.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32 sm:w-36">
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {BOOKING_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Поиск по клиенту или телефону..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
