"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Specialist {
  id: string;
  full_name: string;
  photo_url?: string;
  specialization?: string;
}

interface ServiceItem {
  id: string;
  title: string;
  price_from: number | null;
  price_fixed: boolean;
  duration_minutes: number;
}

function formatServicePrice(s: ServiceItem) {
  if (!s.price_from) return "—";
  return s.price_fixed ? `${s.price_from} ₽` : `от ${s.price_from} ₽`;
}

interface Slot {
  start: string;
  label: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedSpecialistId?: string;
}

const STEPS = ["Сотрудник", "Услуга", "Дата и время", "Клиент"];

export function CreateBookingDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedSpecialistId,
}: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selection
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>(preselectedSpecialistId || "");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Client fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(0);
      setError("");
      setSelectedSpecialist(preselectedSpecialistId || "");
      setSelectedService("");
      setSelectedSlot("");
      setSelectedDate(new Date().toISOString().slice(0, 10));
      setCustomerName("");
      setCustomerPhone("");
      setComment("");
      return;
    }
    loadSpecialists();
  }, [open, preselectedSpecialistId]);

  useEffect(() => {
    if (step === 1 && selectedSpecialist) {
      loadServices();
    }
  }, [step, selectedSpecialist]);

  useEffect(() => {
    if (step === 2 && selectedSpecialist && selectedService) {
      loadSlots();
    }
  }, [step, selectedSpecialist, selectedService, selectedDate]);

  async function loadSpecialists() {
    try {
      const res = await api.get<{ specialists: Specialist[] }>(
        "/api/business/specialists"
      );
      setSpecialists(res.specialists);
      if (preselectedSpecialistId && !selectedSpecialist) {
        setSelectedSpecialist(preselectedSpecialistId);
      }
    } catch {}
  }

  async function loadServices() {
    if (!selectedSpecialist) return;
    try {
      const res = await api.get<{ services: ServiceItem[] }>(
        `/api/business/services?specialist_id=${selectedSpecialist}`
      );
      setServices(res.services);
    } catch {}
  }

  async function loadSlots() {
    if (!selectedSpecialist || !selectedService) return;
    setLoadingSlots(true);
    try {
      const service = services.find((s) => s.id === selectedService);
      if (!service) return;
      const res = await api.get<{ slots: Slot[] }>(
        `/api/specialists/${selectedSpecialist}/slots?date=${selectedDate}&duration=${service.duration_minutes}`
      );
      setSlots(res.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

    try {
      await api.post("/api/bookings", {
        service_id: selectedService,
        specialist_id: selectedSpecialist,
        scheduled_at: selectedSlot,
        customer_name: customerName,
        customer_phone: customerPhone,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания записи");
    } finally {
      setLoading(false);
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedSpecialist;
      case 1: return !!selectedService;
      case 2: return !!selectedSlot;
      case 3: return customerName.length >= 1 && customerPhone.length >= 5;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать запись</DialogTitle>
          <DialogDescription>
            Шаг {step + 1} из 4 — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                i <= step ? "bg-brand-orange" : "bg-border"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/5 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Step 0: Specialist */}
        {step === 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {specialists.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-surface-hover",
                  selectedSpecialist === s.id
                    ? "border-brand-blue bg-brand-blue/5"
                    : "border-border"
                )}
                onClick={() => setSelectedSpecialist(s.id)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold text-white">
                  {s.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{s.full_name}</p>
                  {s.specialization && (
                    <p className="text-xs text-text-secondary">
                      {s.specialization}
                    </p>
                  )}
                </div>
                {selectedSpecialist === s.id && (
                  <Check className="h-5 w-5 text-brand-blue" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-surface-hover",
                  selectedService === s.id
                    ? "border-brand-blue bg-brand-blue/5"
                    : "border-border"
                )}
                onClick={() => setSelectedService(s.id)}
              >
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-text-secondary">
                    {s.duration_minutes} мин
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatServicePrice(s)}
                  </span>
                  {selectedService === s.id && (
                    <Check className="h-5 w-5 text-brand-blue" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot("");
              }}
            />
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center py-8 text-sm text-text-secondary">
                Нет доступных слотов на эту дату
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition-colors",
                      selectedSlot === slot.start
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-border hover:bg-surface-hover"
                    )}
                    onClick={() => setSelectedSlot(slot.start)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Client */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя клиента</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Пожелания клиента..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 0) onOpenChange(false);
              else setStep(step - 1);
            }}
          >
            {step === 0 ? "Отмена" : "Назад"}
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Далее
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={!canProceed() || loading}>
              {loading ? "Создание..." : "Создать запись"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
