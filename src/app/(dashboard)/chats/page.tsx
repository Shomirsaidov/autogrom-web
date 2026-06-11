"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { MessageSquare, Search, ChevronRight, User, Star } from "lucide-react";

interface Conversation {
  id: string;
  user_id: string;
  specialist_id: string;
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

export default function ChatsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<{ conversations: Conversation[] }>("/api/conversations")
      .then((res) => setConversations(res.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.client?.name?.toLowerCase().includes(q) ||
      c.specialist?.full_name?.toLowerCase().includes(q)
    );
  });

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Чаты</h1>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Поиск по клиенту или специалисту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="Нет чатов"
          description="Чаты появляются, когда клиент начинает переписку."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((conv) => {
                const name = conv.client?.name || conv.specialist?.full_name || "Клиент";
                const time = conv.last_message_at
                  ? formatRelativeTime(conv.last_message_at)
                  : "";

                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 p-4 hover:bg-surface-hover cursor-pointer transition-colors"
                    onClick={() => router.push(`/chats/${conv.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-orange text-white text-sm">
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-text-primary truncate">
                          {name}
                        </p>
                        {time && (
                          <span className="text-xs text-text-muted shrink-0 ml-2">
                            {time}
                          </span>
                        )}
                      </div>
                      {conv.last_message_body && (
                        <p className="text-sm text-text-secondary truncate mt-0.5">
                          {conv.last_message_sender === "business" && "Вы: "}
                          {conv.last_message_body}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
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
