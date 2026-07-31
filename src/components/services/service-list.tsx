"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { Clock, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string; title: string; description: string | null; price_from: number | null;
  price_fixed: boolean; duration_minutes: number; photo_url: string | null;
}
interface Props { services: Service[]; loading: boolean; onEdit: (service: Service) => void; onAdd: () => void; onRefresh: () => void; }

function parseDescription(value: string | null) {
  const match = (value || "").match(/^\[Категория:\s*(.+?)\]\s*\n?([\s\S]*)$/);
  return match ? { category: match[1], text: match[2] } : { category: "Без категории", text: value || "" };
}
function formatPrice(service: Service) {
  if (!service.price_from) return "—";
  return `${service.price_fixed ? "" : "от "}${service.price_from.toLocaleString("ru-RU")} ₽`;
}

export function ServiceList({ services, loading, onEdit, onAdd, onRefresh }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    const map = new Map<string, Service[]>();
    services.filter((service) => !query || service.title.toLocaleLowerCase("ru-RU").includes(query)).forEach((service) => {
      const category = parseDescription(service.description).category;
      map.set(category, [...(map.get(category) || []), service]);
    });
    return [...map.entries()];
  }, [services, search]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await api.delete(`/api/business/services/${deleteId}`); toast.success("Услуга удалена"); setDeleteId(null); onRefresh(); }
    catch (err: any) { toast.error(err.message || "Ошибка удаления"); }
    finally { setDeleting(false); }
  }
  if (loading) return <TableSkeleton />;
  if (services.length === 0) return <EmptyState icon={<Wrench />} title="Нет услуг" description="Добавьте первую услугу" action={<Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Добавить услугу</Button>} />;

  return <>
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><CardTitle className="text-lg">Каталог услуг</CardTitle><p className="mt-1 text-sm text-text-secondary">{services.length} услуг по категориям</p></div>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Найти услугу" /></div>
          <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Добавить</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-4">
        {grouped.map(([category, items]) => <section key={category} className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between bg-orange-50 px-4 py-3"><h2 className="font-semibold text-text-primary">{category}</h2><Badge variant="secondary">{items.length}</Badge></div>
          <div className="divide-y">
            {items.map((service) => {
              const parsed = parseDescription(service.description);
              return <div key={service.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-hover">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10"><Wrench className="h-4 w-4 text-brand-orange" /></div>
                <div className="min-w-0 flex-1"><p className="font-medium text-text-primary">{service.title}</p><p className="line-clamp-2 text-sm text-text-secondary">{parsed.text || "—"}</p></div>
                <div className="shrink-0 text-right"><p className="font-semibold">{formatPrice(service)}</p><p className="flex items-center justify-end gap-1 text-xs text-text-secondary"><Clock className="h-3 w-3" />{service.duration_minutes} мин</p></div>
                <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(service)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(service.id)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>;
            })}
          </div>
        </section>)}
        {grouped.length === 0 && <p className="py-10 text-center text-text-secondary">Ничего не найдено</p>}
      </CardContent>
    </Card>
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Удалить услугу?</DialogTitle><DialogDescription>Это действие нельзя отменить.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Отмена</Button><Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Удаление..." : "Удалить"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
