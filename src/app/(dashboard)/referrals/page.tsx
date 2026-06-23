"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Award, CheckCircle, Save } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ReferralSettings {
  enabled: boolean;
  signup_reward: number;
  referrer_signup_reward: number;
  referrer_first_visit_reward: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  referrer_name: string;
  referee_name: string;
}

interface Analytics {
  total_invitations: number;
  successful_registrations: number;
  first_visits: number;
  total_points_awarded: number;
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReferralSettings>({
    enabled: true,
    signup_reward: 100,
    referrer_signup_reward: 50,
    referrer_first_visit_reward: 200,
  });

  const [history, setHistory] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_invitations: 0,
    successful_registrations: 0,
    first_visits: 0,
    total_points_awarded: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, historyRes] = await FutureWait([
        api.get<{ settings: ReferralSettings }>("/api/business/referrals/settings"),
        api.get<{ transactions: Transaction[]; analytics: Analytics }>("/api/business/referrals/history"),
      ]);

      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
      }
      setHistory(historyRes.transactions);
      setAnalytics(historyRes.analytics);
    } catch (err: any) {
      toast.error("Не удалось загрузить данные реферальной программы");
    } finally {
      setLoading(false);
    }
  }, []);

  // Inline Future.wait helper to avoid undefined imports
  async function FutureWait<T1, T2>(promises: [Promise<T1>, Promise<T2>]): Promise<[T1, T2]> {
    return Promise.all(promises);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await api.put("/api/business/referrals/settings", settings);
      toast.success("Настройки реферальной программы сохранены");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Ошибка сохранения настроек");
    } finally {
      setSaving(false);
    }
  }

  function getEventLabel(type: string) {
    switch (type) {
      case "signup_bonus":
        return "Приветственный бонус рефералa";
      case "referee_signup_bonus":
        return "Бонус за приглашение (регистрация)";
      case "referee_first_visit_bonus":
        return "Бонус за первый визит реферала";
      default:
        return "Начисление баллов";
    }
  }

  if (loading && history.length === 0) {
    return <div className="flex h-64 items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Реферальная программа</h1>
          <p className="text-sm text-text-secondary">Управление реферальными начислениями, бонусами и историей приглашений.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-status-progress-bg text-status-progress">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Выдано бонусов</p>
              <h3 className="text-2xl font-bold text-text-primary">{analytics.total_points_awarded} баллов</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-status-confirmed-bg text-status-confirmed">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Успешных регистраций</p>
              <h3 className="text-2xl font-bold text-text-primary">{analytics.successful_registrations}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Первых визитов</p>
              <h3 className="text-2xl font-bold text-text-primary">{analytics.first_visits}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-status-pending-bg text-status-pending">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Конверсия в визит</p>
              <h3 className="text-2xl font-bold text-text-primary">
                {analytics.successful_registrations > 0
                  ? `${Math.round((analytics.first_visits / analytics.successful_registrations) * 100)}%`
                  : "0%"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Настройки программы</CardTitle>
            <CardDescription>Управление размером начисления баллов за события.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="program-toggle">Статус программы</Label>
                <p className="text-xs text-text-secondary">
                  {settings.enabled ? "Программа активна" : "Программа приостановлена"}
                </p>
              </div>
              <Switch
                id="program-toggle"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-reward">Регистрация по ссылке (реферал)</Label>
              <p className="text-xs text-text-secondary mb-1">
                Сколько баллов получает новый пользователь при регистрации по ссылке.
              </p>
              <Input
                id="signup-reward"
                type="number"
                min={0}
                value={settings.signup_reward}
                onChange={(e) => setSettings({ ...settings, signup_reward: Number(e.target.value) })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer-signup-reward">Пригласившему другу (регистрация)</Label>
              <p className="text-xs text-text-secondary mb-1">
                Баллы, начисляемые пригласившему пользователю сразу после регистрации друга.
              </p>
              <Input
                id="referrer-signup-reward"
                type="number"
                min={0}
                value={settings.referrer_signup_reward}
                onChange={(e) => setSettings({ ...settings, referrer_signup_reward: Number(e.target.value) })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer-first-visit-reward">Пригласившему другу (первый визит)</Label>
              <p className="text-xs text-text-secondary mb-1">
                Бонус, начисляемый пригласившему пользователю после первого завершенного визита друга.
              </p>
              <Input
                id="referrer-first-visit-reward"
                type="number"
                min={0}
                value={settings.referrer_first_visit_reward}
                onChange={(e) => setSettings({ ...settings, referrer_first_visit_reward: Number(e.target.value) })}
                disabled={!settings.enabled}
              />
            </div>

            <Button
              className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Сохранение..." : "Сохранить настройки"}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">История начислений</CardTitle>
            <CardDescription>Все операции по реферальной программе в системе.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">История начислений пока пуста</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Получатель бонуса</TableHead>
                      <TableHead>Друг (Реферал)</TableHead>
                      <TableHead>Тип начисления</TableHead>
                      <TableHead className="text-right">Баллы</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                          {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary">
                          {tx.referrer_name}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {tx.referee_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {getEventLabel(tx.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-status-confirmed">
                          +{tx.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
