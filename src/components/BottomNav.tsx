"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, UserRound, Settings } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/account", labelKey: "nav.account", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <div
      className="bottom-nav pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "calc(1rem + var(--safe-area-bottom))" }}
    >
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-3xl border border-[var(--border)]/70 p-2 text-xs font-medium text-[var(--text-secondary)] shadow-lg backdrop-blur-md transition-colors bg-[var(--surface)]/80"
      >
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-colors"
            >
              <motion.span
                layoutId={`nav-indicator-${item.href}`}
                className={`absolute bottom-0 h-1 w-6 rounded-full ${
                  isActive ? "bg-[var(--accent)]" : "bg-transparent"
                }`}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              />
              <motion.span
                whileTap={{ scale: 0.9 }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] group-hover:bg-[var(--surface-elevated)]/80"
                }`}
              >
                <Icon className="h-4 w-4" />
              </motion.span>
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                }`}
              >
                {t(language, item.labelKey)}
              </span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}


