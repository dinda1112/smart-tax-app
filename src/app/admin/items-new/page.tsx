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
import { createClient } from "@/lib/supabase/browser";

export default function AddUnclassifiedItemPage() {
  const { language } = useLanguage();
  const [itemKey, setItemKey] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameMs, setNameMs] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string; item_key: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedKey = itemKey.trim();
    const trimmedNameEn = nameEn.trim();
    if (!trimmedKey || !trimmedNameEn) {
      toast.error("item_key and name_en are required.");
      return;
    }
    setSubmitting(true);
    setSuccess(null);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("You must be signed in.");
        return;
      }
      const tagsArray = tags.trim()
        ? tags.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const name_i18n = {
        en: trimmedNameEn,
        ms: nameMs.trim() || trimmedNameEn,
      };
      const { data, error } = await supabase
        .from("items")
        .insert({
          item_key: trimmedKey,
          name_i18n,
          tags: tagsArray,
          msic_code: null,
        })
        .select("id")
        .single();
      if (error) {
        toast.error(error.message || "Failed to create item.");
        return;
      }
      setSuccess({ id: data.id, item_key: trimmedKey });
      setItemKey("");
      setNameEn("");
      setNameMs("");
      setTags("");
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
            href="/settings"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t(language, "admin.backToSettings")}
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
                ID: <code className="font-mono font-semibold">{success.id}</code>
                <br />
                item_key: <code className="font-mono font-semibold">{success.item_key}</code>
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {t(language, "admin.successMessage")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuccess(null)}
              >
                Add another
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.itemKeyLabel")} <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                value={itemKey}
                onChange={(e) => setItemKey(e.target.value)}
                placeholder={t(language, "admin.itemKeyPlaceholder")}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.nameEnLabel")} <span className="text-[var(--danger)]">*</span>
              </label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={t(language, "admin.nameEnPlaceholder")}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.nameMsLabel")} ({t(language, "common.optional")})
              </label>
              <Input
                value={nameMs}
                onChange={(e) => setNameMs(e.target.value)}
                placeholder={t(language, "admin.nameMsPlaceholder")}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                {t(language, "admin.tagsLabel")} ({t(language, "common.optional")})
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t(language, "admin.tagsPlaceholder")}
                disabled={submitting}
              />
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
