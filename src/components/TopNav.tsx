import Link from "next/link";
import { PartnerBadges } from "./PartnerBadges";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

export function TopNav() {
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-md transition-colors bg-[var(--surface)]/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/account"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            aria-label={t(language, "nav.openAccount")}
          >
            IL
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard" className="text-sm font-black tracking-tight text-[var(--text-primary)]">
              TaxApp
            </Link>

            <span className="inline-flex items-center rounded-full bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] border border-[var(--border)]">
              {t(language, "common.sarawakOnly")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="hidden text-xs font-medium text-[var(--text-secondary)] sm:inline">
            {t(language, "common.partners")}
          </span>
          <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
          <PartnerBadges />
        </div>
      </div>
    </header>
  );
}
