"use client";

import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const options: Array<{ value: "light" | "dark" | "system"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: "light", label: t(language, "theme.light"), icon: Sun },
    { value: "dark", label: t(language, "theme.dark"), icon: Moon },
    { value: "system", label: t(language, "theme.system"), icon: Monitor },
  ];

  return (
    <div className="flex gap-2 rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)]">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              isActive
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}












