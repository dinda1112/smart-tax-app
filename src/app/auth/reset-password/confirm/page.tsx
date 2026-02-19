"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy redirect: /auth/reset-password/confirm -> /auth/callback?next=/reset-password
 * Preserves query and hash for old email links so callback can process them.
 */
export default function ResetPasswordConfirmRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const params = new URLSearchParams(search);
    params.set("next", "/reset-password");
    const base = `/auth/callback?${params.toString()}`;
    router.replace(`${base}${hash}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <p className="text-sm text-[var(--text-secondary)]">Redirecting...</p>
    </div>
  );
}
