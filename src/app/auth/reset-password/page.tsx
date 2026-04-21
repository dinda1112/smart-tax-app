"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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

const COOLDOWN_SECONDS = 30;
const SESSION_KEY = "forgot_password_cooldown_until";
const MIN_PASSWORD_LENGTH = 6;
const OTP_LENGTH = 6;

function getCooldownRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const until = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function isNumericCode(value: string): boolean {
  return value.length === OTP_LENGTH && /^\d+$/.test(value);
}

type Step = "request" | "enter_code" | "success";

function ForgotPasswordContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Prefill email from querystring (e.g. from login "Forgot password?")
  useEffect(() => {
    const q = searchParams.get("email");
    if (q && typeof q === "string") setEmail(decodeURIComponent(q));
  }, [searchParams]);

  useEffect(() => {
    setResendSeconds(getCooldownRemaining());
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
      return;
    }
    const interval = setInterval(() => {
      setResendSeconds(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [resendSeconds]);

  const startCooldown = useCallback(() => {
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    try {
      sessionStorage.setItem(SESSION_KEY, String(until));
    } catch {}
    setResendSeconds(COOLDOWN_SECONDS);
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setSendError(t(language, "auth.resetPassword.errors.emailRequired"));
      return;
    }
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) {
        setSendError(
          error.message.toLowerCase().includes("rate")
            ? error.message
            : t(language, "auth.resetPassword.errors.unexpectedError")
        );
        setSending(false);
        return;
      }
      setStep("enter_code");
      startCooldown();
    } catch {
      setSendError(t(language, "auth.resetPassword.errors.networkError"));
    } finally {
      setSending(false);
    }
  }

  async function handleResendCode() {
    setSendError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) {
        setSendError(
          error.message.toLowerCase().includes("rate")
            ? error.message
            : t(language, "auth.resetPassword.errors.unexpectedError")
        );
        setSending(false);
        return;
      }
      startCooldown();
    } catch {
      setSendError(t(language, "auth.resetPassword.errors.networkError"));
    } finally {
      setSending(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    const trimmedEmail = email.trim();
    const token = code;
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail) {
      setResetError(t(language, "auth.resetPassword.errors.emailRequired"));
      return;
    }
    if (token.length !== OTP_LENGTH) {
      setResetError(
        token.length === 0
          ? t(language, "auth.resetPassword.errors.codeRequired")
          : t(language, "auth.resetPassword.errors.codeMustBe6Digits")
      );
      return;
    }
    if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
      setResetError(t(language, "auth.resetPassword.errors.passwordTooShort"));
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setResetError(t(language, "auth.resetPassword.errors.passwordsDoNotMatch"));
      return;
    }

    setResetting(true);
    try {
      const supabase = createClient();
      if (process.env.NODE_ENV !== "production") {
        console.debug("[reset-otp] token:", JSON.stringify(token), "len:", token.length);
      }
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: "email",
      });
      if (verifyError) {
        setResetError(t(language, "auth.resetPassword.invalidOrExpiredCode"));
        setResetting(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setResetError(t(language, "auth.resetPassword.sessionMissingAfterVerify"));
        setResetting(false);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: trimmedNew,
      });
      if (updateError) {
        setResetError(
          updateError.message && !updateError.message.includes("AuthSessionMissingError")
            ? updateError.message
            : t(language, "auth.resetPassword.couldntUpdatePassword")
        );
        setResetting(false);
        return;
      }
      await supabase.auth.signOut();
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setResetError(
        msg.includes("Auth session missing")
          ? t(language, "auth.resetPassword.sessionMissingAfterVerify")
          : t(language, "auth.resetPassword.couldntUpdatePassword")
      );
    } finally {
      setResetting(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {t(language, "auth.resetPassword.successTitle")}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {t(language, "auth.resetPassword.successMessage")}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6 transition-colors theme-shadow">
            <Link href="/auth/login">
              <Button className="w-full">{t(language, "auth.resetPassword.backToLogin")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "enter_code") {
    const resendLabel =
      resendSeconds > 0
        ? t(language, "auth.resetPassword.resendIn", {
            seconds: `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")}`,
          })
        : t(language, "auth.resetPassword.resendCode");

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {t(language, "auth.resetPassword.stepBTitle")}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {t(language, "auth.resetPassword.codeSentMessage")}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t(language, "auth.resetPassword.useLatestCodeHint")}
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors theme-shadow">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-stepb" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "common.email")}
                  </label>
                  <Input
                    id="email-stepb"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t(language, "auth.emailPlaceholder")}
                    autoComplete="email"
                    disabled={resetting}
                  />
                </div>
                <div>
                  <label htmlFor="code" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "auth.resetPassword.codeLabel")}
                  </label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    value={code}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
                      setCode(next);
                    }}
                    placeholder={t(language, "auth.resetPassword.codePlaceholder")}
                    disabled={resetting}
                    className="font-mono text-lg tracking-widest"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {t(language, "auth.resetPassword.useLatestCodeHint")}
                  </p>
                </div>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "auth.resetPasswordConfirm.newPasswordLabel")}
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={resetting}
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {t(language, "auth.resetPassword.errors.passwordTooShort")}
                  </p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "auth.resetPasswordConfirm.confirmPasswordLabel")}
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={resetting}
                  />
                </div>
                {resetError && (
                  <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                    <p className="text-sm font-semibold text-[var(--danger)]">{resetError}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={resetting}>
                  {resetting
                    ? t(language, "auth.resetPassword.resetting")
                    : t(language, "auth.resetPassword.resetPasswordButton")}
                </Button>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resendSeconds > 0 || sending}
                    onClick={handleResendCode}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline disabled:opacity-50"
                  >
                    {resendLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setResetError(null);
                    }}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    {t(language, "auth.resetPassword.changeEmail")}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm font-semibold text-[var(--accent)] hover:underline">
              {t(language, "auth.resetPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step A: Request code
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

        <form onSubmit={handleSendCode} className="space-y-4">
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
                  disabled={sending}
                />
                {email.trim() && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {t(language, "auth.resetPassword.emailHint", { email: maskEmail(email.trim()) })}
                  </p>
                )}
              </div>
              {sendError && (
                <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                  <p className="text-sm font-semibold text-[var(--danger)]">{sendError}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={sending || resendSeconds > 0}>
                {sending
                  ? t(language, "auth.resetPassword.sending")
                  : resendSeconds > 0
                    ? t(language, "auth.resetPassword.resendIn", {
                        seconds: `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, "0")}`,
                      })
                    : t(language, "auth.resetPassword.sendCode")}
              </Button>
            </div>
          </div>
        </form>

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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
