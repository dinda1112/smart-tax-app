"use client";

import Link from "next/link";
import { useState } from "react";
import { PartnerBadges } from "./PartnerBadges";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { ChevronDown } from "lucide-react";

export function TopNav() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  function handleChange(lang: "en" | "ms") {
    setLanguage(lang);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-md transition-colors bg-[var(--surface)]/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 min-w-0">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/account"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            aria-label={t(language, "nav.openAccount")}
          >
            IL
          </Link>

          <Link
            href="/setup"
            className="text-sm font-black tracking-tight text-[var(--text-primary)]"
          >
            SmartTaxEd©
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 min-w-0 relative">

          <PartnerBadges />

          {/* USER GUIDE */}
          <Link
            href="https://userguidesmarttaxed.tajauberseri.com/"
            target="_blank"
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            User Guide
          </Link>

          {/* 🌐 LANGUAGE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            >
              {language === "en" ? "EN" : "BM"}
              <ChevronDown className="h-3 w-3" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-md z-50">
                <button
                  onClick={() => handleChange("en")}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-elevated)] ${
                    language === "en" ? "font-bold text-[var(--accent)]" : ""
                  }`}
                >
                  English
                </button>

                <button
                  onClick={() => handleChange("ms")}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-elevated)] ${
                    language === "ms" ? "font-bold text-[var(--accent)]" : ""
                  }`}
                >
                  Malay
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}