"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type Props = {
  requestNewLinkHref?: string;
};

export function ExpiredResetLinkUI({ requestNewLinkHref = "/auth/reset-password" }: Props) {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-[18px] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-6 transition-colors theme-shadow">
          <h2 className="text-base font-bold text-[var(--danger)]">
            {t(language, "auth.resetPasswordConfirm.errorExpiredTitle")}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t(language, "auth.resetPasswordConfirm.errorExpiredExplanation")}
          </p>
          <ul className="mt-3 space-y-1.5 pl-4 text-xs text-[var(--text-secondary)]">
            <li className="list-disc">{t(language, "auth.resetPasswordConfirm.errorExpiredTip1")}</li>
            <li className="list-disc">{t(language, "auth.resetPasswordConfirm.errorExpiredTip2")}</li>
            <li className="list-disc">{t(language, "auth.resetPasswordConfirm.errorExpiredTip3")}</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href={requestNewLinkHref}>
            <Button className="w-full">{t(language, "auth.resetPasswordConfirm.requestNewLink")}</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              {t(language, "auth.resetPasswordConfirm.backToLogin")}
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {t(language, "auth.resetPasswordConfirm.openLinkManuallyTitle")}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {t(language, "auth.resetPasswordConfirm.openLinkManuallyInstructions")}
          </p>
        </div>
      </div>
    </div>
  );
}
