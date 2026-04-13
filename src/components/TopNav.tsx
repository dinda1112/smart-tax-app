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

          <Link href="/dashboard" className="text-sm font-black tracking-tight text-[var(--text-primary)]">
            SmartTaxEd© 
          </Link>
        </div>

        <div className="flex items-center min-w-0">
          <PartnerBadges />
        </div>
      </div>
    </header>
  );
}
