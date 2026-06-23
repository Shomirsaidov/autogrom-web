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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/shared/image-upload";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Specialist {
  id: string;
  full_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  initial?: {
    id: string;
    title: string;
    description: string;
    price_from: number;
    price_fixed: boolean;
    duration_minutes: number;
    photo_url: string;
    discount_tag?: string | null;
    discount_price?: number | null;
  };
}

export function ServiceForm({ open, onOpenChange, onSaved, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceFrom, setPriceFrom] = useState(0);
  const [priceFixed, setPriceFixed] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [photoUrl, setPhotoUrl] = useState("");
  const [discountTag, setDiscountTag] = useState("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");

  const [allSpecialists, setAllSpecialists] = useState<Specialist[]>([]);
  const [linkedSpecialistIds, setLinkedSpecialistIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!open) return;

    // Reset & pre-fill
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setPriceFrom(initial?.price_from ?? 0);
    setPriceFixed(initial?.price_fixed ?? true);
    setDurationMinutes(initial?.duration_minutes || 60);
    setPhotoUrl(initial?.photo_url || "");
    setDiscountTag(initial?.discount_tag || "");
    setDiscountPrice(initial?.discount_price ?? "");

    // Load all specialists
    api
      .get<{ specialists: Specialist[] }>("/api/business/specialists")
      .then((res) => setAllSpecialists(res.specialists))
      .catch(() => {});

    // Load linked specialists
    if (initial?.id) {
      api
        .get<{ specialists: Specialist[] }>(
          `/api/business/services/${initial.id}/specialists`
        )
        .then((res) =>
          setLinkedSpecialistIds(new Set(res.specialists.map((s) => s.id)))
        )
        .catch(() => {});
    } else {
      setLinkedSpecialistIds(new Set());
    }
  }, [open, initial]);

  async function toggleSpecialist(id: string) {
    setLinkedSpecialistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Укажите название услуги");
      return;
    }
    if (priceFrom <= 0) {
      toast.error("Укажите стоимость");
      return;
    }
    if (durationMinutes < 1) {
      toast.error("Укажите длительность");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        price_from: priceFrom,
        price_fixed: priceFixed,
        duration_minutes: durationMinutes,
        photo_url: photoUrl || undefined,
        discount_tag: discountTag.trim() || null,
        discount_price: discountPrice === "" ? null : Number(discountPrice),
      };

      let serviceId: string;

      if (initial) {
        await api.put(`/api/business/services/${initial.id}`, body);
        toast.success("Услуга обновлена");
        serviceId = initial.id;
      } else {
        const res = await api.post<{ service: { id: string } }>(
          "/api/business/services",
          body
        );
        toast.success("Услуга создана");
        serviceId = res.service.id;
      }

      // Sync service-specialist links
      const linksRes = await api.get<{ specialists: Specialist[] }>(
        `/api/business/services/${serviceId}/specialists`
      );
      const currentIds = new Set(linksRes.specialists.map((s) => s.id));

      for (const spId of linkedSpecialistIds) {
        if (!currentIds.has(spId)) {
          await api.post("/api/business/service-specialists", {
            specialist_id: spId,
            service_id: serviceId,
          });
        }
      }
      for (const spId of currentIds) {
        if (!linkedSpecialistIds.has(spId)) {
          await api.delete(
            `/api/business/service-specialists?service_id=${serviceId}&specialist_id=${spId}`
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
            {initial ? "Редактировать услугу" : "Новая услуга"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ImageUpload value={photoUrl} onChange={setPhotoUrl} />

          <div>
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Замена масла"
            />
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание услуги..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Стоимость (₽)</Label>
              <Input
                type="number"
                min={0}
                value={priceFrom}
                onChange={(e) => setPriceFrom(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Длительность (мин)</Label>
              <Input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="price-fixed"
              checked={priceFixed}
              onCheckedChange={setPriceFixed}
            />
            <Label htmlFor="price-fixed">
              {priceFixed ? "Фиксированная цена" : "Цена от"}
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-tag">Тег скидки (например: 10% или Акция)</Label>
              <Input
                id="discount-tag"
                value={discountTag}
                onChange={(e) => setDiscountTag(e.target.value)}
                placeholder="Нет скидки"
              />
            </div>
            <div>
              <Label htmlFor="discount-price">Цена со скидкой (₽)</Label>
              <Input
                id="discount-price"
                type="number"
                min={0}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Оставьте пустым"
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-base">Кто выполняет услугу</Label>
            <p className="text-sm text-text-secondary mb-2">
              Выберите сотрудников, которые могут оказывать эту услугу
            </p>
            {allSpecialists.length === 0 ? (
              <p className="text-sm text-text-muted">
                Сначала добавьте сотрудников
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {allSpecialists.map((sp) => (
                  <label
                    key={sp.id}
                    className="flex items-center gap-2 cursor-pointer py-1"
                  >
                    <Checkbox
                      checked={linkedSpecialistIds.has(sp.id)}
                      onCheckedChange={() => toggleSpecialist(sp.id)}
                    />
                    <span className="text-sm">{sp.full_name}</span>
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
