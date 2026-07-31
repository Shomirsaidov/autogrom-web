"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingListView } from "@/components/bookings/booking-list";
import { DayView } from "@/components/bookings/day-view";
import { BookingFilters } from "@/components/bookings/booking-filters";
import { CreateBookingDialog } from "@/components/bookings/create-booking-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import type { Booking } from "@/components/bookings/bookings-page-types";
import { Calendar, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { toast } from "sonner";

interface Specialist {
  id: string;
  full_name: string;
  photo_url?: string;
  specialization?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "day">("day");
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectedSpecialist, setPreselectedSpecialist] = useState<string>("");

  // Filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [specialistId, setSpecialistId] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (specialistId && specialistId !== "all") params.set("specialist_id", specialistId);
      if (status && status !== "all") params.set("status", status);
      if (search) params.set("search", search);

      const res = await api.get<{ bookings: Booking[] }>(
        `/api/business/bookings?${params.toString()}`
      );
      setBookings(res.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [date, specialistId, status, search]);

  const loadSpecialists = useCallback(async () => {
    try {
      const res = await api.get<{ specialists: Specialist[] }>(
        "/api/business/specialists"
      );
      setSpecialists(res.specialists);
    } catch {}
  }, []);

  useEffect(() => {
    loadSpecialists();
  }, [loadSpecialists]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await api.patch(`/api/business/bookings/${id}/status`, {
        status: newStatus,
      });
      toast.success(
        newStatus === "confirmed"
          ? "Запись принята"
          : newStatus === "cancelled"
          ? "Запись отменена"
          : "Статус обновлён"
      );
      loadBookings();
    } catch {
      toast.error("Не удалось изменить статус записи");
    }
  }

  function handleSlotClick(specialistId: string) {
    setPreselectedSpecialist(specialistId);
    setCreateOpen(true);
  }

  function shiftDate(delta: number) {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + delta);
    setDate(next.toISOString().slice(0, 10));
  }

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));

  return (
    <div>
      <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white p-3 lg:flex-row lg:items-center">
          <div className="flex min-w-56 items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange text-white">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold">Журнал записей</h1>
              <p className="text-xs text-text-secondary">
                Записи клиентов по мастерам
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "list" | "day")}
          >
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" />
                Список
              </TabsTrigger>
              <TabsTrigger value="day">
                <Calendar className="h-4 w-4 mr-1" />
                День
              </TabsTrigger>
            </TabsList>
          </Tabs>

            <div className="mx-auto flex h-10 items-center overflow-hidden rounded-lg border border-orange-200 bg-white">
              <button
                className="grid h-full w-10 place-items-center text-brand-orange hover:bg-orange-50"
                onClick={() => shiftDate(-1)}
                aria-label="Предыдущий день"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="min-w-36 border-x border-orange-100 px-3 text-sm font-semibold capitalize"
                onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              >
                {formattedDate}
              </button>
              <button
                className="grid h-full w-10 place-items-center text-brand-orange hover:bg-orange-50"
                onClick={() => shiftDate(1)}
                aria-label="Следующий день"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Добавить запись</span>
            <span className="sm:hidden">Добавить</span>
          </Button>
          </div>
        </header>

        {view === "list" && (
          <div className="border-b border-orange-100 p-3">
            <BookingFilters
              date={date}
              onDateChange={setDate}
              specialistId={specialistId}
              onSpecialistChange={setSpecialistId}
              status={status}
              onStatusChange={setStatus}
              search={search}
              onSearchChange={setSearch}
              specialists={specialists}
            />
          </div>
        )}

        <div>
          {loading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : view === "list" ? (
            <div className="p-4">
              <BookingListView
                bookings={bookings}
                onStatusChange={handleStatusChange}
                onBookingClick={(id) => router.push(`/bookings/${id}`)}
              />
            </div>
          ) : (
            <DayView
              bookings={bookings}
              specialists={specialists}
              date={date}
              onBookingClick={(id) => router.push(`/bookings/${id}`)}
              onSlotClick={handleSlotClick}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </section>

      {/* Create Dialog */}
      <CreateBookingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadBookings}
        preselectedSpecialistId={preselectedSpecialist}
      />
    </div>
  );
}
