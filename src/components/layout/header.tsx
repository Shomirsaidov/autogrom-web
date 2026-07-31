"use client";

import { useAuth } from "@/stores/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Menu } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { NotificationsBell } from "./notifications-bell";
import { useRouter } from "next/navigation";

interface Props {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-surface px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <NotificationsBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 ring-2 ring-brand-orange/15 hover:ring-brand-orange/35">
            <Avatar className="h-11 w-11">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name || "Профиль"} className="object-cover" />}
              <AvatarFallback className="bg-brand-orange text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.name || "Пользователь"}</span>
              <span className="text-xs font-normal text-text-secondary">
                {user?.email || user?.phone}
              </span>
              {user?.role && (
                <span className="mt-1 self-start rounded bg-brand-orange/10 px-1.5 py-0.5 text-xs font-medium text-brand-orange">
                  {ROLE_LABELS[user.role]}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer py-2.5">
            <User className="mr-2 h-4 w-4" />
            Профиль
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-danger">
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
