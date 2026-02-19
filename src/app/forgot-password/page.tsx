"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /forgot-password -> /auth/reset-password (single forgot-password page).
 */
export default function ForgotPasswordRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/reset-password");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <p className="text-sm text-[var(--text-secondary)]">Redirecting...</p>
    </div>
  );
}
