"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-context";
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Wrench,
  Users2,
  Settings,
  Gift,
  Shield,
  Ellipsis,
  Wrench as LogoIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";
import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";

const allNavItems = [
  { href: "/bookings", label: "Записи", icon: Calendar, roles: ["admin", "moderator", "master"] },
  { href: "/schedule", label: "График", icon: Clock, roles: ["admin", "moderator", "master"] },
  { href: "/clients", label: "Клиенты", icon: Users, roles: ["admin", "moderator"] },
  { href: "/chats", label: "Чаты", icon: MessageSquare, roles: ["admin", "moderator", "master"] },
  { href: "/services", label: "Услуги", icon: Wrench, roles: ["admin", "moderator"] },
  { href: "/employees", label: "Сотрудники", icon: Users2, roles: ["admin", "moderator"] },
  { href: "/roles", label: "Роли", icon: Shield, roles: ["admin"] },
  { href: "/referrals", label: "Рефералы", icon: Gift, roles: ["admin", "moderator"] },
  { href: "/settings", label: "Настройки", icon: Settings, roles: ["admin", "moderator", "master"] },
];

const PRIMARY_COUNT = 4;

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const primaryItems = visibleItems.slice(0, PRIMARY_COUNT);
  const moreItems = visibleItems.slice(PRIMARY_COUNT);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-surface pb-safe lg:hidden">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors min-w-0 flex-1",
                isActive
                  ? "text-brand-orange"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors min-w-0 flex-1",
                  "text-text-muted hover:text-text-secondary"
                )}
              >
                <Ellipsis className="h-5 w-5" />
                <span>Ещё</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl p-0 pb-safe">
              <VisuallyHidden.Root>
                <SheetTitle>Навигация</SheetTitle>
              </VisuallyHidden.Root>
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <LogoIcon className="h-5 w-5 text-brand-orange" />
                <span className="font-semibold text-text-primary">MSERVICE</span>
                {user?.role && (
                  <span className="ml-auto rounded bg-brand-orange/10 px-1.5 py-0.5 text-xs font-medium text-brand-orange">
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
              </div>
              <nav className="space-y-1 p-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-surface-muted text-text-primary"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </nav>
    </>
  );
}
