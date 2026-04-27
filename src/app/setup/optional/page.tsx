"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, CheckCircle2, Pencil } from "lucide-react";
import Link from "next/link";
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

function getSstStatusLabel(status: string, lang: string): string {
  const l = (lang === "ms" ? "ms" : "en") as "en" | "ms";
  const labels: Record<string, string> = {
    yes: t(l, "common.yes"),
    no: t(l, "common.no"),
    not_sure: t(l, "common.notSure"),
  };
  return labels[status] || status;
}

export default function OptionalSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedSst, setHasSavedSst] = useState(false);

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
          // If SST status has been set (not default), show view mode
          const isFilled = data.sstStatus === "yes" || data.sstStatus === "no";
          setHasSavedSst(isFilled);
          setIsEditing(!isFilled);
        } else {
          setInitialValues(PROFILE_DEFAULTS);
          setIsEditing(true);
        }
        setSaveAttempted(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error(t(language, "toast.failedToLoadProfile"));
        setIsEditing(true);
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
      return !!(values.sstNumber?.trim() && values.sstEffectiveDate?.trim());
    }
    return values.sstStatus === "no" || values.sstStatus === "not_sure";
  }, [values.sstStatus, values.sstNumber, values.sstEffectiveDate]);

  const canSave = hasChanges && isFormValid && !loading && !saving;

  async function handleSave() {
    if (!canSave) return;

    try {
      setSaving(true);
      setSaveAttempted(true);
      const v = getValues();

      if (v.sstStatus === "yes") {
        const isValid = await trigger(["sstNumber", "sstEffectiveDate"]);
        if (!isValid) {
          setSaving(false);
          return;
        }
      }

      await saveProfile(v);
      setInitialValues(v);
      setSaveAttempted(false);
      setHasSavedSst(true);
      setIsEditing(false);
      toast.success(t(language, "toast.saved"));
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(t(language, "toast.couldNotSaveTryAgain"));
    } finally {
      setSaving(false);
    }
  }

  function handleSstStatusChange(newStatus: SstStatus) {
    setValue("sstStatus", newStatus, { shouldDirty: true });

    if (newStatus !== "yes") {
      setValue("sstNumber", "", { shouldValidate: false });
      setValue("sstEffectiveDate", "", { shouldValidate: false });
      clearErrors(["sstNumber", "sstEffectiveDate"]);
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
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupOptional.title")}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "common.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // View mode — show saved SST details
  if (!isEditing && hasSavedSst) {
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
                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupOptional.title")}</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "setupOptional.subtitle")}</p>
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
            {/* SST Status */}
            <div className="border-b border-[var(--border)]/50 pb-4">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "setupOptional.question")}</div>
              <div className="text-base font-extrabold text-[var(--text-primary)]">
                {getSstStatusLabel(values.sstStatus, language)}
              </div>
            </div>

            {/* SST Number — only if registered */}
            {values.sstStatus === "yes" && values.sstNumber?.trim() && (
              <div className="border-b border-[var(--border)]/50 pb-4">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "setupOptional.sstNumberLabel")}</div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">{values.sstNumber}</div>
              </div>
            )}

            {/* SST Effective Date — only if registered */}
            {values.sstStatus === "yes" && values.sstEffectiveDate?.trim() && (
              <div className="pb-4">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{t(language, "setupOptional.effectiveDateLabel")}</div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">{values.sstEffectiveDate}</div>
              </div>
            )}

            {/* Status message for No / Not Sure */}
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
        title={t(language, "setupOptional.title")}
        subtitle={t(language, "setupOptional.subtitle")}
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