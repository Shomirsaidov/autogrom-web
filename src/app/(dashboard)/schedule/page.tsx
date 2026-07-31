"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleEntry {
  id: string;
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Specialist {
  id: string;
  full_name: string;
  photo_url?: string | null;
  specialization?: string | null;
}

interface ScheduleEdit {
  start_time: string;
  end_time: string;
}

const WEEKDAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [selectedSpecialist, setSelectedSpecialist] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCell, setSelectedCell] = useState<{
    specialist: Specialist;
    date: Date;
  } | null>(null);
  const [cellEdit, setCellEdit] = useState<ScheduleEdit>({
    start_time: "09:00",
    end_time: "20:00",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleResponse, specialistResponse] = await Promise.all([
        api.get<{ schedules: ScheduleEntry[] }>("/api/business/schedules"),
        api.get<{ specialists: Specialist[] }>("/api/business/specialists"),
      ]);
      setSchedules(scheduleResponse.schedules || []);
      setSpecialists(specialistResponse.specialists || []);
    } catch {
      toast.error("Не удалось загрузить график");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    return Array.from(
      { length: new Date(year, monthIndex + 1, 0).getDate() },
      (_, index) => new Date(year, monthIndex, index + 1)
    );
  }, [month]);

  const visibleSpecialists = specialists.filter((specialist) => {
    const matchesSelect =
      selectedSpecialist === "all" || specialist.id === selectedSpecialist;
    const matchesSearch = specialist.full_name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesSelect && matchesSearch;
  });

  function getSchedule(specialistId: string, day: Date) {
    return schedules.find(
      (schedule) =>
        schedule.specialist_id === specialistId &&
        schedule.day_of_week === day.getDay()
    );
  }

  function openCell(specialist: Specialist, day: Date) {
    const current = getSchedule(specialist.id, day);
    setCellEdit({
      start_time: current?.start_time.slice(0, 5) || "09:00",
      end_time: current?.end_time.slice(0, 5) || "20:00",
    });
    setSelectedCell({ specialist, date: day });
  }

  async function saveCell(remove = false) {
    if (!selectedCell) return;
    if (
      !remove &&
      (!cellEdit.start_time ||
        !cellEdit.end_time ||
        cellEdit.start_time >= cellEdit.end_time)
    ) {
      toast.error("Проверьте время начала и окончания");
      return;
    }

    const weekday = selectedCell.date.getDay();
    const next = schedules
      .filter(
        (entry) =>
          !(
            entry.specialist_id === selectedCell.specialist.id &&
            entry.day_of_week === weekday
          )
      )
      .map((entry) => ({
        specialist_id: entry.specialist_id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time.slice(0, 5),
        end_time: entry.end_time.slice(0, 5),
      }));

    if (!remove) {
      next.push({
        specialist_id: selectedCell.specialist.id,
        day_of_week: weekday,
        start_time: cellEdit.start_time,
        end_time: cellEdit.end_time,
      });
    }

    setSaving(true);
    try {
      await api.post("/api/business/schedules", { entries: next });
      toast.success(remove ? "Выходной сохранён" : "Рабочее время сохранено");
      setSelectedCell(null);
      await loadData();
    } catch {
      toast.error("Не удалось сохранить график");
    } finally {
      setSaving(false);
    }
  }

  function changeMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  const monthTitle = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(month);

  if (loading) return <CardSkeleton count={2} />;

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white p-3 xl:flex-row xl:items-center">
          <div className="flex min-w-60 items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange text-white">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold">График сотрудников</h1>
              <p className="text-xs text-text-secondary">
                Рабочие и выходные дни мастеров
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Все сотрудники" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Все сотрудники ({specialists.length})
                </SelectItem>
                {specialists.map((specialist) => (
                  <SelectItem key={specialist.id} value={specialist.id}>
                    {specialist.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="relative hidden min-w-44 flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Найти сотрудника"
                className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-orange"
              />
            </label>

            <div className="mx-auto flex h-10 items-center overflow-hidden rounded-lg border border-orange-200 bg-white">
              <button
                className="grid h-full w-10 place-items-center text-brand-orange hover:bg-orange-50"
                onClick={() => changeMonth(-1)}
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <strong className="min-w-40 border-x border-orange-100 px-3 text-center capitalize">
                {monthTitle}
              </strong>
              <button
                className="grid h-full w-10 place-items-center text-brand-orange hover:bg-orange-50"
                onClick={() => changeMonth(1)}
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="overflow-auto">
          <div
            className="min-w-max"
            style={{
              display: "grid",
              gridTemplateColumns: `176px repeat(${days.length}, 76px)`,
            }}
          >
            <div className="sticky left-0 z-30 flex h-[62px] items-center gap-2 border-b border-r border-orange-100 bg-white p-3 font-semibold">
              <Users className="h-4 w-4 text-brand-orange" />
              Сотрудник
            </div>
            {days.map((day) => {
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              const today =
                dateKey(day) === dateKey(new Date());
              return (
                <div
                  key={dateKey(day)}
                  className={cn(
                    "flex h-[62px] flex-col items-center justify-center border-b border-r text-sm",
                    weekend && "bg-orange-50 text-brand-orange",
                    today && "border-t-4 border-t-brand-orange bg-orange-100"
                  )}
                >
                  <strong>{day.getDate()}</strong>
                  <span className="text-xs">{WEEKDAY_SHORT[day.getDay()]}</span>
                </div>
              );
            })}

            {visibleSpecialists.length === 0 && (
              <div className="col-span-full p-10 text-center text-text-secondary">
                Сотрудники не найдены
              </div>
            )}

            {visibleSpecialists.map((specialist) => (
              <div className="contents" key={specialist.id}>
                <div className="sticky left-0 z-20 flex h-[68px] items-center gap-2 border-b border-r border-orange-100 bg-white px-3 shadow-[4px_0_8px_rgba(0,0,0,0.03)]">
                  {specialist.photo_url ? (
                    <img
                      src={specialist.photo_url}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-orange-200 object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-xs font-bold text-brand-orange">
                      {specialist.full_name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {specialist.full_name}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">
                      {specialist.specialization || "Сотрудник"}
                    </p>
                  </div>
                </div>

                {days.map((day) => {
                  const schedule = getSchedule(specialist.id, day);
                  const weekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <button
                      key={`${specialist.id}-${dateKey(day)}`}
                      onClick={() => openCell(specialist, day)}
                      className={cn(
                        "group relative flex h-[68px] flex-col items-center justify-center border-b border-r bg-white text-xs transition hover:bg-orange-50",
                        weekend && "bg-orange-50/40"
                      )}
                    >
                      {schedule ? (
                        <>
                          <span>{schedule.start_time.slice(0, 5)}</span>
                          <span className="mt-1 font-semibold text-brand-orange">
                            {schedule.end_time.slice(0, 5)}
                          </span>
                        </>
                      ) : (
                        <span className="text-text-muted">Выходной</span>
                      )}
                      <Pencil className="absolute right-1 top-1 hidden h-3 w-3 text-brand-orange group-hover:block" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedCell && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedCell(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Рабочее время</h2>
                <p className="text-sm text-text-secondary">
                  {selectedCell.specialist.full_name} ·{" "}
                  {selectedCell.date.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    weekday: "long",
                  })}
                </p>
              </div>
              <button
                className="rounded-lg p-2 hover:bg-orange-50"
                onClick={() => setSelectedCell(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm font-medium">
                Начало
                <input
                  type="time"
                  value={cellEdit.start_time}
                  onChange={(event) =>
                    setCellEdit((value) => ({
                      ...value,
                      start_time: event.target.value,
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border px-3 outline-none focus:border-brand-orange"
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Окончание
                <input
                  type="time"
                  value={cellEdit.end_time}
                  onChange={(event) =>
                    setCellEdit((value) => ({
                      ...value,
                      end_time: event.target.value,
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border px-3 outline-none focus:border-brand-orange"
                />
              </label>
            </div>

            <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">
              Изменение применяется к этому дню недели в рабочем шаблоне сотрудника.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={saving}
                onClick={() => saveCell(true)}
              >
                Сделать выходным
              </Button>
              <Button disabled={saving} onClick={() => saveCell(false)}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Сохраняем..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
