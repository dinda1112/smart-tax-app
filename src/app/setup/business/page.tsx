"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FormPageLayout } from "@/components/FormPageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
  { value: "medium", labelKey: "setupBusiness.companySize.medium", employeesKey: "setupBusiness.companySize.mediumEmployees" },
];

export default function BusinessDetailsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [canSave, setCanSave] = useState(false);

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
        if (data) reset(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
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
      router.push("/setup");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(t(language, "toast.failedToSaveTryAgain"));
    }
  }

  return (
    <AppShell>
      <FormPageLayout
        backHref="/setup"
        title={t(language, "setupBusiness.title")}
        subtitle={loading ? t(language, "common.loading") : t(language, "setupBusiness.subtitle")}
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