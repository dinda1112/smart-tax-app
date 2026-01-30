"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Factory, Receipt, Check, ChevronRight } from "lucide-react";
import type { ProfileFormData } from "@/lib/types";
import { loadProfile } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type StepKey = "business" | "industry" | "optional";

type Step = {
  key: StepKey;
  titleKey: string;
  subtitleKey: string;
  required: boolean;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: Step[] = [
  {
    key: "business",
    titleKey: "setup.step.business.title",
    subtitleKey: "setup.step.business.subtitle",
    required: true,
    href: "/setup/business",
    icon: Building2,
  },
  {
    key: "industry",
    titleKey: "setup.step.industry.title",
    subtitleKey: "setup.step.industry.subtitle",
    required: true,
    href: "/setup/industry",
    icon: Factory,
  },
  {
    key: "optional",
    titleKey: "setup.step.optional.title",
    subtitleKey: "setup.step.optional.subtitle",
    required: false,
    href: "/setup/optional",
    icon: Receipt,
  },
];

export default function ProfileSetupOverviewPage() {
  const { language } = useLanguage();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function stepStatus(step: Step): "done" | "incomplete" {
    const v = profile;
    if (!v) {
      return "incomplete";
    }
    
    if (step.key === "business") {
      const ok =
        !!v.fullName.trim() &&
        v.companySize !== "";
      return ok ? "done" : "incomplete";
    }
    
    if (step.key === "industry") {
      return v.msicCode.trim() ? "done" : "incomplete";
    }
    
    return "incomplete";
  }

  function getCompletedCount(): number {
    if (!profile) return 0;
    let count = 0;
    if (
      !!profile.fullName.trim() &&
      profile.companySize !== ""
    ) {
      count++;
    }
    if (profile.msicCode.trim()) {
      count++;
    }
    return count;
  }

  const completedCount = getCompletedCount();
  const requiredCount = 2;

  if (loading) {
    return (
      <AppShell>
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setup.title")}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "common.loading")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setup.title")}</h1>
      </div>

      {/* Compact progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {completedCount} {t(language, "setup.progressOf")} {requiredCount} {t(language, "setup.progressCompleted")}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-[var(--surface-elevated)]">
          <div
            className="h-1 rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${(completedCount / requiredCount) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{t(language, "setup.completeToUnlock")}</p>
      </div>

      {/* Setup items list */}
      <div className="space-y-2">
        {STEPS.filter((step) => step.required).map((step) => {
          const status = stepStatus(step);
          const isDone = status === "done";
          const Icon = step.icon;

          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 theme-shadow transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
            >
              {/* Left: Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)]">
                <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>

              {/* Center: Title + Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, step.titleKey)}</h3>
                  {step.required && (
                    <Badge variant="required" size="sm">
                      {t(language, "common.required")}
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-[var(--text-secondary)]">{t(language, step.subtitleKey)}</p>
                  {step.key === "industry" && profile?.msicCode && (
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      • {profile.msicCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Status + Chevron */}
              <div className="flex shrink-0 items-center gap-2">
                {isDone ? (
                  <Badge variant="done" icon={Check}>
                    {t(language, "common.done")}
                  </Badge>
                ) : (
                  <Badge variant="incomplete">
                    {t(language, "common.incomplete")}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Optional SST section - collapsed by default */}
      <div className="mt-6">
        <Link
          href="/setup/optional"
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-3 transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--surface)] active:scale-[0.98]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)]">
            <Receipt className="h-4 w-4 text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)]">{t(language, "setup.optionalCard.title")}</h3>
              <Badge variant="optional" size="sm">
                {t(language, "common.optional")}
              </Badge>
            </div>
            {profile?.sstStatus === "yes" && profile?.sstNumber && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">SST-{profile.sstNumber}</p>
            )}
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        </Link>
      </div>
    </AppShell>
  );
}





