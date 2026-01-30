"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type FormPageLayoutProps = {
  backHref: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  children: ReactNode;
  primaryAction: ReactNode;
};

export function FormPageLayout({
  backHref,
  title,
  subtitle,
  loading = false,
  children,
  primaryAction,
}: FormPageLayoutProps) {
  const { language } = useLanguage();

  return (
    <div className="page-slide-in">
      <div className="mb-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span>←</span> {t(language, "common.back")}
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {loading ? t(language, "common.loading") : subtitle}
        </p>
      </div>

      <div className="space-y-6 pb-4">{children}</div>

      <div 
        className="form-sticky-actions sticky z-30 mt-8 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md pt-4"
        data-form-sticky-actions="1"
        style={{ 
          bottom: 'var(--bottom-nav-safe-spacing)',
          paddingBottom: 'calc(1rem + var(--safe-area-bottom))'
        }}
      >
        <div className="mx-auto max-w-6xl px-4">
          {primaryAction}
        </div>
      </div>
    </div>
  );
}
