"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Можно загружать только изображения");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл не должен превышать 5 МБ");
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await api.post<{ url: string; public_id: string }>(
        "/api/business/upload",
        { file_base64: base64 }
      );
      onChange(res.url);
      toast.success("Изображение загружено");
    } catch (err: any) {
      toast.error(err.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block rounded-lg overflow-hidden border">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Удалить"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted hover:bg-surface-hover transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          ) : (
            <Upload className="h-6 w-6 text-text-muted" />
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
