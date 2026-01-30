"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LanguageCode } from "./types";
import { loadProfile, saveProfile } from "./profile-storage";

const STORAGE_KEY = "taxapp_language";

// Only allow "en" and "ms" for now
type WorkingLanguage = "en" | "ms";

type LanguageContextType = {
  language: WorkingLanguage;
  setLanguage: (lang: WorkingLanguage) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<WorkingLanguage>("en");
  const [mounted, setMounted] = useState(false);

  // Load language from profile or localStorage on mount
  useEffect(() => {
    async function loadInitialLanguage() {
      try {
        // Try to load from profile first
        const { data } = await loadProfile();
        if (data?.language && (data.language === "en" || data.language === "ms")) {
          setLanguageState(data.language);
          return;
        }
      } catch (error) {
        console.error("Failed to load profile for language:", error);
      }

      // Fallback to localStorage
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
  }, []);

  const setLanguage = async (newLang: WorkingLanguage) => {
    // Update state immediately for instant UI update
    setLanguageState(newLang);
    
    // Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (error) {
      console.error("Failed to save language to localStorage:", error);
    }

    // Save to profile asynchronously (don't block UI)
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
