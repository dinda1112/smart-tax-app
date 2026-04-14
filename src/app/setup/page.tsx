"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Building2, Factory, Receipt, Check, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
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

export default function HomePage() {
  const { language } = useLanguage();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Set to true by default so the dropdown is open when they enter the web
  const [isSetupExpanded, setIsSetupExpanded] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) setProfile(data);
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
    if (!v) return "incomplete";
    if (step.key === "business") {
      return (!!v.fullName.trim() && v.companySize !== "") ? "done" : "incomplete";
    }
    if (step.key === "industry") {
      return v.msicCode.trim() ? "done" : "incomplete";
    }
    return "incomplete";
  }

  function getCompletedCount(): number {
    if (!profile) return 0;
    let count = 0;
    if (!!profile.fullName.trim() && profile.companySize !== "") count++;
    if (profile.msicCode.trim()) count++;
    return count;
  }

  const completedCount = getCompletedCount();
  const requiredCount = 2;
  const completionPercentage = (completedCount / requiredCount) * 100;

  if (loading) return <AppShell><div className="p-6 text-sm">{t(language, "common.loading")}</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Quick view of your setup and next step.</p>
      </div>

      {/* Profile Completion Progress Card */}
      <div className="mb-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Profile completion</span>
          <span className="text-sm font-bold">{completionPercentage}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--surface-elevated)]">
          <div
            className="h-2 rounded-full bg-[#00D17E] transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          {completedCount >= requiredCount 
            ? "Profile complete. You can use Invoice Check." 
            : "Finish business details and industry to continue."}
        </p>
      </div>

      {/* Profile Setup Dropdown */}
      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsSetupExpanded(!isSetupExpanded)}
          className="flex w-full items-center justify-between p-6 hover:bg-[var(--surface-elevated)] transition-colors"
        >
          <div className="text-left">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Profile setup</h3>
            <p className="text-xs text-[var(--text-secondary)]">Finish business details and industry to continue.</p>
          </div>
          {isSetupExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />}
        </button>

        {isSetupExpanded && (
          <div className="px-6 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="pt-2 border-t border-[var(--border)] mb-4" />
            
            {STEPS.filter((s) => s.required).map((step) => {
              const status = stepStatus(step);
              const isDone = status === "done";
              const Icon = step.icon;

              return (
                <Link
                  key={step.key}
                  href={step.href}
                  className="flex items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-elevated)]/40 p-4 transition-all hover:bg-[var(--surface-elevated)] active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] shadow-sm">
                    <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, step.titleKey)}</h3>
                      {step.required && <Badge variant="required" size="sm">{t(language, "common.required")}</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{t(language, step.subtitleKey)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isDone ? (
                      <Badge variant="done" icon={Check}>{t(language, "common.done")}</Badge>
                    ) : (
                      <Badge variant="incomplete">{t(language, "common.incomplete")}</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                  </div>
                </Link>
              );
            })}

            {/* Optional Section */}
            <Link
              href="/setup/optional"
              className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-3 opacity-70 hover:opacity-100 transition-opacity"
            >
              <Receipt className="h-4 w-4 text-[var(--text-secondary)] ml-1" />
              <div className="flex-1 text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "setup.optionalCard.title")}
              </div>
              <Badge variant="optional" size="sm">{t(language, "common.optional")}</Badge>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}