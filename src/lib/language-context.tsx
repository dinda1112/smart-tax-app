"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LanguageCode } from "./types";
import { loadProfile, saveProfile } from "./profile-storage";

const STORAGE_KEY = "taxapp_language";

const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/callback", "/auth/reset-password", "/reset-password", "/forgot-password"];

// Only allow "en" and "ms" for now
type WorkingLanguage = "en" | "ms";

type LanguageContextType = {
  language: WorkingLanguage;
  setLanguage: (lang: WorkingLanguage) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<WorkingLanguage>("en");
  const [mounted, setMounted] = useState(false);

  const isPublicAuthRoute = pathname && PUBLIC_AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // Load language: skip profile (getUser) on public auth routes to avoid AuthSessionMissingError
  useEffect(() => {
    async function loadInitialLanguage() {
      if (!isPublicAuthRoute) {
        try {
          const { data } = await loadProfile();
          if (data?.language && (data.language === "en" || data.language === "ms")) {
            setLanguageState(data.language);
            return;
          }
        } catch (error) {
          console.error("Failed to load profile for language:", error);
        }
      }
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as WorkingLanguage | null;
        if (stored && (stored === "en" || stored === "ms")) {
          setLanguageState(stored);
        }
      } catch (error) {
        console.error("Failed to load language from localStorage:", error);
      }
    }

    loadInitialLanguage();
    setMounted(true);
  }, [isPublicAuthRoute]);

  const setLanguage = async (newLang: WorkingLanguage) => {
    // Update state immediately for instant UI update
    setLanguageState(newLang);
    
    // Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (error) {
      console.error("Failed to save language to localStorage:", error);
    }

    // Save to profile asynchronously (skip on public auth routes)
    if (isPublicAuthRoute) return;
    try {
      const { data } = await loadProfile();
      if (data) {
        await saveProfile({ ...data, language: newLang });
      }
    } catch (error) {
      console.error("Failed to save language to profile:", error);
      // Don't throw - localStorage is already saved, so it's fine
    }
  };

  // Always provide the context, even before mounted, to prevent errors
  // The language state will update once mounted and profile is loaded
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
