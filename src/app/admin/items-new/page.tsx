"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type ItemUsage = "sell" | "buy" | "";

export default function AddUnclassifiedItemPage() {
  const { language } = useLanguage();
  const [itemName, setItemName] = useState("");
  const [itemUsage, setItemUsage] = useState<ItemUsage>("");
  const [businessActivity, setBusinessActivity] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      toast.error(t(language, "admin.toastItemNameRequired"));
      return;
    }
    if (!itemUsage) {
      toast.error(t(language, "admin.toastUsageRequired"));
      return;
    }

    setSubmitting(true);
    setSuccess(false);
    try {
      // Build tags: include usage type and business activity for admin context
      const userTags = parseTags(tagsInput);
      const contextTags: string[] = [];

      // Add usage context as a tag
      if (itemUsage === "sell") {
        contextTags.push("usage:sell");
      } else if (itemUsage === "buy") {
        contextTags.push("usage:buy");
      }

      // Add business activity as a tag if provided
      const trimmedActivity = businessActivity.trim();
      if (trimmedActivity) {
        contextTags.push(`activity:${trimmedActivity}`);
      }

      const allTags = [...contextTags, ...userTags];

      const res = await fetch("/api/items/create-unclassified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          tags: allTags,
          language: language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit.");
        return;
      }
      setSuccess(true);
      setItemName("");
      setItemUsage("");
      setBusinessActivity("");
      setTagsInput("");
      toast.success(t(language, "admin.successTitle"));
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="page-slide-in">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t(language, "admin.backToHome")}
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            {t(language, "admin.addUnclassifiedTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t(language, "admin.addUnclassifiedSubtitle")}
          </p>
        </div>

        {success ? (
          <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-[var(--accent)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t(language, "admin.successTitle")}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t(language, "admin.successThankYou")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuccess(false)}
              >
                {t(language, "admin.addAnother")}
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.itemNameLabel")} <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t(language, "admin.itemNamePlaceholder")}
                required
                disabled={submitting}
              />
            </div>

            {/* Item Usage (Sell / Buy) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.usageLabel")} <span className="text-[var(--danger)]">*</span>
              </label>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {t(language, "admin.usageHint")}
              </p>
              <div className="inline-flex w-full overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-elevated)] p-1">
                <button
                  type="button"
                  onClick={() => setItemUsage("sell")}
                  disabled={submitting}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 ${
                    itemUsage === "sell"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30`}
                >
                  {t(language, "admin.usageSell")}
                </button>
                <button
                  type="button"
                  onClick={() => setItemUsage("buy")}
                  disabled={submitting}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 ${
                    itemUsage === "buy"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30`}
                >
                  {t(language, "admin.usageBuy")}
                </button>
              </div>
            </div>

            {/* Business Activity (Optional) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.activityLabel")} ({t(language, "common.optional")})
              </label>
              <Input
                value={businessActivity}
                onChange={(e) => setBusinessActivity(e.target.value)}
                placeholder={t(language, "admin.activityPlaceholder")}
                disabled={submitting}
              />
              <p className="text-[11px] text-[var(--text-secondary)]">
                {t(language, "admin.activityHint")}
              </p>
            </div>

            {/* Tags (Optional) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.tagsLabel")} ({t(language, "common.optional")})
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t(language, "admin.tagsPlaceholder")}
                disabled={submitting}
              />
              <p className="text-[11px] text-[var(--text-secondary)]">
                {t(language, "admin.tagsHint")}
              </p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t(language, "admin.submitting") : t(language, "admin.submit")}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}