"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { DAY_NAMES_FULL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Clock, Save, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface ScheduleEntry {
  id: string;
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  specialist?: { full_name: string };
}

interface Specialist {
  id: string;
  full_name: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("all");
  const [editMode, setEditMode] = useState(false);

  // Editable state: map of "specialist_id_day_of_week" -> { start_time, end_time, id }
  const [edits, setEdits] = useState<Record<string, { start_time: string; end_time: string; id?: string }>>({});

  const filteredSpecialists = specialists.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, specRes] = await Promise.all([
        api.get<{ schedules: ScheduleEntry[] }>("/api/business/schedules"),
        api.get<{ specialists: Specialist[] }>("/api/business/specialists"),
      ]);
      setSchedules(schedRes.schedules);
      setSpecialists(specRes.specialists);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function enterEditMode() {
    const newEdits: Record<string, { start_time: string; end_time: string; id?: string }> = {};
    for (const s of schedules) {
      const key = `${s.specialist_id}_${s.day_of_week}`;
      newEdits[key] = {
        start_time: s.start_time.slice(0, 5),
        end_time: s.end_time.slice(0, 5),
        id: s.id,
      };
    }
    setEdits(newEdits);
    setEditMode(true);
  }

  function cancelEdit() {
    setEdits({});
    setEditMode(false);
  }

  function setCellTime(
    specialistId: string,
    dayOfWeek: number,
    field: "start_time" | "end_time",
    value: string
  ) {
    const key = `${specialistId}_${dayOfWeek}`;
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function applyTemplate(template: "all" | "weekdays" | "custom") {
    const newEdits = { ...edits };
    const days = template === "all" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];

    for (const spec of specialists) {
      for (const d of days) {
        const key = `${spec.id}_${d}`;
        if (!newEdits[key]) {
          newEdits[key] = { start_time: "09:00", end_time: "19:00" };
        }
      }
    }
    setEdits(newEdits);
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      const entries = Object.entries(edits)
        .filter(([_, v]) => v.start_time && v.end_time)
        .map(([key, v]) => {
          const lastSep = key.lastIndexOf("_");
          const specialistId = key.slice(0, lastSep);
          const dayOfWeek = key.slice(lastSep + 1);
          return {
            specialist_id: specialistId,
            day_of_week: Number(dayOfWeek),
            start_time: v.start_time.slice(0, 5),
            end_time: v.end_time.slice(0, 5),
          };
        });

      await api.post("/api/business/schedules", { entries });
      toast.success("График сохранён");
      setEditMode(false);
      loadData();
    } catch {
      toast.error("Ошибка при сохранении графика");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CardSkeleton count={2} />;

  const daysToShow = [0, 1, 2, 3, 4, 5, 6];
  const displaySpecialists = selectedSpecialist === "all" ? filteredSpecialists : specialists.filter((s) => s.id === selectedSpecialist);

  function getSchedule(specialistId: string, dayOfWeek: number): ScheduleEntry | undefined {
    return schedules.find(
      (s) => s.specialist_id === specialistId && s.day_of_week === dayOfWeek
    );
  }

  function getEditValue(specialistId: string, dayOfWeek: number) {
    const key = `${specialistId}_${dayOfWeek}`;
    return edits[key];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">График сотрудников</h1>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={cancelEdit} size="sm">
                Отмена
              </Button>
              <Button onClick={saveSchedule} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </>
          ) : (
            <Button onClick={enterEditMode} size="sm">
              <Clock className="h-4 w-4 mr-1" />
              Редактировать
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
          <SelectTrigger className="w-40 sm:w-48">
            <SelectValue placeholder="Все сотрудники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сотрудники</SelectItem>
            {specialists.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {editMode && (
          <div className="flex gap-1 sm:gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => applyTemplate("all")}>
              Все дни
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTemplate("weekdays")}>
              Будни
            </Button>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="flex border-b bg-surface-muted">
              <div className="w-44 shrink-0 p-3 text-sm font-medium text-text-secondary">
                Сотрудник
              </div>
              {daysToShow.map((day) => (
                <div
                  key={day}
                  className="flex-1 p-3 text-center text-sm font-medium text-text-secondary border-l"
                >
                  {DAY_NAMES_FULL[day]}
                </div>
              ))}
            </div>

            {/* Rows */}
            {displaySpecialists.length === 0 && (
              <div className="p-8 text-center text-sm text-text-secondary">
                {specialists.length === 0
                  ? "Нет сотрудников. Добавьте сотрудников в настройках."
                  : "Нет сотрудников по заданному фильтру."}
              </div>
            )}

            {displaySpecialists.map((spec) => (
              <div
                key={spec.id}
                className="flex border-b last:border-b-0 hover:bg-surface-hover/50 transition-colors"
              >
                <div className="flex w-44 shrink-0 items-center gap-2 p-3 border-r">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-xs font-semibold text-white">
                    {spec.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {spec.full_name}
                  </span>
                </div>

                {daysToShow.map((day) => {
                  const sched = getSchedule(spec.id, day);
                  const edit = getEditValue(spec.id, day);
                  const hasSchedule = !!sched;
                  const isEditing = editMode && edit !== undefined;

                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex-1 p-2 border-l flex items-center justify-center min-h-[56px]",
                        !hasSchedule && !isEditing && "bg-surface-muted/30"
                      )}
                    >
                      {editMode ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="time"
                            value={edit?.start_time || ""}
                            onChange={(e) =>
                              setCellTime(spec.id, day, "start_time", e.target.value)
                            }
                            className="h-7 w-16 text-xs px-1"
                            placeholder="--:--"
                          />
                          <span className="text-xs text-text-muted">—</span>
                          <Input
                            type="time"
                            value={edit?.end_time || ""}
                            onChange={(e) =>
                              setCellTime(spec.id, day, "end_time", e.target.value)
                            }
                            className="h-7 w-16 text-xs px-1"
                            placeholder="--:--"
                          />
                        </div>
                      ) : hasSchedule ? (
                        <span className="text-sm font-medium">
                          {sched.start_time.slice(0, 5)} — {sched.end_time.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
