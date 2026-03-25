"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Deprecated: Password reset now uses 6-digit OTP on /auth/reset-password.
 * Redirect old link-based callback URLs so users land on the OTP flow.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const target = email
      ? `/auth/reset-password?email=${encodeURIComponent(email)}`
      : "/auth/reset-password";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <p className="text-sm text-[var(--text-secondary)]">Redirecting to reset password...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
