"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/shared/image-upload";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Service {
  id: string;
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  initial?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    specialization: string | null;
  };
}

export function EmployeeForm({ open, onOpenChange, onSaved, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [linkedServiceIds, setLinkedServiceIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!open) return;

    setFullName(initial?.full_name || "");
    setSpecialization(initial?.specialization || "");
    setPhotoUrl(initial?.photo_url || "");

    api
      .get<{ services: Service[] }>("/api/business/services")
      .then((res) => setAllServices(res.services))
      .catch(() => {});

    if (initial?.id) {
      api
        .get<{ services: Service[] }>(
          `/api/business/specialists/${initial.id}/services`
        )
        .then((res) =>
          setLinkedServiceIds(new Set(res.services.map((s) => s.id)))
        )
        .catch(() => {});
    } else {
      setLinkedServiceIds(new Set());
    }
  }, [open, initial]);

  async function toggleService(id: string) {
    setLinkedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error("Укажите имя сотрудника");
      return;
    }

    setSaving(true);
    try {
      const body = {
        full_name: fullName.trim(),
        specialization: specialization.trim() || undefined,
        photo_url: photoUrl || undefined,
      };

      let specialistId: string;

      if (initial) {
        await api.put(`/api/business/specialists/${initial.id}`, body);
        toast.success("Сотрудник обновлён");
        specialistId = initial.id;
      } else {
        const res = await api.post<{ specialist: { id: string } }>(
          "/api/business/specialists",
          body
        );
        toast.success("Сотрудник создан");
        specialistId = res.specialist.id;
      }

      // Sync service-specialist links
      const linksRes = await api.get<{ services: Service[] }>(
        `/api/business/specialists/${specialistId}/services`
      );
      const currentIds = new Set(linksRes.services.map((s) => s.id));

      for (const svId of linkedServiceIds) {
        if (!currentIds.has(svId)) {
          await api.post("/api/business/service-specialists", {
            specialist_id: specialistId,
            service_id: svId,
          });
        }
      }
      for (const svId of currentIds) {
        if (!linkedServiceIds.has(svId)) {
          await api.delete(
            `/api/business/service-specialists?specialist_id=${specialistId}&service_id=${svId}`
          );
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Редактировать сотрудника" : "Новый сотрудник"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ImageUpload value={photoUrl} onChange={setPhotoUrl} />

          <div>
            <Label>ФИО</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div>
            <Label>Специализация</Label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Например: Моторный мастер"
            />
          </div>

          <Separator />

          <div>
            <Label className="text-base">Какие услуги выполняет</Label>
            <p className="text-sm text-text-secondary mb-2">
              Выберите услуги, которые может оказывать этот сотрудник
            </p>
            {allServices.length === 0 ? (
              <p className="text-sm text-text-muted">
                Сначала добавьте услуги
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {allServices.map((sv) => (
                  <label
                    key={sv.id}
                    className="flex items-center gap-2 cursor-pointer py-1"
                  >
                    <Checkbox
                      checked={linkedServiceIds.has(sv.id)}
                      onCheckedChange={() => toggleService(sv.id)}
                    />
                    <span className="text-sm">{sv.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
