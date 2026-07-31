"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import newPriceServices from "@/data/autogrom-price-services.json";
import oldImportedServices from "@/data/old-dikidi-services.json";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ExistingService {
  id: string;
  title: string;
}

export default function ServicesImportPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);

  async function handleImport() {
    const normalizeTitle = (title: string) =>
      title.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");

    setImporting(true);
    setFinished(false);
    setProgress(0);

    try {
      const response = await api.get<{ services: ExistingService[] }>("/api/business/services");
      const oldTitles = new Set(oldImportedServices.map((service) => normalizeTitle(service.title)));
      const newTitles = new Set(newPriceServices.map((service) => normalizeTitle(service.title)));
      const oldServicesToDelete = response.services.filter((service) => {
        const title = normalizeTitle(service.title);
        return oldTitles.has(title) && !newTitles.has(title);
      });

      const existingByTitle = new Map(
        response.services.map((service) => [normalizeTitle(service.title), service])
      );
      const queuedTitles = new Set<string>();
      const uniqueServices = newPriceServices.filter((service) => {
        const title = normalizeTitle(service.title);
        if (queuedTitles.has(title)) return false;
        queuedTitles.add(title);
        return true;
      });
      const jobs = uniqueServices.map((service) => ({
        service,
        existing: existingByTitle.get(normalizeTitle(service.title)),
      }));
      const updateCount = jobs.filter((job) => job.existing).length;
      const createCount = jobs.length - updateCount;

      const confirmed = window.confirm(
        `Заменить старый прайс новым? Удалить старых услуг: ${oldServicesToDelete.length}. Добавить новых: ${createCount}. Обновить совпавших: ${updateCount}.`
      );
      if (!confirmed) return;

      setTotal(oldServicesToDelete.length + jobs.length);
      let completedCount = 0;
      let failedCount = 0;
      const batchSize = 5;

      for (let index = 0; index < oldServicesToDelete.length; index += batchSize) {
        const batch = oldServicesToDelete.slice(index, index + batchSize);
        const results = await Promise.allSettled(
          batch.map((service) => api.delete(`/api/business/services/${service.id}`))
        );
        completedCount += results.filter((result) => result.status === "fulfilled").length;
        failedCount += results.filter((result) => result.status === "rejected").length;
        setProgress(completedCount + failedCount);
      }

      for (let index = 0; index < jobs.length; index += batchSize) {
        const batch = jobs.slice(index, index + batchSize);
        const results = await Promise.allSettled(
          batch.map((job) =>
            job.existing
              ? api.put(`/api/business/services/${job.existing.id}`, job.service)
              : api.post("/api/business/services", job.service)
          )
        );

        completedCount += results.filter((result) => result.status === "fulfilled").length;
        failedCount += results.filter((result) => result.status === "rejected").length;
        setProgress(completedCount + failedCount);
      }

      setFinished(failedCount === 0);
      if (failedCount > 0) {
        toast.error(`Готово ${completedCount}, ошибок ${failedCount}. Можно повторить.`);
      } else {
        toast.success(`Прайс заменён: удалено ${oldServicesToDelete.length}, добавлено ${createCount}, обновлено ${updateCount}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось импортировать услуги");
    } finally {
      setImporting(false);
    }
  }

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Link href="/services" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand-orange">
        <ArrowLeft className="h-4 w-4" />
        Вернуться к услугам
      </Link>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand-orange">
          {finished ? <CheckCircle2 className="h-7 w-7" /> : <RefreshCw className="h-7 w-7" />}
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Замена прайса услуг</h1>
        <p className="mt-2 text-text-secondary">
          Старые 237 услуг прошлого импорта будут удалены. Новый каталог содержит 292 услуги с категориями, ценами, нормо-часами и описаниями. Дубликаты не создаются.
        </p>

        {importing && total > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Добавляем услуги</span>
              <span>{progress}/{total}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-orange-100">
              <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          {importing ? `Заменяем прайс ${progress}/${total || "…"}` : "Заменить прайс на новый"}
        </button>
      </div>
    </div>
  );
}
