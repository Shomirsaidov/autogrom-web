"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Wrench,
  Users2,
  Settings,
  Gift,
  Wrench as LogoIcon,
} from "lucide-react";
import { VisuallyHidden } from "radix-ui";

const navItems = [
  { href: "/bookings", label: "Записи", icon: Calendar },
  { href: "/schedule", label: "График", icon: Clock },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/chats", label: "Чаты", icon: MessageSquare },
  { href: "/services", label: "Услуги", icon: Wrench },
  { href: "/employees", label: "Сотрудники", icon: Users2 },
  { href: "/referrals", label: "Рефералы", icon: Gift },
  { href: "/settings", label: "Настройки", icon: Settings },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: Props) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <VisuallyHidden.Root>
          <SheetTitle>Навигация</SheetTitle>
        </VisuallyHidden.Root>
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <LogoIcon className="h-5 w-5 text-brand-orange" />
          <span className="font-semibold text-text-primary">MSERVICE</span>
        </div>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
  );
}
