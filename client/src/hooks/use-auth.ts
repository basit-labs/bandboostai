import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, navigate] = useLocation();
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const hasPremiumAccess = () => {
    if (!user) return false;
    const u = user as any;
    if (u.role === "owner") return true;
    if (u.role === "admin") return true;
    if (u.premiumOverride) return true;
    if (u.subscriptionStatus === "active") return true;
    return false;
  };

  const isAdmin = () => {
    if (!user) return false;
    const u = user as any;
    return u.role === "owner" || u.role === "admin";
  };

  return { user, isLoading, hasPremiumAccess: hasPremiumAccess(), isAdmin: isAdmin() };
}
