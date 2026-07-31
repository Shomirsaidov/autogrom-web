"use client";

import { useState, useEffect, useCallback } from "react";
import { ServiceList } from "@/components/services/service-list";
import { ServiceForm } from "@/components/services/service-form";
import { api } from "@/lib/api";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  price_fixed: boolean;
  duration_minutes: number;
  photo_url: string | null;
  discount_tag?: string | null;
  discount_price?: number | "" | null;
}

interface EditingService extends Service {
  description: string;
  price_from: number;
  photo_url: string;
  discount_tag?: string | null;
  discount_price?: number | "" | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditingService | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ services: Service[] }>(
        "/api/business/services"
      );
      setServices(res.services);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  function handleEdit(s: Service) {
    setEditing({
      ...s,
      description: s.description ?? "",
      price_from: s.price_from ?? 0,
      photo_url: s.photo_url ?? "",
      discount_tag: s.discount_tag ?? "",
      discount_price: s.discount_price ?? "",
    });
    setFormOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleSaved() {
    setEditing(null);
    loadServices();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Услуги</h1>
      </div>

      <ServiceList
        services={services}
        loading={loading}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onRefresh={loadServices}
      />

      <ServiceForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing ?? undefined}
      />
    </div>
  );
}
