"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FontSize = "small" | "medium" | "large" | "large-plus";

type FontSizeContextType = {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const STORAGE_KEY = "taxapp_font_size";

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [mounted, setMounted] = useState(false);

  // Load font size from localStorage on mount (before render)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as FontSize | null;
    if (stored && ["small", "medium", "large", "large-plus"].includes(stored)) {
      setFontSizeState(stored);
      applyFontSize(stored);
    } else {
      applyFontSize("medium");
    }
    setMounted(true);
  }, []);

  // Apply font size to document
  useEffect(() => {
    if (!mounted) return;
    applyFontSize(fontSize);
  }, [fontSize, mounted]);

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem(STORAGE_KEY, newSize);
    applyFontSize(newSize);
  };

  // Apply font size class to html element
  function applyFontSize(size: FontSize) {
    const root = document.documentElement;
    root.classList.remove("font-small", "font-medium", "font-large", "font-large-plus");
    root.classList.add(`font-${size}`);
  }

  // Apply default before first render to prevent flash
  if (!mounted && typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as FontSize | null;
    if (stored && ["small", "medium", "large", "large-plus"].includes(stored)) {
      applyFontSize(stored);
    } else {
      applyFontSize("medium");
    }
  }

  // Always provide the context, even before mounted, to prevent errors
  // The fontSize state will update once mounted and localStorage is loaded
  return <FontSizeContext.Provider value={{ fontSize, setFontSize }}>{children}</FontSizeContext.Provider>;
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
}
