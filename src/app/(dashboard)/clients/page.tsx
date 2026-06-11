"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { Users, Search, Phone, ChevronRight, User } from "lucide-react";

interface Client {
  name: string;
  phone: string;
  visit_count: number;
  last_visit: string | null;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api.get<{ clients: Client[] }>(
        `/api/business/clients${params}`
      );
      setClients(res.clients);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Клиенты</h1>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Нет клиентов"
          description="Клиенты появятся после создания первых записей."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {clients.map((client) => (
                <div
                  key={client.phone}
                  className="flex items-center gap-4 p-4 hover:bg-surface-hover cursor-pointer transition-colors"
                  onClick={() =>
                    router.push(`/clients/${encodeURIComponent(client.phone)}`)
                  }
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-surface-muted text-text-secondary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {client.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {client.phone}
                    </p>
                  </div>
                  <div className="text-right text-sm text-text-secondary">
                    <p>{client.visit_count} посещ.</p>
                    {client.last_visit && (
                      <p className="text-xs">
                        {new Date(client.last_visit).toLocaleDateString("ru")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${client.phone}`;
                    }}
                    aria-label="Позвонить"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
