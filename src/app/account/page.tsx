"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FontSizeSwitcher } from "@/components/FontSizeSwitcher";
import Link from "next/link";
import { ArrowLeft, Shield, Palette, HelpCircle, UserRound, Globe2, Lock, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/browser";
import { Select } from "@/components/ui/select";
import { t } from "@/lib/ui-text/t";

export default function AccountPage() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();

  function handleLanguageChange(newLang: string) {
    // Only allow "en" and "ms"
    if (newLang === "en" || newLang === "ms") {
      setLanguage(newLang);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:bg-[var(--surface-elevated)] active:scale-[0.95]"
          aria-label={t(language, "account.backToDashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "account.title")}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors theme-shadow">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.profile.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.profile.description")}</p>

          <div className="mt-3 divide-y divide-[var(--border)]">
            <Link
              href="/setup"
              className="flex items-center justify-between gap-3 px-1 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-xl transition-all duration-200 active:scale-[0.98] active:bg-[var(--surface-elevated)]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  <UserRound className="h-4 w-4" />
                </span>
                <span>{t(language, "account.profile.setup")}</span>
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">›</span>
            </Link>
          </div>
        </section>

        <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors theme-shadow">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.settings.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.settings.description")}</p>

          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "account.settings.language")}</label>
              <Select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="en">{t(language, "account.settings.languageOptions.en")}</option>
                <option value="ms">{t(language, "account.settings.languageOptions.ms")}</option>
                <option value="iban" disabled>{t(language, "account.settings.languageOptions.iban")}</option>
                <option value="zh" disabled>{t(language, "account.settings.languageOptions.zh")}</option>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "account.settings.theme")}</label>
              <ThemeSwitcher />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "account.settings.fontSize")}</label>
              <FontSizeSwitcher />
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors theme-shadow">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.support.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.support.description")}</p>

          <div className="mt-3 divide-y divide-[var(--border)]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-xl transition-all duration-200 active:scale-[0.98] active:bg-[var(--surface-elevated)]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                  <HelpCircle className="h-4 w-4" />
                </span>
                <span>{t(language, "account.support.help")}</span>
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{t(language, "account.support.soon")}</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-xl transition-all duration-200 active:scale-[0.98] active:bg-[var(--surface-elevated)]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                  <Shield className="h-4 w-4" />
                </span>
                <span>{t(language, "account.support.security")}</span>
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                <Lock className="mr-1 inline h-3 w-3" />
                {t(language, "account.support.placeholder")}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left text-sm font-medium text-[var(--danger)] hover:bg-[var(--surface-elevated)] rounded-xl transition-all duration-200 active:scale-[0.98] active:bg-[var(--surface-elevated)]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                  <LogOut className="h-4 w-4" />
                </span>
                <span>{t(language, "account.support.signOut")}</span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}


