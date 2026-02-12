"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

function maskEmail(email: string): string {
  if (!email || email.length === 0) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim()) {
      setError(t(language, "auth.resetPassword.errors.emailRequired"));
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(t(language, "auth.resetPassword.errors.unexpectedError"));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "auth.resetPassword.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t(language, "auth.resetPassword.subtitle")}
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
                <Button variant="outline" className="w-full">
                  {t(language, "auth.resetPassword.backToLogin")}
                </Button>
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
                      {t(language, "auth.resetPassword.emailHint", { email: maskEmail(email) })}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                    <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t(language, "auth.resetPassword.sending") : t(language, "auth.resetPassword.sendResetLink")}
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
