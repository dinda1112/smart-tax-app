"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FormPageLayout } from "@/components/FormPageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import Link from "next/link";
import type { CompanySize, ProfileFormData } from "@/lib/types";
import { PROFILE_DEFAULTS } from "@/lib/profile-defaults";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type SizeOption = {
  value: CompanySize;
  labelKey: string;
  employeesKey: string;
};

const SIZE_OPTIONS: SizeOption[] = [
  { value: "micro", labelKey: "setupBusiness.companySize.micro", employeesKey: "setupBusiness.companySize.microEmployees" },
  { value: "small", labelKey: "setupBusiness.companySize.small", employeesKey: "setupBusiness.companySize.smallEmployees" },
  { value: "small_500", labelKey: "setupBusiness.companySize.small_500", employeesKey: "setupBusiness.companySize.small_500Employees" },
  { value: "medium", labelKey: "setupBusiness.companySize.medium", employeesKey: "setupBusiness.companySize.mediumEmployees" },
];

function getCompanySizeLabel(size: string, lang: string): string {
  const l = (lang === "ms" ? "ms" : "en") as "en" | "ms";
  const labels: Record<string, string> = {
    micro: t(l, "setupBusiness.companySize.micro"),
    small: t(l, "setupBusiness.companySize.small"),
    small_500: t(l, "setupBusiness.companySize.small_500"),
    medium: t(l, "setupBusiness.companySize.medium"),
  };
  return labels[size] || size;
}

function getCompanySizeEmployees(size: string, lang: string): string {
  const l = (lang === "ms" ? "ms" : "en") as "en" | "ms";
  const labels: Record<string, string> = {
    micro: t(l, "setupBusiness.companySize.microEmployees"),
    small: t(l, "setupBusiness.companySize.smallEmployees"),
    small_500: t(l, "setupBusiness.companySize.small_500Employees"),
    medium: t(l, "setupBusiness.companySize.mediumEmployees"),
  };
  return labels[size] || "";
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [canSave, setCanSave] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: PROFILE_DEFAULTS,
    mode: "onBlur",
  });

  const values = watch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) {
          reset(data);
          const isFilled = !!data.fullName?.trim() && data.companySize !== "";
          setHasSavedProfile(isFilled);
          setIsEditing(!isFilled);
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  useEffect(() => {
    const ok =
      values.fullName.trim().length > 0 &&
      values.companySize !== "";
    setCanSave(ok);
  }, [values]);

  async function handleSave() {
    if (!canSave) return;
    try {
      const v = getValues();
      await saveProfile(v);
      toast.success(t(language, "toast.saved"));
      setHasSavedProfile(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(t(language, "toast.failedToSaveTryAgain"));
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="page-slide-in">
          <div className="mb-4">
            <Link
              href="/setup"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>←</span> {t(language, "common.back")}
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupBusiness.title")}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "common.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // View mode — show saved details as a simple page
  if (!isEditing && hasSavedProfile) {
    return (
      <AppShell>
        <div className="page-slide-in">
          <div className="mb-6">
            <Link
              href="/setup"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>←</span> {t(language, "common.back")}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupBusiness.title")}</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "setupBusiness.subtitle")}</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t(language, "setup.edit")}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-[var(--border)]/50 pb-4">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "common.name")}</div>
              <div className="text-base font-extrabold text-[var(--text-primary)]">{values.fullName}</div>
            </div>

            {values.companyName?.trim() && (
              <div className="border-b border-[var(--border)]/50 pb-4">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "setupBusiness.companyNameLabel")}</div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">{values.companyName}</div>
              </div>
            )}

            <div className="pb-4">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "setupBusiness.companySizeLabel")}</div>
              <div className="text-base font-extrabold text-[var(--text-primary)]">
                {getCompanySizeLabel(values.companySize, language)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {getCompanySizeEmployees(values.companySize, language)}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/setup">
              <Button className="w-full">
                {t(language, "common.continueArrow")}
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Edit mode — show form
  return (
    <AppShell>
      <FormPageLayout
        backHref="/setup"
        title={t(language, "setupBusiness.title")}
        subtitle={t(language, "setupBusiness.subtitle")}
        loading={loading}
        primaryAction={
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || loading}
            className="w-full"
          >
            {t(language, "common.saveAndContinue")}
          </Button>
        }
      >
        <div data-field="fullName">
          <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "common.name")}</label>
          <Input
            {...register("fullName")}
            placeholder={t(language, "setupBusiness.namePlaceholder")}
            className={errors.fullName ? "border-[var(--danger)]" : ""}
            disabled={loading}
          />
        </div>

        <div data-field="companyName">
          <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
            {t(language, "setupBusiness.companyNameLabel")}
            <span className="ml-1 font-normal text-[var(--text-tertiary)]">({t(language, "common.optional")})</span>
          </label>
          <Input
            {...register("companyName")}
            placeholder={t(language, "setupBusiness.companyNamePlaceholder")}
            disabled={loading}
          />
        </div>

        <div data-field="companySize">
          <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
            {t(language, "setupBusiness.companySizeLabel")}
          </label>
          <div className="space-y-2">
            {SIZE_OPTIONS.map((option) => {
              const isSelected = values.companySize === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setValue("companySize", option.value, { shouldDirty: true })
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)]"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {t(language, option.labelKey)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {t(language, option.employeesKey)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </FormPageLayout>
    </AppShell>
  );
}