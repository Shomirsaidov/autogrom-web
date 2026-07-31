"use client";

import { useState, useEffect, useCallback } from "react";
import { ServiceList } from "@/components/services/service-list";
import { ServiceForm } from "@/components/services/service-form";
import { api } from "@/lib/api";
import dikidiServices from "@/data/dikidi-services.json";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

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

  async function handleImport() {
    const normalizeTitle = (title: string) =>
      title.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
    const existingTitles = new Set(services.map((service) => normalizeTitle(service.title)));
    const queuedTitles = new Set<string>();
    const pendingServices = dikidiServices.filter((service) => {
      const title = normalizeTitle(service.title);
      if (existingTitles.has(title) || queuedTitles.has(title)) return false;
      queuedTitles.add(title);
      return true;
    });
    const skippedCount = dikidiServices.length - pendingServices.length;

    if (pendingServices.length === 0) {
      toast.success("Все услуги уже добавлены");
      return;
    }

    const confirmed = window.confirm(
      `Добавить ${pendingServices.length} услуг? Уже существующие: ${skippedCount}.`
    );
    if (!confirmed) return;

    setImporting(true);
    setImportProgress(0);
    setImportTotal(pendingServices.length);
    try {
      let importedCount = 0;
      let failedCount = 0;
      const batchSize = 5;

      for (let index = 0; index < pendingServices.length; index += batchSize) {
        const batch = pendingServices.slice(index, index + batchSize);
        const results = await Promise.allSettled(
          batch.map((service) => api.post("/api/business/services", service))
        );

        importedCount += results.filter((result) => result.status === "fulfilled").length;
        failedCount += results.filter((result) => result.status === "rejected").length;
        setImportProgress(Math.min(index + batch.length, pendingServices.length));
      }

      await loadServices();
      if (failedCount > 0) {
        toast.error(`Добавлено ${importedCount}, не удалось добавить ${failedCount}. Можно повторить.`);
      } else {
        toast.success(`Готово: добавлено ${importedCount}, пропущено ${skippedCount}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось импортировать услуги");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Услуги</h1>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {importing
            ? `Импортируем ${importProgress}/${importTotal}`
            : `Импортировать ${dikidiServices.length} услуг`}
        </button>
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
