"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FormPageLayout } from "@/components/FormPageLayout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CompanySize, ProfileFormData } from "@/lib/types";
import { PROFILE_DEFAULTS } from "@/lib/profile-defaults";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

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

        <div data-field="companySize">
          <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
            {t(language, "setupBusiness.companySizeLabel")}
          </label>
          <Select
            value={values.companySize}
            onChange={(e) =>
              setValue("companySize", e.target.value as CompanySize | "", { shouldDirty: true })
            }
            disabled={loading}
            className={errors.companySize ? "border-[var(--danger)]" : ""}
          >
            <option value="">{t(language, "setupBusiness.companySizePlaceholder")}</option>
            <option value="micro">{t(language, "setupBusiness.companySize.micro")}</option>
            <option value="small">{t(language, "setupBusiness.companySize.small")}</option>
            <option value="medium">{t(language, "setupBusiness.companySize.medium")}</option>
          </Select>
        </div>
      </FormPageLayout>
    </AppShell>
  );
}





