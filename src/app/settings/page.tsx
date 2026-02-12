"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

export default function SettingsPage() {
  const { language } = useLanguage();

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-elevated)]"
          aria-label={t(language, "account.backToDashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "settings.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t(language, "settings.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-6 py-12 text-center transition-colors theme-shadow">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <SlidersHorizontal className="h-6 w-6" />
        </div>
        <h2 className="text-base font-extrabold text-[var(--text-primary)]">
          {t(language, "settings.prototypeOnlyTitle")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          {t(language, "settings.prototypeOnlyBody")}
        </p>
      </div>
    </AppShell>
  );
}





