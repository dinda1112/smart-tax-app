"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FormPageLayout } from "@/components/FormPageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileFormData, SstStatus } from "@/lib/types";
import { PROFILE_DEFAULTS } from "@/lib/profile-defaults";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

export default function OptionalSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
    trigger,
    clearErrors,
    formState: { errors, touchedFields },
  } = useForm<ProfileFormData>({
    defaultValues: PROFILE_DEFAULTS,
    mode: "onBlur",
  });

  const values = watch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) {
          reset(data);
          setInitialValues(data);
        } else {
          setInitialValues(PROFILE_DEFAULTS);
        }
        setSaveAttempted(false); // Reset save attempt flag when loading
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error(t(language, "toast.failedToLoadProfile"));
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  // Check if form has changes
  const hasChanges = initialValues
    ? JSON.stringify({
        sstStatus: values.sstStatus,
        sstNumber: values.sstNumber?.trim() || "",
        sstEffectiveDate: values.sstEffectiveDate?.trim() || "",
      }) !==
      JSON.stringify({
        sstStatus: initialValues.sstStatus,
        sstNumber: initialValues.sstNumber?.trim() || "",
        sstEffectiveDate: initialValues.sstEffectiveDate?.trim() || "",
      })
    : false;

  // Check if form is valid for saving
  const isFormValid = useMemo(() => {
    if (values.sstStatus === "yes") {
      // If "yes", both number and date must be filled
      return !!(values.sstNumber?.trim() && values.sstEffectiveDate?.trim());
    }
    // If "no" or "not_sure", form is valid (no extra fields required)
    return values.sstStatus === "no" || values.sstStatus === "not_sure";
  }, [values.sstStatus, values.sstNumber, values.sstEffectiveDate]);

  // Save button should be enabled when form is valid and has changes
  const canSave = hasChanges && isFormValid && !loading && !saving;

  async function handleSave() {
    if (!canSave) return;

    try {
      setSaving(true);
      setSaveAttempted(true);
      const v = getValues();

      // Validate SST fields if status is "yes"
      if (v.sstStatus === "yes") {
        const isValid = await trigger(["sstNumber", "sstEffectiveDate"]);
        if (!isValid) {
          // Errors will be shown inline, no need for toast here
          setSaving(false);
          return;
        }
      }

      await saveProfile(v);
      setInitialValues(v);
      setSaveAttempted(false);
      toast.success(t(language, "toast.saved"));
      router.push("/setup");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(t(language, "toast.couldNotSaveTryAgain"));
    } finally {
      setSaving(false);
    }
  }

  function handleSstStatusChange(newStatus: SstStatus) {
    setValue("sstStatus", newStatus, { shouldDirty: true });
    
    // Clear SST fields and errors when switching away from "yes"
    if (newStatus !== "yes") {
      setValue("sstNumber", "", { shouldValidate: false });
      setValue("sstEffectiveDate", "", { shouldValidate: false });
      clearErrors(["sstNumber", "sstEffectiveDate"]);
    }
  }

  return (
    <AppShell>
      <FormPageLayout
        backHref="/setup"
        title={t(language, "setupOptional.title")}
        subtitle={loading ? t(language, "common.loading") : t(language, "setupOptional.subtitle")}
        loading={loading}
        primaryAction={
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full"
          >
            {saving ? t(language, "common.saving") : t(language, "common.save")}
          </Button>
        }
      >
        {/* Info Card */}
        <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                    {t(language, "setupOptional.info.whyWeAsk.title")}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t(language, "setupOptional.info.whyWeAsk.body")}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                    {t(language, "setupOptional.info.ifYouSkip.title")}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t(language, "setupOptional.info.ifYouSkip.body")}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5">
                    {t(language, "setupOptional.info.whereToFind.title")}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t(language, "setupOptional.info.whereToFind.body")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SST Status Selection */}
        <div data-field="sstStatus">
          <label className="mb-2 block text-xs font-semibold text-[var(--text-primary)]">
            {t(language, "setupOptional.question")}
          </label>
          <SegmentedControl<SstStatus>
            name="sstStatus"
            options={[
              { value: "yes", label: t(language, "common.yes") },
              { value: "no", label: t(language, "common.no") },
              { value: "not_sure", label: t(language, "common.notSure") },
            ]}
            value={values.sstStatus}
            onChange={handleSstStatusChange}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t(language, "setupOptional.notSureHint")}
          </p>
        </div>

        {/* Conditional Fields and Messages */}
        {values.sstStatus === "yes" && (
          <>
            <div data-field="sstNumber">
              <label className="mb-2 block text-xs font-semibold text-[var(--text-primary)]">
                {t(language, "setupOptional.sstNumberLabel")}
              </label>
              <Input
                {...register("sstNumber", {
                  validate: (value) => {
                    const currentStatus = getValues("sstStatus");
                    if (currentStatus !== "yes") return true;
                    return value?.trim() ? true : t(language, "setupOptional.errors.sstNumberRequired");
                  },
                })}
                placeholder={t(language, "setupOptional.sstNumberPlaceholder")}
                disabled={loading || saving}
                className={errors.sstNumber ? "border-[var(--danger)]" : ""}
              />
              {errors.sstNumber && (saveAttempted || touchedFields.sstNumber) && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.sstNumber.message}</p>
              )}
            </div>

            <div data-field="sstEffectiveDate">
              <label className="mb-2 block text-xs font-semibold text-[var(--text-primary)]">
                {t(language, "setupOptional.effectiveDateLabel")}
              </label>
              <Input
                {...register("sstEffectiveDate", {
                  validate: (value) => {
                    const currentStatus = getValues("sstStatus");
                    if (currentStatus !== "yes") return true;
                    return value?.trim() ? true : t(language, "setupOptional.errors.effectiveDateRequired");
                  },
                })}
                type="date"
                disabled={loading || saving}
                className={errors.sstEffectiveDate ? "border-[var(--danger)]" : ""}
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                {t(language, "setupOptional.effectiveDateHint")}
              </p>
              {errors.sstEffectiveDate && (saveAttempted || touchedFields.sstEffectiveDate) && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.sstEffectiveDate.message}</p>
              )}
            </div>
          </>
        )}

        {values.sstStatus === "no" && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--text-secondary)] mt-0.5" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t(language, "setupOptional.noMessage")}
              </p>
            </div>
          </div>
        )}

        {values.sstStatus === "not_sure" && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--text-secondary)] mt-0.5" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t(language, "setupOptional.notSureMessage")}
              </p>
            </div>
          </div>
        )}
      </FormPageLayout>
    </AppShell>
  );
}





