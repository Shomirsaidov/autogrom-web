"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { MessageSquare, Search, ChevronRight, User, Star, Plus, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Conversation {
  id: string;
  user_id: string | null;
  specialist_id: string | null;
  is_group?: boolean;
  group_name?: string | null;
  created_by?: string | null;
  last_message_at: string | null;
  last_message_body: string | null;
  last_message_sender: string | null;
  created_at: string;
  specialist: {
    id: string;
    full_name: string;
    photo_url?: string;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
}

interface Specialist {
  id: string;
  full_name: string;
  photo_url?: string;
  specialization?: string;
  user_id?: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Group creation state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    api
      .get<{ conversations: Conversation[] }>("/api/conversations")
      .then((res) => setConversations(res.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreateDialog = async () => {
    setCreateDialogOpen(true);
    setLoadingSpecialists(true);
    try {
      const res = await api.get<{ specialists: Specialist[] }>(
        "/api/business/specialists"
      );
      setSpecialists(res.specialists || []);
    } catch (err) {
      console.error("Error loading specialists", err);
    } finally {
      setLoadingSpecialists(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    setCreatingGroup(true);
    try {
      const res = await api.post<{ conversation: Conversation }>(
        "/api/conversations/group",
        {
          group_name: groupName.trim(),
          user_ids: selectedUserIds,
        }
      );
      setCreateDialogOpen(false);
      setGroupName("");
      setSelectedUserIds([]);
      router.push(`/chats/${res.conversation.id}`);
    } catch (err) {
      console.error("Failed to create group", err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.is_group && c.group_name?.toLowerCase().includes(q)) ||
      c.client?.name?.toLowerCase().includes(q) ||
      c.specialist?.full_name?.toLowerCase().includes(q)
    );
  });

  const isStaffManager = user?.role === "admin" || user?.role === "moderator";

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Чаты</h1>
        {isStaffManager && (
          <Button
            onClick={openCreateDialog}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2 h-9 text-xs"
          >
            <Plus className="h-4 w-4" />
            Создать группу
          </Button>
        )}
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Поиск по чатам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="Нет чатов"
          description="Чаты появляются, когда клиент начинает переписку или создается группа."
        />
      ) : (
        <Card className="border-0 shadow-none bg-transparent py-0 gap-0 lg:border lg:shadow-sm lg:bg-card lg:py-6 lg:gap-6">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((conv) => {
                const isGroup = conv.is_group;
                const name = isGroup
                  ? conv.group_name || "Групповой чат"
                  : conv.client?.name || conv.specialist?.full_name || "Клиент";
                const time = conv.last_message_at
                  ? formatRelativeTime(conv.last_message_at)
                  : "";
                const needsReply =
                  !isGroup &&
                  conv.last_message_sender &&
                  conv.last_message_sender !== "business";

                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-surface-hover cursor-pointer transition-colors active:bg-surface-hover/80",
                      needsReply ? "bg-brand-orange/[0.02]" : ""
                    )}
                    onClick={() => router.push(`/chats/${conv.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={cn(
                          "text-white text-sm font-semibold",
                          isGroup ? "bg-brand-blue" : "bg-brand-orange"
                        )}
                      >
                        {isGroup ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <p
                            className={cn(
                              "font-medium truncate",
                              needsReply
                                ? "font-semibold text-text-primary"
                                : "text-text-primary"
                            )}
                          >
                            {name}
                          </p>
                          {isGroup && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 font-normal h-4 border-none bg-brand-blue/10 text-brand-blue shrink-0"
                            >
                              Группа
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {needsReply && (
                            <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                          )}
                          {time && (
                            <span
                              className={cn(
                                "text-xs",
                                needsReply
                                  ? "text-brand-orange font-medium"
                                  : "text-text-muted"
                              )}
                            >
                              {time}
                            </span>
                          )}
                        </div>
                      </div>
                      {conv.last_message_body && (
                        <p
                          className={cn(
                            "text-sm truncate mt-0.5",
                            needsReply
                              ? "text-text-primary font-medium"
                              : "text-text-secondary"
                          )}
                        >
                          {conv.last_message_sender === "business" && "Вы: "}
                          {conv.last_message_body}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted shrink-0 ml-1" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for creating group chat */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать групповой чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="groupName" className="text-xs font-semibold text-text-secondary">
                Название группы
              </Label>
              <Input
                id="groupName"
                placeholder="Например: Смена А, Общий чат..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-text-secondary">
                Выберите участников (специалистов)
              </Label>
              <div className="border rounded-lg max-h-60 overflow-y-auto divide-y bg-surface">
                {loadingSpecialists ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                  </div>
                ) : specialists.length === 0 ? (
                  <div className="p-4 text-sm text-text-muted text-center">
                    Нет доступных специалистов
                  </div>
                ) : (
                  specialists.map((spec) => {
                    const hasAccount = !!spec.user_id;
                    const isSelected = spec.user_id
                      ? selectedUserIds.includes(spec.user_id)
                      : false;
                    return (
                      <div
                        key={spec.id}
                        className={cn(
                          "flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors",
                          !hasAccount && "opacity-60 bg-surface-muted/50"
                        )}
                      >
                        <Checkbox
                          id={`spec-${spec.id}`}
                          disabled={!hasAccount}
                          checked={isSelected}
                          onCheckedChange={() =>
                            spec.user_id && toggleUserSelection(spec.user_id)
                          }
                        />
                        <Label
                          htmlFor={`spec-${spec.id}`}
                          className="flex-1 text-sm font-normal cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-text-primary">
                              {spec.full_name}
                            </p>
                            {spec.specialization && (
                              <p className="text-xs text-text-secondary">
                                {spec.specialization}
                              </p>
                            )}
                          </div>
                          {!hasAccount && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-text-muted border-border/80"
                            >
                              Нет аккаунта
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creatingGroup}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-medium"
              onClick={handleCreateGroup}
              disabled={
                creatingGroup || !groupName.trim() || selectedUserIds.length === 0
              }
            >
              {creatingGroup && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин`;
  if (diffHours < 24) return `${diffHours} ч`;
  if (diffDays === 1) return "вчера";
  return date.toLocaleDateString("ru", { day: "numeric", month: "short" });
}
