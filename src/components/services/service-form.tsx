"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/shared/image-upload";
import { api } from "@/lib/api";
import { toast } from "sonner";

const categories = [
  "Техническое обслуживание (ТО)", "Двигатель", "Ходовая часть",
  "Тормозная система", "Рулевое управление", "Трансмиссия",
  "Электрика", "Кондиционер", "Диагностика", "Без категории",
];

function splitDescription(value = "") {
  const match = value.match(/^\[Категория:\s*(.+?)\]\s*\n?([\s\S]*)$/);
  return match ? { category: match[1], text: match[2] } : { category: "Без категории", text: value };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  initial?: {
    id: string; title: string; description: string; price_from: number;
    price_fixed: boolean; duration_minutes: number; photo_url: string;
    discount_tag?: string | null; discount_price?: number | "" | null;
  };
}

export function ServiceForm({ open, onOpenChange, onSaved, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Без категории");
  const [description, setDescription] = useState("");
  const [priceFrom, setPriceFrom] = useState(0);
  const [priceFixed, setPriceFixed] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [photoUrl, setPhotoUrl] = useState("");
  const [discountTag, setDiscountTag] = useState("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");

  useEffect(() => {
    if (!open) return;
    const parsed = splitDescription(initial?.description || "");
    setTitle(initial?.title || "");
    setCategory(parsed.category);
    setDescription(parsed.text);
    setPriceFrom(initial?.price_from ?? 0);
    setPriceFixed(initial?.price_fixed ?? true);
    setDurationMinutes(initial?.duration_minutes || 60);
    setPhotoUrl(initial?.photo_url || "");
    setDiscountTag(initial?.discount_tag || "");
    setDiscountPrice(initial?.discount_price ?? "");
  }, [open, initial]);

  async function handleSave() {
    if (!title.trim()) return toast.error("Укажите название услуги");
    if (priceFrom <= 0) return toast.error("Укажите стоимость");
    if (durationMinutes < 1) return toast.error("Укажите длительность");
    setSaving(true);
    try {
      const cleanDescription = description.trim();
      const body = {
        title: title.trim(),
        description: `[Категория: ${category}]\n${cleanDescription}`,
        price_from: priceFrom,
        price_fixed: priceFixed,
        duration_minutes: durationMinutes,
        photo_url: photoUrl || undefined,
        discount_tag: discountTag.trim() || null,
        discount_price: discountPrice === "" ? null : Number(discountPrice),
      };
      if (initial) {
        await api.put(`/api/business/services/${initial.id}`, body);
        toast.success("Услуга обновлена");
      } else {
        await api.post("/api/business/services", body);
        toast.success("Услуга создана");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Редактировать услугу" : "Новая услуга"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <ImageUpload value={photoUrl} onChange={setPhotoUrl} />
          <div><Label>Название</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Замена масла" /></div>
          <div>
            <Label>Категория</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div><Label>Описание</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что входит в услугу..." rows={4} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Стоимость (₽)</Label><Input type="number" min={0} value={priceFrom} onChange={(e) => setPriceFrom(Number(e.target.value))} /></div>
            <div><Label>Длительность (мин)</Label><Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch id="price-fixed" checked={priceFixed} onCheckedChange={setPriceFixed} /><Label htmlFor="price-fixed">{priceFixed ? "Фиксированная цена" : "Цена от"}</Label></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Тег скидки</Label><Input value={discountTag} onChange={(e) => setDiscountTag(e.target.value)} placeholder="Нет скидки" /></div>
            <div><Label>Цена со скидкой (₽)</Label><Input type="number" min={0} value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
