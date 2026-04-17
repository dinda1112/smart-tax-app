"use client";

import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MsicClass } from "@/lib/types";
import { getMsicByCode, searchMsic } from "@/lib/msic-repo";
import { useDebounce } from "@/lib/use-debounce";
import { loadRecentMsic, pushRecentMsic } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { getLocalizedText } from "@/lib/i18n";
import { submitMsicForReview } from "@/lib/msic-submissions";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, Check, PenLine } from "lucide-react";

type Props = {
  valueCode: string;
  onSelect: (msic: MsicClass) => void;
  onClear: () => void;
  error?: string;
  trigger?: React.ReactNode;
};

export function MsicPickerSheet({ valueCode, onSelect, onClear, error, trigger }: Props) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // "Others" manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualError, setManualError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleClampStyle = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as const;

  useEffect(() => {
    setRecent(loadRecentMsic());
  }, []);

  const [selected, setSelected] = useState<MsicClass | undefined>(undefined);
  const [results, setResults] = useState<MsicClass[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  function msicDisplayName(msic?: MsicClass): string {
    if (!msic) return "";
    const hasCurrentLang = !!msic.msic_name_i18n?.[language];
    const localized = getLocalizedText(hasCurrentLang ? msic.msic_name_i18n : null, language).trim();
    return localized || msic.msic_name || msic.title || msic.code;
  }

  // Load selected MSIC by code
  useEffect(() => {
    if (valueCode) {
      getMsicByCode(valueCode).then((msic) => {
        setSelected(msic || undefined);
      });
    } else {
      setSelected(undefined);
    }
  }, [valueCode]);

  // Search with debounced query
  useEffect(() => {
    if (!open || !searchMode) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (debouncedQuery.trim().length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchMsic(debouncedQuery, 20)
      .then((data) => {
        setResults(data);
        setIsSearching(false);
      })
      .catch((error) => {
        console.error("Error searching MSIC:", error);
        setResults([]);
        setIsSearching(false);
      });
  }, [debouncedQuery, open, searchMode]);

  const recentCodes = useMemo(() => recent, [recent]);

  function pick(msic: MsicClass) {
    onSelect(msic);
    setOpen(false);
    setQuery("");
    setSearchMode(false);
    setShowManualEntry(false);
    setRecent(pushRecentMsic(msic.code));
  }

  function handleClear() {
    onClear();
    setOpen(false);
    setQuery("");
    setSearchMode(false);
    setShowManualEntry(false);
  }

  function startSearch() {
    setSearchMode(true);
    setShowManualEntry(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          searchInputRef.current?.focus({ preventScroll: true } as any);
        } catch {
          searchInputRef.current?.focus();
        }
      });
    });
  }

  async function handleManualSubmit() {
    const code = manualCode.trim();
    const desc = manualDescription.trim();

    if (!code) {
      setManualError(t(language, "msicPicker.others.errorCodeRequired"));
      return;
    }
    if (!desc) {
      setManualError(t(language, "msicPicker.others.errorDescriptionRequired"));
      return;
    }

    setManualError("");
    setSubmitting(true);

    // Build a MsicClass-shaped object for the custom entry
    const customMsic: MsicClass = {
      code,
      msic_name: desc,
      msic_name_i18n: { [language]: desc } as any,
      title: desc,
      section: { code: "", title: "" },
      division: { code: "", title: "" },
      group: { code: "", title: "" },
      class: { code, title: desc },
      keywords: [],
    };

    // Submit to Supabase for admin review
    const result = await submitMsicForReview(code, desc);
    if (!result.success) {
      console.error("Failed to submit MSIC for review:", result.error);
      // Still allow the user to continue even if submission fails
    }

    onSelect(customMsic);
    setOpen(false);
    resetManualForm();
    setSubmitting(false);
    toast.success(t(language, "msicPicker.others.toastSaved"));
  }

  function resetManualForm() {
    setShowManualEntry(false);
    setManualCode("");
    setManualDescription("");
    setManualError("");
    setQuery("");
    setSearchMode(false);
    setSubmitting(false);
  }

  function openManualEntry() {
    setShowManualEntry(true);
    setSearchMode(false);
    setQuery("");
    setResults([]);
  }

  const defaultTrigger = (
    <Button
      variant={selected ? "outline" : "default"}
      className="w-full justify-between"
      onClick={() => setOpen(true)}
    >
      <span className="flex min-w-0 items-center gap-2">
        {selected ? (
          <>
            <span className="font-mono text-xs">{selected.code}</span>
            <span className="min-w-0 truncate">
              {msicDisplayName(selected)}
            </span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>{t(language, "msicPicker.selectMsicCode")}</span>
          </>
        )}
      </span>
      {selected && (
        <div
          className="inline-flex h-6 w-6 items-center justify-center rounded-2xl text-[var(--text-primary)] transition-all hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }
          }}
        >
          <X className="h-3 w-3" />
        </div>
      )}
    </Button>
  );

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || defaultTrigger}
      </div>

      <BottomSheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSearchMode(false);
            setQuery("");
            setResults([]);
            setIsSearching(false);
            setShowManualEntry(false);
            setManualCode("");
            setManualDescription("");
            setManualError("");
            setSubmitting(false);
          }
        }}
        title={t(language, "msicPicker.title")}
        description={t(language, "msicPicker.subtitle")}
      >
        <div className="flex min-h-0 flex-col gap-3 overflow-x-hidden">

          {/* ── Manual Entry Form ── */}
          {showManualEntry ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
                  <PenLine className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    {t(language, "msicPicker.others.title")}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {t(language, "msicPicker.others.subtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "msicPicker.others.codeLabel")}
                  </label>
                  <Input
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      setManualError("");
                    }}
                    placeholder={t(language, "msicPicker.others.codePlaceholder")}
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                    {t(language, "msicPicker.others.descriptionLabel")}
                  </label>
                  <Input
                    value={manualDescription}
                    onChange={(e) => {
                      setManualDescription(e.target.value);
                      setManualError("");
                    }}
                    placeholder={t(language, "msicPicker.others.descriptionPlaceholder")}
                  />
                </div>
              </div>

              {manualError && (
                <p className="text-xs font-semibold text-[var(--danger)]">{manualError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualCode("");
                    setManualDescription("");
                    setManualError("");
                  }}
                  disabled={submitting}
                >
                  {t(language, "common.back")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                >
                  {submitting ? t(language, "common.saving") : t(language, "common.save")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Header (search + chips) ── */}
              <div className="shrink-0 space-y-2">
                {searchMode ? (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <Input
                      ref={(el) => {
                        searchInputRef.current = el;
                      }}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t(language, "msicPicker.searchPlaceholder")}
                      data-msic-search="1"
                      inputMode="search"
                      enterKeyHint="search"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      autoComplete="off"
                      type="search"
                      className="pl-10 leading-5"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startSearch}
                    className="flex h-11 w-full items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-left text-sm font-medium shadow-sm outline-none transition-all duration-200 hover:bg-[var(--surface-elevated)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                  >
                    <Search className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span className="min-w-0 flex-1 truncate text-[var(--text-muted)]">
                      {t(language, "msicPicker.searchPlaceholder")}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[var(--text-secondary)]">
                      {t(language, "common.openArrow")}
                    </span>
                  </button>
                )}

                {recentCodes.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {t(language, "msicPicker.recent")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentCodes.map((code) => (
                        <Button
                          key={code}
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const m = await getMsicByCode(code);
                            if (m) pick(m);
                          }}
                          className="h-7 px-3 text-[11px] font-semibold"
                        >
                          {code}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ── Results ── */}
              <div className="min-h-0 flex-1">
                {searchMode && query.trim().length > 0 ? (
                  <div className="space-y-2">
                    {isSearching ? (
                      <Card className="p-3 text-center sm:p-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {t(language, "msicPicker.searching")}
                        </p>
                      </Card>
                    ) : results.length === 0 ? (
                      <div className="space-y-3">
                        <Card className="p-3 text-center sm:p-4">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {t(language, "msicPicker.noResults")}
                          </p>
                        </Card>
                        <button
                          type="button"
                          onClick={openManualEntry}
                          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 p-4 text-left transition-colors hover:bg-[var(--surface-elevated)]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10">
                            <PenLine className="h-4 w-4 text-[var(--accent)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-extrabold text-[var(--text-primary)]">
                              {t(language, "msicPicker.others.buttonLabel")}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                              {t(language, "msicPicker.others.buttonHint")}
                            </div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {results.map((r) => (
                          <Card
                            key={r.code}
                            className="cursor-pointer p-3 transition-colors hover:bg-[var(--surface-elevated)] sm:p-4"
                            onClick={() => pick(r)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 rounded-lg bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--accent)]">
                                    {r.code}
                                  </span>
                                  <span
                                    className="min-w-0 break-words text-sm font-semibold leading-snug text-[var(--text-primary)]"
                                    style={titleClampStyle}
                                  >
                                    {msicDisplayName(r)}
                                  </span>
                                </div>
                                <div className="mt-1 break-words text-[11px] leading-snug text-[var(--text-secondary)]">
                                  Section {r.section.code}
                                  {r.section.title ? ` — ${r.section.title}` : ""}
                                </div>
                              </div>
                              {selected?.code === r.code && (
                                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                              )}
                            </div>
                          </Card>
                        ))}

                        <div className="pt-2 pb-1 text-center">
                          <button
                            type="button"
                            onClick={openManualEntry}
                            className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                          >
                            {t(language, "msicPicker.others.linkLabel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="p-4 text-center sm:p-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {searchMode ? t(language, "msicPicker.startTyping") : t(language, "msicPicker.subtitle")}
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}

          {error && !showManualEntry && (
            <Card className="border-[var(--danger)] bg-[var(--danger)]/10 p-3">
              <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
            </Card>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
