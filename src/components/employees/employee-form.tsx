"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/shared/image-upload";
import { api } from "@/lib/api";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface Service { id: string; title: string; description?: string | null; }
interface Props {
  open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void;
  initial?: { id: string; full_name: string; photo_url: string | null; specialization: string | null; };
}
function categoryOf(description?: string | null) {
  return description?.match(/^\[Категория:\s*(.+?)\]/)?.[1] || "Без категории";
}

export function EmployeeForm({ open, onOpenChange, onSaved, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [linkedServiceIds, setLinkedServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setFullName(initial?.full_name || ""); setSpecialization(initial?.specialization || ""); setPhotoUrl(initial?.photo_url || ""); setSearch("");
    api.get<{ services: Service[] }>("/api/business/services").then((res) => setAllServices(res.services)).catch(() => {});
    if (initial?.id) api.get<{ services: Service[] }>(`/api/business/specialists/${initial.id}/services`).then((res) => setLinkedServiceIds(new Set(res.services.map((service) => service.id)))).catch(() => {});
    else setLinkedServiceIds(new Set());
  }, [open, initial]);

  const grouped = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    const map = new Map<string, Service[]>();
    allServices.filter((service) => !query || service.title.toLocaleLowerCase("ru-RU").includes(query)).forEach((service) => {
      const category = categoryOf(service.description);
      map.set(category, [...(map.get(category) || []), service]);
    });
    return [...map.entries()];
  }, [allServices, search]);

  function toggleService(id: string) {
    setLinkedServiceIds((previous) => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleCategory(items: Service[]) {
    setLinkedServiceIds((previous) => {
      const next = new Set(previous); const allSelected = items.every((item) => next.has(item.id));
      items.forEach((item) => allSelected ? next.delete(item.id) : next.add(item.id)); return next;
    });
  }

  async function handleSave() {
    if (!fullName.trim()) return toast.error("Укажите имя сотрудника");
    setSaving(true);
    try {
      const body = { full_name: fullName.trim(), specialization: specialization.trim() || undefined, photo_url: photoUrl || undefined };
      let specialistId: string;
      if (initial) { await api.put(`/api/business/specialists/${initial.id}`, body); specialistId = initial.id; }
      else { const response = await api.post<{ specialist: { id: string } }>("/api/business/specialists", body); specialistId = response.specialist.id; }
      const links = await api.get<{ services: Service[] }>(`/api/business/specialists/${specialistId}/services`);
      const currentIds = new Set(links.services.map((service) => service.id));
      for (const serviceId of linkedServiceIds) if (!currentIds.has(serviceId)) await api.post("/api/business/service-specialists", { specialist_id: specialistId, service_id: serviceId });
      for (const serviceId of currentIds) if (!linkedServiceIds.has(serviceId)) await api.delete(`/api/business/service-specialists?specialist_id=${specialistId}&service_id=${serviceId}`);
      toast.success(initial ? "Сотрудник обновлён" : "Сотрудник создан"); onSaved(); onOpenChange(false);
    } catch (err: any) { toast.error(err.message || "Ошибка сохранения"); }
    finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{initial ? "Редактировать сотрудника" : "Новый сотрудник"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <ImageUpload value={photoUrl} onChange={setPhotoUrl} />
        <div><Label>ФИО</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" /></div>
        <div><Label>Специализация</Label><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Например: Моторный мастер" /></div>
        <Separator />
        <div>
          <Label className="text-base">Какие услуги выполняет мастер</Label>
          <p className="mb-3 text-sm text-text-secondary">Выберите отдельные услуги или всю категорию. Выбрано: {linkedServiceIds.size}</p>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Найти услугу" /></div>
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border p-3">
            {grouped.map(([category, items]) => <div key={category} className="rounded-lg border">
              <button type="button" onClick={() => toggleCategory(items)} className="flex w-full items-center justify-between bg-orange-50 px-3 py-2 text-left text-sm font-semibold"><span>{category}</span><span className="text-xs text-text-secondary">Выбрать все ({items.length})</span></button>
              <div className="grid gap-1 p-2 sm:grid-cols-2">{items.map((service) => <label key={service.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-surface-hover"><Checkbox checked={linkedServiceIds.has(service.id)} onCheckedChange={() => toggleService(service.id)} /><span className="text-sm leading-tight">{service.title}</span></label>)}</div>
            </div>)}
            {grouped.length === 0 && <p className="py-6 text-center text-sm text-text-secondary">Услуги не найдены</p>}
          </div>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
