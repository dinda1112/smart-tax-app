"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

function maskEmail(email: string): string {
  if (!email || email.length === 0) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Forgot password request page (logged out).
 * redirectTo = /auth/callback?next=/reset-password.
 */
const THROTTLE_SECONDS = 30;
const SESSION_KEY = "forgot_password_cooldown_until";

function getCooldownRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const until = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
    const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    return remaining;
  } catch {
    return 0;
  }
}

function ForgotPasswordContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Prefill email from querystring (e.g. from login "Forgot password?")
  useEffect(() => {
    const q = searchParams.get("email");
    if (q && typeof q === "string") setEmail(decodeURIComponent(q));
  }, [searchParams]);

  // Restore cooldown from sessionStorage on mount
  useEffect(() => {
    setResendSeconds(getCooldownRemaining());
  }, []);

  // Throttle countdown (persisted in sessionStorage)
  useEffect(() => {
    if (resendSeconds <= 0) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
      return;
    }
    const t = setInterval(() => {
      const rem = getCooldownRemaining();
      setResendSeconds(rem);
    }, 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t(language, "auth.resetPassword.errors.emailRequired"));
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
      if (error) {
        setError(error.message.includes("rate") ? error.message : t(language, "auth.resetPassword.errors.unexpectedError"));
        setLoading(false);
        return;
      }
      setSuccess(true);
      const until = Date.now() + THROTTLE_SECONDS * 1000;
      try {
        sessionStorage.setItem(SESSION_KEY, String(until));
      } catch {}
      setResendSeconds(THROTTLE_SECONDS);
    } catch {
      setError(t(language, "auth.resetPassword.errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "auth.resetPassword.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t(language, "auth.resetPassword.subtitle")}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(language, "auth.resetPassword.helper")}
          </p>
        </div>

        {success ? (
          <div className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6 transition-colors theme-shadow">
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t(language, "auth.resetPassword.success.title")}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {t(language, "auth.resetPassword.success.message")}
              </p>
              <Link href="/auth/login">
                <Button className="w-full">{t(language, "auth.resetPassword.backToLogin")}</Button>
              </Link>
              <Link href="/auth/reset-password" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                {t(language, "auth.resetPassword.success.didntReceiveSendAgain")}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors theme-shadow">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "common.email")}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t(language, "auth.emailPlaceholder")}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                  {email.trim() && (
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {t(language, "auth.resetPassword.emailHint", { email: maskEmail(email.trim()) })}
                    </p>
                  )}
                </div>
                {error && (
                  <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                    <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || resendSeconds > 0}>
                  {loading
                    ? t(language, "auth.resetPassword.sending")
                    : resendSeconds > 0
                      ? t(language, "auth.resetPassword.resendIn", { seconds: String(resendSeconds) })
                      : t(language, "auth.resetPassword.sendResetLink")}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link href="/auth/login" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            {t(language, "auth.resetPassword.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
