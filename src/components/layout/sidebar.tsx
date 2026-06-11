"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  Shield,
  Wrench as LogoIcon,
} from "lucide-react";
import { useState } from "react";

const navItems = [
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

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-surface transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/bookings" className="flex items-center gap-2 font-semibold text-text-primary">
            <LogoIcon className="h-5 w-5 text-brand-orange" />
            <span>MSERVICE</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/bookings">
            <LogoIcon className="h-5 w-5 text-brand-orange" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0"
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-muted text-text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
