"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, isLoggedIn } from "@/lib/auth";

// Itinataboy sa /login ang user kapag walang valid token.
export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) {
      clearTokens();
      router.replace("/login");
    }
  }, [router]);
}