"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Users2,
  Pencil,
  Trash2,
  Plus,
  Wrench,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Specialist {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialization: string | null;
}

interface Props {
  employees: Specialist[];
  loading: boolean;
  onEdit: (employee: Specialist) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

export function EmployeeList({
  employees,
  loading,
  onEdit,
  onAdd,
  onRefresh,
}: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/business/specialists/${deleteId}`);
      toast.success("Сотрудник удалён");
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={<Users2 />}
        title="Нет сотрудников"
        description="Добавьте первого сотрудника"
        action={
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить сотрудника
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Все сотрудники</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {employees.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {e.photo_url ? (
                    <img
                      src={e.photo_url}
                      alt={e.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-surface-muted text-text-secondary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {e.full_name}
                  </p>
                  <p className="text-sm text-text-secondary truncate flex items-center gap-1">
                    <Wrench className="h-3 w-3 shrink-0" />
                    {e.specialization || "—"}
                  </p>
                </div>

                <Badge variant="outline" className="shrink-0">
                  Сотрудник
                </Badge>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(e)}
                    aria-label="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(e.id)}
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
            <DialogTitle>Удалить сотрудника?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Сотрудник будет удалён навсегда.
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
