"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(t(language, "auth.login.unexpectedError"));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        {/* Logos + Title */}
        <div className="text-center">

          {/* Logos */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <Image
              src="/tajau-logo.png"
              alt="Tajau Logo"
              width={110}
              height={55}
              priority
            />

            <Image
              src="/swinburne-logo.jpg"
              alt="Swinburne Logo"
              width={110}
              height={55}
              priority
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "auth.login.title")}
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t(language, "auth.login.subtitle")}
          </p>

        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors theme-shadow">
            <div className="space-y-4">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
                >
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

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {t(language, "common.password")}
                </label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />

                <p className="mt-2">
                  <Link
                    href={
                      email.trim()
                        ? `/auth/reset-password?email=${encodeURIComponent(email.trim())}`
                        : "/auth/reset-password"
                    }
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    {t(language, "auth.login.forgotPassword")}
                  </Link>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3">
                  <p className="text-sm font-semibold text-[var(--danger)]">
                    {error}
                  </p>
                </div>
              )}

              {/* Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t(language, "auth.login.signingIn")
                  : t(language, "auth.login.signIn")}
              </Button>

            </div>
          </div>
        </form>

        {/* Sign Up */}
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {t(language, "auth.login.noAccount")}{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              {t(language, "auth.login.signUp")}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}