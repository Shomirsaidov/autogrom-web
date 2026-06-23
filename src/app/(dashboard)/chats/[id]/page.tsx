"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth-context";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image,
  FileText,
  Loader2,
  Users,
  Plus,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  conversation_id: string;
  sender_role: string;
  body: string;
  photo_url?: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender_id?: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ConversationDetail {
  id: string;
  user_id: string | null;
  specialist_id: string | null;
  is_group?: boolean;
  group_name?: string | null;
  created_by?: string | null;
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

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Group Details dialog states
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [allSpecialists, setAllSpecialists] = useState<any[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  const loadMessages = async () => {
    try {
      const res = await api.get<{ messages: Message[] }>(
        `/api/conversations/${params.id}/messages`
      );
      setMessages(res.messages);
      if (!conv) {
        const convRes = await api.get<{ conversations: ConversationDetail[] }>(
          "/api/conversations"
        );
        const found = convRes.conversations.find(
          (c: any) => c.id === params.id
        );
        if (found) setConv(found as any);
      }
    } catch {}
  };

  useEffect(() => {
    loadMessages().finally(() => setLoading(false));

    // Poll every 5 seconds
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get<{ members: any[] }>(
        `/api/conversations/${params.id}/members`
      );
      setMembers(res.members || []);
    } catch (err) {
      console.error("Failed to load group members", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openInfoDialog = () => {
    setInfoDialogOpen(true);
    loadMembers();
  };

  const handleRemoveMember = async (memberUserId: string) => {
    try {
      await api.delete(
        `/api/conversations/${params.id}/members/${memberUserId}`
      );
      await loadMembers();
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  const openAddMemberDialog = async () => {
    setAddMemberDialogOpen(true);
    setLoadingSpecialists(true);
    try {
      const res = await api.get<{ specialists: any[] }>(
        "/api/business/specialists"
      );
      const currentMemberUserIds = members.map((m) => m.user_id);
      const available = (res.specialists || []).filter(
        (spec) => spec.user_id && !currentMemberUserIds.includes(spec.user_id)
      );
      setAllSpecialists(available);
    } catch (err) {
      console.error("Failed to load specialists", err);
    } finally {
      setLoadingSpecialists(false);
    }
  };

  const handleAddMember = async (memberUserId: string) => {
    try {
      await api.post(`/api/conversations/${params.id}/members`, {
        user_id: memberUserId,
      });
      setAddMemberDialogOpen(false);
      await loadMembers();
    } catch (err) {
      console.error("Failed to add member", err);
    }
  };

  async function handleSend() {
    const body = text.trim();
    if (!body || sending || uploading) return;

    setSending(true);
    try {
      await api.post(`/api/conversations/${params.id}/messages`, {
        body,
        sender_role: "business",
      });
      setText("");
      await loadMessages();
    } catch {}
    setSending(false);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading || sending) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const payload: any = {
          sender_role: "business",
        };

        if (file.type.startsWith("image/")) {
          payload.photo_base64 = base64;
        } else {
          payload.file_base64 = base64;
          payload.file_name = file.name;
        }

        await api.post(`/api/conversations/${params.id}/messages`, payload);
        await loadMessages();
      } catch (err) {
        console.error("Failed to upload file:", err);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isGroup = conv?.is_group;
  const title = isGroup ? conv.group_name || "Группа" : conv?.client?.name || "Чат";
  const isStaffManager = user?.role === "admin" || user?.role === "moderator";

  if (loading && !conv) {
    return (
      <div className="flex flex-col h-full lg:h-[calc(100vh-8rem)] bg-background">
        <div className="h-[env(safe-area-inset-top,0px)] w-full bg-surface shrink-0" />
        <div className="flex items-center gap-3 p-4 border-b bg-surface">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4 bg-slate-50/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-12 w-3/4",
                i % 2 === 0 ? "ml-auto" : ""
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-8rem)] bg-background overflow-hidden">
      {/* Hidden file input for attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        disabled={uploading || sending}
      />

      {/* Safe Area Spacer at top for Mobile Devices */}
      <div className="h-[env(safe-area-inset-top,0px)] w-full bg-surface shrink-0" />

      {/* Header */}
      <div
        onClick={isGroup ? openInfoDialog : undefined}
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3 shrink-0 bg-surface",
          isGroup ? "cursor-pointer hover:bg-surface-hover/50 transition-colors" : ""
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/chats");
          }}
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={cn(
              "text-white text-xs font-semibold",
              isGroup ? "bg-brand-blue" : "bg-brand-orange"
            )}
          >
            {isGroup ? (
              <Users className="h-4 w-4" />
            ) : (
              title
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{title}</p>
          {isGroup && (
            <p className="text-[10px] text-text-secondary truncate mt-0.5">
              Нажмите для просмотра участников
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-text-secondary">
            Начните диалог. Напишите первое сообщение.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id
            ? msg.sender_id === user?.id
            : msg.sender_role === "business";

          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isMe ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                  isMe
                    ? "bg-brand-orange text-white rounded-br-none"
                    : "bg-surface text-text-primary rounded-bl-none border border-border/50"
                )}
              >
                {!isMe && isGroup && msg.sender?.name && (
                  <p className="text-xs font-semibold text-brand-blue mb-1">
                    {msg.sender.name}
                  </p>
                )}
                {msg.body && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>
                )}
                {msg.photo_url && (
                  <img
                    src={msg.photo_url}
                    alt="Фото"
                    className="mt-1.5 rounded-lg max-w-full border border-black/5"
                  />
                )}
                {msg.file_url && (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-1.5 flex items-center gap-2 text-sm underline font-medium",
                      isMe ? "text-white/90 hover:text-white" : "text-brand-blue hover:text-brand-blue/90"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-[180px]">{msg.file_name || "Файл"}</span>
                  </a>
                )}
                <div className="flex justify-end items-center mt-1">
                  <p
                    className={cn(
                      "text-[9px] font-medium leading-none",
                      isMe ? "text-white/60" : "text-text-muted"
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("ru", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-text-secondary hover:text-brand-orange hover:bg-surface-hover"
            aria-label="Прикрепить файл"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-orange" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? "Файл загружается..." : "Сообщение..."}
            className="flex-1 focus-visible:ring-1 focus-visible:ring-brand-orange"
            disabled={sending || uploading}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-brand-orange hover:bg-brand-orange/90 text-white"
            onClick={handleSend}
            disabled={!text.trim() || sending || uploading}
            aria-label="Отправить"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {/* Safe Area Spacer at bottom for Mobile Devices (e.g. Home indicator bar) */}
        <div className="h-[env(safe-area-inset-bottom,0px)] w-full shrink-0" />
      </div>

      {/* Group Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Групповой чат: {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-semibold text-text-secondary">
                Участники группы
              </span>
              {isStaffManager && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openAddMemberDialog}
                  className="text-brand-orange border-brand-orange/20 hover:bg-brand-orange/5 h-8 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Добавить
                </Button>
              )}
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto divide-y bg-surface">
              {loadingMembers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                </div>
              ) : members.length === 0 ? (
                <div className="p-4 text-sm text-text-muted text-center">
                  Нет участников
                </div>
              ) : (
                members.map((member) => {
                  const isCurrentMemberMe = member.user_id === user?.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 hover:bg-surface-hover/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                          {member.user?.name || "Сотрудник"}
                          {isCurrentMemberMe && (
                            <span className="text-[10px] font-normal text-text-muted">
                              (Вы)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {member.user?.role || "master"}
                        </p>
                      </div>
                      {isStaffManager && !isCurrentMemberMe && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger/5 shrink-0"
                          aria-label="Исключить"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button
              size="sm"
              onClick={() => setInfoDialogOpen(false)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-medium"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Добавить участника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border rounded-lg max-h-60 overflow-y-auto divide-y bg-surface">
              {loadingSpecialists ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
                </div>
              ) : allSpecialists.length === 0 ? (
                <div className="p-4 text-sm text-text-muted text-center">
                  Все специалисты уже добавлены
                </div>
              ) : (
                allSpecialists.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-center justify-between p-3 hover:bg-surface-hover/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {spec.full_name}
                      </p>
                      {spec.specialization && (
                        <p className="text-xs text-text-secondary">
                          {spec.specialization}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => spec.user_id && handleAddMember(spec.user_id)}
                      className="text-brand-blue hover:bg-brand-blue/5 font-semibold text-xs h-8"
                    >
                      Выбрать
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
            >
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
