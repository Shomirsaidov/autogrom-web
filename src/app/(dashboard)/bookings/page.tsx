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
import { KpiCard } from "@/components/shared/kpi-card";
import { api } from "@/lib/api";
import type { Booking } from "@/components/bookings/bookings-page-types";
import { Calendar, List, Plus, Users, Clock, CheckCircle } from "lucide-react";

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
  const [view, setView] = useState<"list" | "day">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectedSpecialist, setPreselectedSpecialist] = useState<string>("");

  // Filters
  const [date, setDate] = useState("");
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
      loadBookings();
    } catch {}
  }

  function handleSlotClick(specialistId: string) {
    setPreselectedSpecialist(specialistId);
    setCreateOpen(true);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter(
    (b) => b.scheduled_at?.startsWith(todayStr)
  );
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const inProgressCount = bookings.filter((b) => b.status === "in_progress").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Записи</h1>
        <div className="flex items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "list" | "day")}
          >
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Список</span>
                <span className="sm:hidden">Спис</span>
              </TabsTrigger>
              <TabsTrigger value="day">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">День</span>
                <span className="sm:hidden">День</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Создать запись</span>
            <span className="sm:hidden">Новая</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <KpiCard
          label="Записей сегодня"
          value={todayBookings.length}
          icon={<Calendar className="h-5 w-5" />}
        />
        <KpiCard
          label="Подтверждено"
          value={confirmedCount}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KpiCard
          label="В работе"
          value={inProgressCount}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
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

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : view === "list" ? (
        <BookingListView
          bookings={bookings}
          onStatusChange={handleStatusChange}
          onBookingClick={(id) => router.push(`/bookings/${id}`)}
        />
      ) : (
        <DayView
          bookings={bookings}
          specialists={specialists}
          date={date}
          onBookingClick={(id) => router.push(`/bookings/${id}`)}
          onSlotClick={handleSlotClick}
        />
      )}

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
