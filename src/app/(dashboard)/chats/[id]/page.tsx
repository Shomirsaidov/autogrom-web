"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_role: string;
  body: string;
  photo_url?: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  user_id: string;
  specialist_id: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const loadMessages = async () => {
    try {
      const res = await api.get<{ messages: Message[] }>(
        `/api/conversations/${params.id}/messages`
      );
      // Also load user info from conversations list
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

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const title = conv?.client?.name || "Чат";

  if (loading && !conv) {
    return (
      <div className="flex flex-col h-[calc(100dvh-12rem)] sm:h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
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
    <div className="flex flex-col h-[calc(100dvh-12rem)] sm:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/chats")}
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-brand-orange text-white text-xs">
            {title
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-text-primary">{title}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-text-secondary">
            Начните диалог. Напишите первое сообщение.
          </div>
        )}
        {messages.map((msg) => {
          const isBusiness = msg.sender_role === "business";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isBusiness ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5",
                  isBusiness
                    ? "bg-brand-orange text-white rounded-br-md"
                    : "bg-surface-muted text-text-primary rounded-bl-md"
                )}
              >
                {msg.body && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>
                )}
                {msg.photo_url && (
                  <img
                    src={msg.photo_url}
                    alt="Фото"
                    className="mt-1 rounded-lg max-w-full"
                  />
                )}
                {msg.file_url && (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-1 flex items-center gap-2 text-sm underline",
                      isBusiness ? "text-white/80" : "text-brand-blue"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    {msg.file_name || "Файл"}
                  </a>
                )}
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    isBusiness ? "text-white/60" : "text-text-muted"
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString("ru", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-text-secondary"
            aria-label="Прикрепить файл"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-brand-orange hover:bg-brand-orange/90 text-white"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            aria-label="Отправить"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
