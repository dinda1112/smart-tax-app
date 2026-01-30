"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { completionPercent } from "@/lib/profile-defaults";
import { loadProfile } from "@/lib/profile-storage";
import type { ProfileFormData } from "@/lib/types";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

export default function DashboardHomePage() {
  const { language } = useLanguage();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) {
          setProfile(data);
          setPercent(completionPercent(data));
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "dashboard.title")}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "common.loading")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "dashboard.title")}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "dashboard.subtitle")}</p>
      </div>

      <div className="mb-6">
        <ProfileProgress percent={percent} />
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {!profile?.companySize || !profile?.msicCode
            ? t(language, "dashboard.requiredMessage")
            : t(language, "dashboard.completeMessage")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Link
          href="/setup"
          className="flex items-center justify-between rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-elevated)] theme-shadow"
        >
          <div>
            <div className="text-sm font-extrabold text-[var(--text-primary)]">{t(language, "account.profile.setup")}</div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {percent >= 100 ? t(language, "dashboard.allStepsCompleted") : t(language, "dashboard.finishToContinue")}
            </div>
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">{t(language, "common.openArrow")}</span>
        </Link>
      </div>
    </AppShell>
  );
}
