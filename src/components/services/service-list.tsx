"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { Wrench, Pencil, Trash2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  price_fixed: boolean;
  duration_minutes: number;
  photo_url: string | null;
}

interface Props {
  services: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

function formatServicePrice(s: Service) {
  if (!s.price_from) return "—";
  return s.price_fixed ? `${s.price_from} ₽` : `от ${s.price_from} ₽`;
}

export function ServiceList({ services, loading, onEdit, onAdd, onRefresh }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/business/services/${deleteId}`);
      toast.success("Услуга удалена");
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  if (services.length === 0) {
    return (
      <EmptyState
        icon={<Wrench />}
        title="Нет услуг"
        description="Добавьте первую услугу"
        action={
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить услугу
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Все услуги</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10 shrink-0">
                  <Wrench className="h-5 w-5 text-brand-orange" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {s.title}
                  </p>
                  <p className="text-sm text-text-secondary truncate">
                    {s.description || "—"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-text-primary">
                    {formatServicePrice(s)}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {s.duration_minutes} мин
                  </p>
                </div>

                <Badge
                  variant={s.price_fixed ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {s.price_fixed ? "Фикс" : "От"}
                </Badge>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(s)}
                    aria-label="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(s.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить услугу?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Услуга будет удалена навсегда.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
