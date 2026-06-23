"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/image-upload";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save, Trash2, Plus, Image as ImageIcon, MapPin, Phone, Clock, FileText } from "lucide-react";

interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  coordinates: string;
  working_hours: string;
  logo_url: string | null;
  carousel_urls: string[];
}

interface Service {
  id: string;
  title: string;
}

interface WorkExample {
  id: string;
  description: string;
  photo_url: string;
  service_id: string | null;
  service?: {
    id: string;
    title: string;
  } | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [workSaving, setWorkSaving] = useState(false);

  // Profile States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [carouselUrls, setCarouselUrls] = useState<string[]>([]);

  // Services & Work Examples States
  const [services, setServices] = useState<Service[]>([]);
  const [workExamples, setWorkExamples] = useState<WorkExample[]>([]);
  
  // New Work Example Form State
  const [newWorkPhoto, setNewWorkPhoto] = useState("");
  const [newWorkDesc, setNewWorkDesc] = useState("");
  const [newWorkServiceId, setNewWorkServiceId] = useState<string>("general");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, servicesRes, worksRes] = await Promise.all([
        api.get<{ profile: CompanyProfile }>("/api/company/profile"),
        api.get<{ services: Service[] }>("/api/business/services"),
        api.get<{ work_examples: WorkExample[] }>("/api/business/work-examples"),
      ]);

      const p = profileRes.profile;
      setName(p.name);
      setDescription(p.description);
      setPhone(p.phone);
      setAddress(p.address);
      setCoordinates(p.coordinates);
      setWorkingHours(p.working_hours);
      setLogoUrl(p.logo_url || "");
      setCarouselUrls(p.carousel_urls || []);

      setServices(servicesRes.services || []);
      setWorkExamples(worksRes.work_examples || []);
    } catch (err) {
      toast.error("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveProfileDirectly(newLogo: string | null, newCarousel: string[]) {
    try {
      await api.put("/api/business/company/profile", {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        coordinates: coordinates.trim() || "55.7558,37.6173",
        working_hours: workingHours.trim() || "Пн-Вс: 09:00 - 21:00",
        logo_url: newLogo,
        carousel_urls: newCarousel,
      });
      toast.success("Профиль сохранен на сервере");
    } catch (err: any) {
      toast.error("Не удалось сохранить профиль на сервере");
    }
  }

  async function handleSaveProfile() {
    if (!name.trim()) return toast.error("Название автосервиса обязательно");
    if (!phone.trim()) return toast.error("Телефон обязателен");
    if (!address.trim()) return toast.error("Адрес обязателен");

    setProfileSaving(true);
    try {
      await api.put("/api/business/company/profile", {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        coordinates: coordinates.trim() || "55.7558,37.6173",
        working_hours: workingHours.trim() || "Пн-Вс: 09:00 - 21:00",
        logo_url: logoUrl || null,
        carousel_urls: carouselUrls,
      });
      toast.success("Профиль автосервиса успешно сохранен");
    } catch (err: any) {
      toast.error(err.message || "Ошибка сохранения профиля");
    } finally {
      setProfileSaving(false);
    }
  }

  function handleLogoChange(url: string) {
    setLogoUrl(url);
    saveProfileDirectly(url || null, carouselUrls);
  }

  function handleAddCarouselUrl(url: string) {
    if (url) {
      const next = [...carouselUrls, url];
      setCarouselUrls(next);
      saveProfileDirectly(logoUrl || null, next);
    }
  }

  function handleRemoveCarouselUrl(index: number) {
    const next = carouselUrls.filter((_, i) => i !== index);
    setCarouselUrls(next);
    saveProfileDirectly(logoUrl || null, next);
  }

  async function handleAddWorkExample() {
    if (!newWorkPhoto) return toast.error("Загрузите фотографию примера работы");
    if (!newWorkDesc.trim()) return toast.error("Укажите описание выполненных работ");

    setWorkSaving(true);
    try {
      const body = {
        photo_url: newWorkPhoto,
        description: newWorkDesc.trim(),
        service_id: newWorkServiceId === "general" ? null : newWorkServiceId,
      };

      await api.post("/api/business/work-examples", body);
      toast.success("Пример работы добавлен");
      
      // Reset form
      setNewWorkPhoto("");
      setNewWorkDesc("");
      setNewWorkServiceId("general");
      
      // Refresh list
      const worksRes = await api.get<{ work_examples: WorkExample[] }>("/api/business/work-examples");
      setWorkExamples(worksRes.work_examples || []);
    } catch (err: any) {
      toast.error(err.message || "Ошибка добавления примера работы");
    } finally {
      setWorkSaving(false);
    }
  }

  async function handleDeleteWorkExample(id: string) {
    try {
      await api.delete(`/api/business/work-examples/${id}`);
      toast.success("Пример работы удален");
      setWorkExamples((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Ошибка удаления");
    }
  }

  if (loading && name === "") {
    return <div className="flex h-64 items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Настройки профиля</h1>
        <p className="text-sm text-text-secondary">Управление публичной информацией о сервисе, обложками и примерами работ.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация об автосервисе</CardTitle>
              <CardDescription>Эти данные отображаются на главном экране мобильного приложения.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo">Логотип компании</Label>
                  <ImageUpload value={logoUrl} onChange={handleLogoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Название</Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Авто-Сервис №1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-desc">Описание</Label>
                <Textarea
                  id="company-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Коротко о вашей компании, услугах..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">
                    <Phone className="inline h-4 w-4 mr-1 text-text-secondary" />
                    Телефон для звонков
                  </Label>
                  <Input
                    id="company-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-hours">
                    <Clock className="inline h-4 w-4 mr-1 text-text-secondary" />
                    Режим работы
                  </Label>
                  <Input
                    id="company-hours"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Пн-Вс: 09:00 - 21:00"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-address">
                    <MapPin className="inline h-4 w-4 mr-1 text-text-secondary" />
                    Адрес
                  </Label>
                  <Input
                    id="company-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="г. Москва, ул. Автомобильная, д. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-coords">Координаты GPS (для навигаторов)</Label>
                  <Input
                    id="company-coords"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder="55.7558,37.6173"
                  />
                </div>
              </div>

              <Button
                className="w-full sm:w-auto bg-brand-orange text-white hover:bg-brand-orange/90"
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {profileSaving ? "Сохранение..." : "Сохранить профиль"}
              </Button>
            </CardContent>
          </Card>

          {/* Visual Showcase (Carousel URLs) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Слайдер на главном экране (Интерьер/Экстерьер)</CardTitle>
              <CardDescription>Загрузите фото боксов, оборудования и здания для привлечения клиентов.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Carousel Grid */}
              {carouselUrls.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted border-2 border-dashed rounded-lg">
                  <ImageIcon className="h-8 w-8 mx-auto text-text-muted mb-2" />
                  Нет фотографий в слайдере
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {carouselUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border bg-surface-muted">
                      <img src={url} alt={`Slider ${index}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveCarouselUrl(index)}
                        className="absolute top-1 right-1 rounded-full bg-danger/80 p-1.5 text-white hover:bg-danger"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add New Slider Photo */}
              <div className="space-y-2">
                <Label>Добавить фото в слайдер</Label>
                <ImageUpload value="" onChange={handleAddCarouselUrl} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Examples Panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Add Work Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Добавить пример работы</CardTitle>
              <CardDescription>Создайте карточку выполненной работы (например, полировка кузова, ремонт ДВС).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Фото работы</Label>
                <ImageUpload value={newWorkPhoto} onChange={setNewWorkPhoto} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-service">Специфично для услуги</Label>
                <Select value={newWorkServiceId} onValueChange={setNewWorkServiceId}>
                  <SelectTrigger id="work-service">
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Общий (на главном экране)</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-desc">Описание выполненной работы</Label>
                <Textarea
                  id="work-desc"
                  value={newWorkDesc}
                  onChange={(e) => setNewWorkDesc(e.target.value)}
                  placeholder="Например: Замена тормозных дисков и колодок на Audi A6. Время работы: 1.5 часа..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
                onClick={handleAddWorkExample}
                disabled={workSaving}
              >
                <Plus className="mr-2 h-4 w-4" />
                {workSaving ? "Добавление..." : "Добавить в галерею"}
              </Button>
            </CardContent>
          </Card>

          {/* List Work Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Галерея выполненных работ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {workExamples.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">Галерея пока пуста</p>
              ) : (
                <div className="space-y-3">
                  {workExamples.map((item) => (
                    <div key={item.id} className="flex gap-3 p-2 border rounded-lg bg-surface-muted items-start">
                      <img src={item.photo_url} alt="Work example" className="h-16 w-16 rounded object-cover shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {item.service ? item.service.title : "Общий пример"}
                        </p>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteWorkExample(item.id)}
                        className="text-danger hover:bg-danger/10 hover:text-danger shrink-0 h-8 w-8"
                        aria-label="Удалить пример работы"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
