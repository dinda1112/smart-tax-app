"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

const MIN_PASSWORD_LENGTH = 8;

type Status = "loading" | "valid" | "error" | "success";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailFromQuery = searchParams.get("email") ? `?email=${encodeURIComponent(searchParams.get("email")!)}` : "";
  const requestNewLinkHref = `/auth/reset-password${emailFromQuery}`;

  const handleRecovery = useCallback(() => {
    setStatus("valid");
  }, []);

  const showExpiredUI = useCallback(() => {
    setStatus("error");
    setErrorMessage(t(language, "auth.resetPasswordConfirm.errorInvalidExpired"));
  }, [language]);

  useEffect(() => {
    // If URL has error params (e.g. Supabase redirect with otp_expired), show expired UI immediately
    const errParam = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    if (errParam || errorCode) {
      showExpiredUI();
      return;
    }

    const supabase = createClient();
    // Users arrive via /auth/callback with session. Use getSession only (no getUser).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleRecovery();
      else showExpiredUI();
    });
  }, [language, handleRecovery, searchParams, showExpiredUI]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(t(language, "auth.resetPasswordConfirm.errors.passwordTooShort"));
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setSubmitError(t(language, "auth.resetPasswordConfirm.errors.passwordsDoNotMatch"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: trimmedNew });

      if (error) {
        setSubmitError(error.message);
        setSubmitting(false);
        return;
      }

      setStatus("success");
      setSubmitting(false);

      await supabase.auth.signOut();
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setSubmitError(t(language, "auth.resetPasswordConfirm.errors.unexpectedError"));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "auth.resetPasswordConfirm.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t(language, "auth.resetPasswordConfirm.subtitle")}
          </p>
        </div>

        {status === "loading" && (
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition-colors theme-shadow">
            <p className="text-sm text-[var(--text-secondary)]">
              {t(language, "auth.resetPasswordConfirm.loading")}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-6 transition-colors theme-shadow">
              <p className="text-sm font-semibold text-[var(--danger)]">{errorMessage}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={requestNewLinkHref}>
                <Button className="w-full">{t(language, "auth.resetPasswordConfirm.requestNewLink")}</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  {t(language, "auth.resetPasswordConfirm.backToLogin")}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "valid" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors theme-shadow">
              <div className="space-y-4">
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
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {t(language, "account.changePassword.passwordHint")}
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
                    required
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                    <p className="text-sm font-semibold text-[var(--danger)]">{submitError}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting
                    ? t(language, "auth.resetPasswordConfirm.updating")
                    : t(language, "auth.resetPasswordConfirm.submit")}
                </Button>
              </div>
            </div>
          </form>
        )}

        {status === "success" && (
          <div className="rounded-[18px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6 transition-colors theme-shadow">
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t(language, "auth.resetPasswordConfirm.successTitle")}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {t(language, "auth.resetPasswordConfirm.successMessage")}
              </p>
              <Link href="/auth/login">
                <Button className="w-full">{t(language, "auth.resetPasswordConfirm.backToLogin")}</Button>
              </Link>
            </div>
          </div>
        )}

        {(status === "valid" || status === "loading") && (
          <div className="text-center">
            <Link href="/auth/login" className="text-sm font-semibold text-[var(--accent)] hover:underline">
              {t(language, "auth.resetPasswordConfirm.backToLogin")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
