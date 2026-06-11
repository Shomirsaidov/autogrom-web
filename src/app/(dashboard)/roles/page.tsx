"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useAuth } from "@/stores/auth-context";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { Shield, User, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/lib/types";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

interface SpecialistItem {
  id: string;
  full_name: string;
  specialization: string | null;
  user_id: string | null;
}

const AVAILABLE_ROLES: Role[] = ["admin", "moderator", "master", "client"];

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [users, setUsers] = useState<UserItem[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, specsRes] = await Promise.all([
        api.get<{ users: UserItem[] }>("/api/business/users"),
        api.get<{ specialists: SpecialistItem[] }>("/api/business/specialists"),
      ]);
      setUsers(usersRes.users);
      setSpecialists(specsRes.specialists);
    } catch {
      setUsers([]);
      setSpecialists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function changeRole(userId: string, newRole: Role) {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.patch(`/api/business/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("Роль обновлена");
    } catch (err: any) {
      toast.error(err.message || "Ошибка обновления роли");
      loadData();
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function linkSpecialist(userId: string, specialistId: string) {
    setSaving((prev) => ({ ...prev, [`link_${userId}`]: true }));
    try {
      await api.patch(`/api/business/specialists/${specialistId}/link-user`, { user_id: userId });
      setSpecialists((prev) =>
        prev.map((s) =>
          s.id === specialistId ? { ...s, user_id: userId } : s.user_id === userId ? { ...s, user_id: null } : s
        )
      );
      toast.success("Сотрудник привязан к пользователю");
    } catch (err: any) {
      toast.error(err.message || "Ошибка привязки");
      loadData();
    } finally {
      setSaving((prev) => ({ ...prev, [`link_${userId}`]: false }));
    }
  }

  async function unlinkSpecialist(specialistId: string) {
    setSaving((prev) => ({ ...prev, [`unlink_${specialistId}`]: true }));
    try {
      await api.patch(`/api/business/specialists/${specialistId}/unlink-user`);
      setSpecialists((prev) =>
        prev.map((s) => (s.id === specialistId ? { ...s, user_id: null } : s))
      );
      toast.success("Пользователь отвязан");
    } catch (err: any) {
      toast.error(err.message || "Ошибка отвязки");
      loadData();
    } finally {
      setSaving((prev) => ({ ...prev, [`unlink_${specialistId}`]: false }));
    }
  }

  function getLinkedSpecialist(userId: string): SpecialistItem | undefined {
    return specialists.find((s) => s.user_id === userId);
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Управление ролями</h1>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Shield />}
          title="Нет пользователей"
          description="Пользователи появятся после регистрации."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Пользователи</CardTitle>
            {!isAdmin && (
              <p className="text-sm text-text-muted mt-1">
                Только администратор может менять роли.
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {users.map((u) => {
                const linked = getLinkedSpecialist(u.id);
                const isMaster = u.role === "master";
                return (
                  <div key={u.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-surface-muted text-text-secondary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-text-muted ml-2">
                            (это вы)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {u.email}
                      </p>
                      {isMaster && (
                        <p className="text-xs text-text-muted mt-1">
                          {linked ? (
                            <span className="inline-flex items-center gap-1 text-status-confirmed">
                              <UserCheck className="h-3 w-3" />
                              {linked.full_name}
                            </span>
                          ) : (
                            <span className="text-status-pending">
                              Сотрудник не привязан
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={u.role}
                        onValueChange={(val) => changeRole(u.id, val as Role)}
                        disabled={
                          !isAdmin || u.id === currentUser?.id || saving[u.id]
                        }
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isMaster && isAdmin && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={linked?.id || ""}
                            onValueChange={(val) => {
                              if (val === "__unlink") {
                                if (linked) unlinkSpecialist(linked.id);
                              } else {
                                linkSpecialist(u.id, val);
                              }
                            }}
                            disabled={
                              saving[`link_${u.id}`] || saving[`unlink_${linked?.id}`]
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue placeholder="Привязать сотрудника" />
                            </SelectTrigger>
                            <SelectContent>
                              {linked && (
                                <SelectItem value="__unlink">
                                  Отвязать
                                </SelectItem>
                              )}
                              {specialists
                                .filter((s) => !s.user_id || s.user_id === u.id)
                                .map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.full_name}
                                    {s.specialization && ` — ${s.specialization}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {(saving[`link_${u.id}`] || saving[`unlink_${linked?.id}`]) && (
                            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
