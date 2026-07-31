"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/stores/auth-context";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import { toast } from "sonner";
import { KeyRound, Loader2, LogOut, Mail, MonitorSmartphone, Save, ShieldCheck, UserRound } from "lucide-react";

interface Session {
  id: string;
  current: boolean;
  ip: string;
  user_agent: string;
  last_active_at: string;
}

function deviceName(ua: string) {
  const browser = ua.includes("Edg/") ? "Microsoft Edge" : ua.includes("YaBrowser/") ? "Яндекс Браузер" : ua.includes("Chrome/") ? "Google Chrome" : ua.includes("Safari/") ? "Safari" : "Браузер";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Android") ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone / iPad" : ua.includes("Mac OS") ? "macOS" : "Неизвестная система";
  return `${browser} · ${os}`;
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(() => user?.avatar_url || (typeof window !== "undefined" ? localStorage.getItem("profile_avatar") || "" : ""));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const initials = useMemo(() => (name || "Пользователь").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [name]);

  useEffect(() => {
    api.get<{ sessions: Session[] }>("/api/auth/sessions")
      .then((result) => setSessions(result.sessions))
      .catch(() => toast.error("Не удалось загрузить журнал сессий"));
  }, []);

  async function saveProfile() {
    if (name.trim().length < 2) return toast.error("Укажите имя");
    if (!email.includes("@")) return toast.error("Проверьте email");
    setSaving(true);
    try {
      const result = await api.patch<{ user: User; token: string }>("/api/auth/profile", {
        name: name.trim(), email: email.trim(),
      });
      updateUser({ ...result.user, avatar_url: avatar || undefined }, result.token);
      toast.success("Профиль обновлён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPassword) return toast.error("Введите текущий пароль");
    if (newPassword.length < 6) return toast.error("Новый пароль должен содержать минимум 6 символов");
    if (newPassword !== confirmPassword) return toast.error("Новые пароли не совпадают");
    setPasswordSaving(true);
    try {
      await api.patch("/api/auth/password", { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast.success("Пароль изменён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось изменить пароль");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <div className="rounded-2xl border bg-gradient-to-r from-orange-50 to-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-orange text-xl font-bold text-white ring-4 ring-white shadow-md">
            {avatar ? <img src={avatar} alt="Аватар" className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Личный профиль</h1>
            <p className="mt-1 text-base text-text-secondary">Управляйте фотографией, контактами, паролем и входами в аккаунт.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><UserRound className="h-5 w-5 text-brand-orange" />Основные данные</CardTitle>
            <CardDescription className="text-sm">Эти данные отображаются в панели управления.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ImageUpload value={avatar} onChange={setAvatar} />
              <div className="text-sm text-text-secondary"><p className="font-semibold text-text-primary">Фотография профиля</p><p>JPG или PNG, размер до 5 МБ.</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="profile-name" className="text-base">Имя и фамилия</Label><Input id="profile-name" className="h-11 text-base" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="profile-email" className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" />Email</Label><Input id="profile-email" type="email" className="h-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button onClick={saveProfile} disabled={saving} className="h-11 w-full bg-brand-orange text-base text-white hover:bg-brand-orange/90 sm:w-auto">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Сохранить изменения</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><KeyRound className="h-5 w-5 text-brand-orange" />Изменение пароля</CardTitle><CardDescription>Для безопасности сначала укажите текущий пароль.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="old-password" className="text-base">Текущий пароль</Label><Input id="old-password" type="password" className="h-11 text-base" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="new-password" className="text-base">Новый пароль</Label><Input id="new-password" type="password" className="h-11 text-base" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="confirm-password" className="text-base">Повторите новый пароль</Label><Input id="confirm-password" type="password" className="h-11 text-base" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            <Button onClick={changePassword} disabled={passwordSaving} variant="outline" className="h-11 w-full text-base sm:w-auto">{passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Изменить пароль</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><MonitorSmartphone className="h-5 w-5 text-brand-orange" />Журнал сессий</CardTitle><CardDescription>Устройства, с которых выполнен вход в ваш аккаунт.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-4 rounded-xl border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-orange shadow-sm"><MonitorSmartphone className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{deviceName(session.user_agent)}</p>{session.current && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Текущая сессия</span>}</div><p className="mt-1 text-sm text-text-secondary">IP: {session.ip} · Активность: {new Date(session.last_active_at).toLocaleString("ru-RU")}</p></div></div>
              {session.current && <Button variant="outline" className="h-10 text-danger hover:bg-red-50 hover:text-danger" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Завершить сессию</Button>}
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Если заметили незнакомое устройство, измените пароль и завершите текущую сессию.</div>
        </CardContent>
      </Card>
    </div>
  );
}
