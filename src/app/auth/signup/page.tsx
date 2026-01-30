"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

function isValidEmail(email: string): boolean {
  if (!email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function SignupPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validation BEFORE calling Supabase
    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage(t(language, "auth.signup.errors.invalidEmail"));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t(language, "auth.signup.errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t(language, "auth.signup.errors.passwordsDoNotMatch"));
      return;
    }

    // All validation passed, proceed with signup
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setErrorMessage(signUpError.message || "Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      // If session is null but user exists, email confirmation is usually required
      if (data.user && !data.session) {
        setSuccessMessage(t(language, "auth.signup.success.checkEmailToConfirm"));
        setLoading(false);
      } else {
        // No confirmation required (or already confirmed), redirect to sign-in
        router.push("/auth/login");
        router.refresh();
      }
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("network"))) {
        setErrorMessage(t(language, "auth.signup.errors.networkError"));
      } else {
        setErrorMessage(t(language, "auth.signup.errors.signUpFailed"));
      }
      setLoading(false);
    }
  }

  // Show password mismatch hint when user has typed in confirm password
  const showPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "auth.signup.title")}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{t(language, "auth.signup.subtitle")}</p>
        </div>

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
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t(language, "common.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{t(language, "auth.signup.passwordHint")}</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  {t(language, "auth.signup.confirmPasswordLabel")}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                {showPasswordMismatch && (
                  <p className="mt-1 text-xs text-[var(--danger)]">{t(language, "auth.signup.errors.passwordsDoNotMatchInline")}</p>
                )}
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                  <p className="text-sm font-semibold text-[var(--danger)]">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-[var(--success)] bg-[var(--success)]/10 p-3">
                  <p className="text-sm font-semibold text-[var(--success)]">{successMessage}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t(language, "auth.signup.creatingAccount") : t(language, "auth.signup.signUp")}
              </Button>
            </div>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {t(language, "auth.signup.haveAccount")}{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--accent)] hover:underline">
              {t(language, "auth.signup.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}





