"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider, useAuth } from "@/stores/auth-context";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { ToastNotifications } from "@/components/shared/toast-notifications";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isMobile = useMobile();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col">
        <ToastNotifications />
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        <main className="flex-1 px-3 pb-20 pt-3">
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ToastNotifications />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? "ml-16" : "ml-64"}`}>
        <Header onMenuClick={() => {}} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
