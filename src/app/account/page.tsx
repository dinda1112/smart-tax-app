"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FontSizeSwitcher } from "@/components/FontSizeSwitcher";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Shield, HelpCircle, UserRound, Lock, LogOut, Mail } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/browser";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/ui-text/t";

export default function AccountPage() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordUpdating, setChangePasswordUpdating] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangePasswordError(null);

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setChangePasswordError(t(language, "account.changePassword.errors.newPasswordRequired"));
      return;
    }

    if (trimmedNew.length < 6) {
      setChangePasswordError(t(language, "account.changePassword.errors.passwordTooShort"));
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setChangePasswordError(t(language, "account.changePassword.errors.passwordsDoNotMatch"));
      return;
    }

    setChangePasswordUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: trimmedNew });

      if (error) {
        setChangePasswordError(error.message);
        setChangePasswordUpdating(false);
        return;
      }

      toast.success(t(language, "account.changePassword.success"));
      setNewPassword("");
      setConfirmPassword("");
      setChangePasswordError(null);
      setTimeout(() => setPasswordExpanded(false), 1000);
    } catch {
      setChangePasswordError(t(language, "account.changePassword.errors.unexpectedError"));
    } finally {
      setChangePasswordUpdating(false);
    }
  }

  async function handleSendResetEmail() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email?.trim();

    if (!email) {
      toast.error(t(language, "auth.resetPassword.errors.unexpectedError"));
      return;
    }

    setResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t(language, "account.password.success"));
    } catch {
      toast.error(t(language, "auth.resetPassword.errors.unexpectedError"));
    } finally {
      setResetSending(false);
    }
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
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Lock className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.password.title")}</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.password.description")}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t(language, "account.password.helper")}</p>

          {!passwordExpanded ? (
            <div className="mt-3 space-y-3">
              <Button
                type="button"
                onClick={() => {
                  setPasswordExpanded(true);
                  setChangePasswordError(null);
                }}
                className="w-full sm:w-auto"
              >
                {t(language, "account.password.changePasswordCta")}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={resetSending}
                  className="text-[var(--accent)] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 rounded"
                >
                  {resetSending ? t(language, "account.password.sending") : t(language, "account.password.sendResetInstead")}
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
              <div>
                <label htmlFor="new-password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t(language, "account.changePassword.newPasswordLabel")}
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={changePasswordUpdating}
                  className="focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                />
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  {t(language, "account.changePassword.passwordHint")}
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t(language, "account.changePassword.confirmPasswordLabel")}
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={changePasswordUpdating}
                  className="focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                />
              </div>

              {changePasswordError && (
                <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                  <p className="text-sm font-semibold text-[var(--danger)]">{changePasswordError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button type="submit" disabled={changePasswordUpdating} className="w-full sm:w-auto">
                  {changePasswordUpdating ? t(language, "account.changePassword.updating") : t(language, "account.changePassword.submit")}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordExpanded(false);
                    setChangePasswordError(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] sm:ml-2"
                >
                  {t(language, "account.password.cancel")}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="glass-support-card rounded-[18px] p-4 transition-colors">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.support.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "account.support.description")}</p>

          <div className="mt-3 divide-y divide-[var(--border)]/50">
            <div className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left text-sm font-medium text-[var(--text-primary)]">
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-elevated)]/80 text-[var(--text-secondary)]">
                  <HelpCircle className="h-4 w-4" />
                </span>
                <span>{t(language, "account.support.help")}</span>
              </span>
              <a
                href="https://wa.me/60123709534"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#20BD5A] active:scale-[0.98]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t(language, "account.support.whatsAppCta")}
              </a>
            </div>

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


