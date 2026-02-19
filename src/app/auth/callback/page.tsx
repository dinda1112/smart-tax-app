"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

function hasRecoveryHash(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  return hash.includes("type=recovery") || (hash.includes("access_token") && hash.includes("refresh_token"));
}

const POLL_MS = 200;
const POLL_MAX_MS = 4000;

/** Poll getSession until session exists or timeout */
async function waitForSession(supabase: ReturnType<typeof import("@/lib/supabase/browser").createClient>): Promise<boolean> {
  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return true;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return false;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const errParam = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const rawNext = searchParams.get("next") ?? "/reset-password";
    const target = rawNext.startsWith("/") ? rawNext : `/${rawNext}`;

    const supabase = createClient();

    const done = () => {
      router.replace(target);
    };

    const fail = () => {
      setError(true);
    };

    // a) URL has error params -> show error, don't call Supabase
    if (errParam || errorCode) {
      fail();
      return;
    }

    // b) PKCE: ?code=xxx
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ error: err }) => {
        if (err) {
          console.warn("auth/callback: exchangeCodeForSession error", err.message);
          fail();
          return;
        }
        const hasSession = await waitForSession(supabase);
        if (hasSession) done();
        else fail();
      });
      return;
    }

    // 2. Implicit: hash with recovery tokens (Supabase auto-processes on load)
    if (hasRecoveryHash()) {
      waitForSession(supabase).then((hasSession) => {
        if (hasSession) done();
        else fail();
      });
      return;
    }

    // 3. Maybe session from prior callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) done();
      else fail();
    });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm font-semibold text-[var(--danger)]">
            {t(language, "auth.resetPasswordConfirm.errorInvalidExpired")}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/reset-password">
              <Button className="w-full">{t(language, "auth.resetPasswordConfirm.requestNewLink")}</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">{t(language, "auth.resetPasswordConfirm.backToLogin")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <p className="text-sm text-[var(--text-secondary)]">Redirecting...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
