import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  BarChart3,
  Zap,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/listening", label: "Listening", icon: Headphones },
    { href: "/reading", label: "Reading", icon: BookOpen },
    { href: "/writing", label: "Writing", icon: PenTool },
    { href: "/speaking", label: "Speaking", icon: Mic },
    { href: "/exam", label: "Mock Exam", icon: GraduationCap },
    { href: "/mistakes", label: "Mistakes", icon: AlertTriangle },
    { href: "/progress", label: "Progress", icon: BarChart3 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b h-14 flex items-center px-4">
        <button
          className="md:hidden mr-3"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold" data-testid="text-app-brand">BandBoost AI</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block" data-testid="text-user-name">
              {(user as any).displayName || (user as any).username}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-14 left-0 bottom-0 w-64 bg-sidebar border-r z-40 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="pt-14 md:pl-64">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t md:hidden z-30">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 6).map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`tab-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
