"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/profile/SectionCard";
import { StickyFooterActions } from "@/components/profile/StickyFooterActions";
import { MsicPickerSheet } from "@/components/profile/MsicPickerSheet";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Receipt, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import type { MsicClass, ProfileFormData } from "@/lib/types";
import { PROFILE_DEFAULTS } from "@/lib/profile-defaults";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import { getMsicByCode } from "@/lib/msic-repo";
import { getItemsByMsicCode, searchItemsByQuery, type Item } from "@/lib/items-repo";
import { getSstRateRPC } from "@/lib/sst-repo";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { getLocalizedText, getItemDisplayName } from "@/lib/i18n";

type InvoiceType = "sales" | "cost" | "";
type ResultState =
  | { type: "success"; rate: number; explanation: string }
  | { type: "no_rule" }
  | { type: "no_items" }
  | null;

export default function IndustryMsicPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [canContinue, setCanContinue] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(true);
  const [selectedMsic, setSelectedMsic] = useState<MsicClass | null>(null);
  const [loadingMsic, setLoadingMsic] = useState(false);
  
  // MSIC source: manual = user chose from picker (don't overwrite with item); auto = from item or cleared
  const [msicSource, setMsicSource] = useState<"manual" | "auto">("auto");
  // Item search state (for MSIC auto-selection)
  const skipNextSearchRef = useRef(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemSearchResults, setItemSearchResults] = useState<Item[]>([]);
  const [loadingItemSearch, setLoadingItemSearch] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [selectedItemForMsic, setSelectedItemForMsic] = useState<Item | null>(null);
  const [itemSearchMessage, setItemSearchMessage] = useState<
    { type: "none" | "no_msic" | "not_found"; text: string } | null
  >(null);
  const [itemSstResult, setItemSstResult] = useState<ResultState>(null);
  const [loadingItemSst, setLoadingItemSst] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  
  // Check invoice state
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [loadingSst, setLoadingSst] = useState(false);
  const [profile, setProfile] = useState<ProfileFormData | null>(null);

  const {
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

  function msicDisplayName(msic: MsicClass | null): string {
    if (!msic) return "";
    // IMPORTANT: only use i18n if the current language key exists.
    // Prevents `getLocalizedText` from falling back to "first available" (e.g. Malay) when switching back to English.
    const hasCurrentLang = !!msic.msic_name_i18n?.[language];
    const localized = getLocalizedText(hasCurrentLang ? msic.msic_name_i18n : null, language).trim();
    return localized || msic.msic_name || msic.title || msic.code;
  }
  
  // Get item_key to pass to RPC
  const itemKeyForRpc = useMemo(() => {
    if (invoiceType === "sales") return "sales";
    return selectedItemKey;
  }, [invoiceType, selectedItemKey]);

  async function handleCheck() {
    const itemKey = itemKeyForRpc;
    if (!itemKey) {
      return;
    }

    setLoadingSst(true);
    setResult(null);

    try {
      const rateResult = await getSstRateRPC(itemKey);

      if (rateResult === null) {
        setResult({ type: "no_rule" });
      } else {
        const explanation =
          rateResult.explanation_i18n[language] || rateResult.explanation_i18n.en || "";
        setResult({
          type: "success",
          rate: rateResult.sst_percent,
          explanation,
        });
      }
    } catch (error) {
      console.error("Failed to get SST rate:", error);
      setResult({ type: "no_rule" });
    } finally {
      setLoadingSst(false);
    }
  }



  // Fetch MSIC data when msicCode changes
useEffect(() => {
  async function loadMsicData() {
    if (!values.msicCode?.trim()) {
      setSelectedMsic(null);
      return;
    }

    // If selectedMsic is already set with matching code (e.g. from manual entry),
    // skip the Supabase lookup — we already have the data.
    if (selectedMsic && selectedMsic.code === values.msicCode.trim()) {
      return;
    }

    try {
      setLoadingMsic(true);
      const msic = await getMsicByCode(values.msicCode);
      if (msic) {
        setSelectedMsic(msic);
        setValue("msicTitle", msic.msic_name, { shouldDirty: false });
      } else {
        // Code not in DB — likely a manual entry. Reconstruct from saved profile data.
        const title = values.msicTitle || values.msicCode;
        setSelectedMsic({
          code: values.msicCode.trim(),
          msic_name: title,
          msic_name_i18n: null,
          title,
          section: { code: "", title: "" },
          division: { code: "", title: "" },
          group: { code: "", title: "" },
          class: { code: values.msicCode.trim(), title },
          keywords: [],
        });
      }
    } catch (error) {
      console.error("Failed to load MSIC data:", error);
      // Don't clear selectedMsic — it may have been set manually
    } finally {
      setLoadingMsic(false);
    }
  }

  loadMsicData();
}, [values.msicCode]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data } = await loadProfile();
        if (data) {
          reset(data);
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [reset]);

  useEffect(() => {
    setCanContinue(values.msicCode.trim().length > 0);
  }, [values.msicCode]);

  // Search items when query changes (debounced)
  useEffect(() => {
    if (!itemSearchQuery.trim()) {
      setItemSearchResults([]);
      setItemSearchMessage(null);
      setLastSearchedQuery("");
      setItemSearchOpen(false);
      if (!selectedItemForMsic) {
        setSelectedItemForMsic(null);
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        return;
      }
      const searchedQuery = itemSearchQuery.trim();
      setLoadingItemSearch(true);
      setItemSearchMessage(null);
      setItemSearchOpen(true);
      try {
        const results = await searchItemsByQuery(searchedQuery, language, 20);
        setItemSearchResults(results);
      } catch (error) {
        console.error("Failed to search items:", error);
        setItemSearchResults([]);
      } finally {
        setLoadingItemSearch(false);
        setLastSearchedQuery(searchedQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSearchQuery, language]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const itemSearchContainer = document.querySelector('[data-item-search-container]');
      if (itemSearchContainer && !itemSearchContainer.contains(target)) {
        setItemSearchOpen(false);
      }
    }
    if (itemSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [itemSearchOpen]);

  // Handle item selection for MSIC auto-selection
 async function handleItemSelectForMsic(item: Item) {
    skipNextSearchRef.current = true;
    setSelectedItemForMsic(item);
    setItemSearchQuery(getItemDisplayName(item, language));
    setItemSearchResults([]);
    setLastSearchedQuery("");
    setItemSearchOpen(false);
    setItemSstResult(null);

    const currentMsicCode = getValues("msicCode")?.trim();
    const isManualMsic = msicSource === "manual" && !!currentMsicCode;

    if (item.msic_code) {
      if (isManualMsic) {
        setItemSearchMessage({
          type: "not_found",
          text: t(language, "setupIndustry.itemSearch.msicAlreadySelected"),
        });
      } else {
        try {
          const msic = await getMsicByCode(item.msic_code);
          if (msic) {
            setMsicSource("auto");
            applyMsic(msic);
            setItemSearchMessage(null);
            setTimeout(() => {
              const card = document.querySelector('[data-selected-industry-card]');
              card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 100);
          } else {
            setItemSearchMessage({
              type: "not_found",
              text: t(language, "setupIndustry.itemSearch.msicNotFound"),
            });
          }
        } catch (error) {
          console.error("Failed to load MSIC:", error);
          setItemSearchMessage({
            type: "not_found",
            text: t(language, "setupIndustry.itemSearch.msicNotFound"),
          });
        }
      }
    } else {
      setItemSearchMessage({
        type: "no_msic",
        text: t(language, "setupIndustry.itemSearch.noMsic"),
      });
    }

    // Auto-fetch SST rate for the selected item
    if (item.item_key) {
      setLoadingItemSst(true);
      try {
        const rateResult = await getSstRateRPC(item.item_key);
        if (rateResult === null) {
          setItemSstResult({ type: "no_rule" });
        } else {
          const explanation =
            rateResult.explanation_i18n[language] || rateResult.explanation_i18n.en || "";
          setItemSstResult({
            type: "success",
            rate: rateResult.sst_percent,
            explanation,
          });
        }
      } catch (error) {
        console.error("Failed to get SST rate for item:", error);
        setItemSstResult({ type: "no_rule" });
      } finally {
        setLoadingItemSst(false);
      }
    }
  }

  // Check if items list is empty (NO ITEMS FOR MSIC state)
  const hasNoItems = !loadingItems && items.length === 0 && values.msicCode?.trim();

  // Determine if button should be enabled
  const canCheck = useMemo(() => {
    // Must have invoice type selected
    if (!invoiceType) return false;

    // If items are empty for cost invoices, disable button
    if (invoiceType === "cost" && hasNoItems) return false;

    // For cost invoices, must have an item selected
    if (invoiceType === "cost" && !selectedItemKey) return false;

    // For sales invoices, always allow (uses "sales" as item_key)
    return true;
  }, [invoiceType, selectedItemKey, hasNoItems]);

  // Create combobox options from items
  const comboboxOptions = useMemo(() => {
    return items.map((item) => ({
      value: item.item_key,
      label: getItemDisplayName(item, language),
    }));
  }, [items, language]);

  function applyMsic(msic: MsicClass) {
    // Persist canonical MSIC data only (never localized display text)
    setValue("msicCode", msic.code, { shouldDirty: true });
    setValue("msicTitle", msic.msic_name, { shouldDirty: true });
    setSelectedMsic(msic); // Update UI immediately
    // Reset check invoice state when MSIC changes
    setSelectedItemKey("");
    setResult(null);
    toast.success(t(language, "toast.industrySet"));
  }

  function clearMsic() {
    setMsicSource("auto");
    setItemSearchMessage(null);
    setValue("msicCode", "", { shouldDirty: true });
    setValue("msicTitle", "", { shouldDirty: true });
    setSelectedMsic(null);
  }

  async function save() {
    try {
      const v = getValues();
      // Only save msicCode - other MSIC fields are derived
      // Pass full form values; saveProfile will only update non-empty fields
      await saveProfile(v);
      toast.success(t(language, "toast.updated"));
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(t(language, "toast.failedToSaveTryAgain"));
    }
  }

  function continueNext() {
    if (!canContinue) return;
    save();
    router.push("/setup");
  }

  const hasScope = !!selectedMsic;
  
  function renderCodeName(code: string, name?: string | null) {
    const c = code?.trim();
    const n = name?.trim();
    if (!c) return null;
    if (n) return `${c} — ${n}`;
    return c;
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
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupIndustry.title")}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "common.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

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
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t(language, "setupIndustry.title")}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(language, "setupIndustry.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SectionCard title={t(language, "setupIndustry.sectionTitle")} required>
          <div data-field="msicCode">
            <MsicPickerSheet
              valueCode={values.msicCode}
              onSelect={(m) => {
              setMsicSource("manual");
              const isManualEntry = !m.section.code;
              setValue("msicCode", m.code, { shouldDirty: true });
              setValue("msicTitle", m.msic_name, { shouldDirty: true });
              setSelectedMsic(m);
              setSelectedItemKey("");
              setResult(null);
              if (!isManualEntry) {
              toast.success(t(language, "toast.industrySet"));
              }
              }}
              onClear={clearMsic}
              error={errors.msicCode ? t(language, "setupIndustry.errors.msicRequired") : undefined}
            />
          </div>

          {/* Selected Industry Summary Card */}
          {values.msicCode && (
            <div data-selected-industry-card className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              {loadingMsic ? (
                <div className="text-xs text-[var(--text-secondary)]">{t(language, "setupIndustry.loadingIndustryDetails")}</div>
              ) : selectedMsic ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">{t(language, "setupIndustry.selectedIndustry")}</div>
                    {!selectedMsic.section.code && (
                      <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="text-[11px] font-semibold text-blue-600">
                          {t(language, "msicPicker.others.pendingVerification")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)] break-words whitespace-normal">
                    {selectedMsic.code} — {msicDisplayName(selectedMsic)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-[var(--text-secondary)]">
                  {t(language, "setupIndustry.industryCodeNotFoundPrefix")} {values.msicCode} {t(language, "setupIndustry.industryCodeNotFoundSuffix")}
                </div>
              )}
            </div>
          )}

          {/* Scope of Economic Activities - Collapsible Panel */}
          {hasScope && selectedMsic && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setScopeOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                aria-expanded={scopeOpen}
              >
                <span>{t(language, "setupIndustry.viewScope")}</span>
                {scopeOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-secondary)] transition-transform" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] transition-transform" />
                )}
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  scopeOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
                    {t(language, "setupIndustry.scopeTitle")}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedMsic.section.code && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 w-20">{t(language, "setupIndustry.scope.section")}</div>
                        <div className="min-w-0 flex-1 break-words text-sm font-extrabold text-[var(--text-primary)] text-right">
                          {renderCodeName(selectedMsic.section.code, selectedMsic.section.title)}
                        </div>
                      </div>
                    )}
                    
                    {selectedMsic.division.code && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 w-20">{t(language, "setupIndustry.scope.division")}</div>
                        <div className="min-w-0 flex-1 break-words text-sm font-extrabold text-[var(--text-primary)] text-right">
                          {renderCodeName(selectedMsic.division.code, selectedMsic.division.title)}
                        </div>
                      </div>
                    )}
                    
                    {selectedMsic.group.code && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 w-20">{t(language, "setupIndustry.scope.group")}</div>
                        <div className="min-w-0 flex-1 break-words text-sm font-extrabold text-[var(--text-primary)] text-right">
                          {renderCodeName(selectedMsic.group.code, selectedMsic.group.title)}
                        </div>
                      </div>
                    )}
                    
                    {selectedMsic.class.code && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 w-20">{t(language, "setupIndustry.scope.class")}</div>
                        <div className="min-w-0 flex-1 break-words text-sm font-extrabold text-[var(--text-primary)] text-right">
                          {renderCodeName(selectedMsic.class.code, selectedMsic.class.title)}
                        </div>
                      </div>
                    )}

                    {/* MSIC (always show the selected code/name) */}
                    {selectedMsic.code && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] shrink-0 w-20">
                          {t(language, "setupIndustry.sectionTitle")}
                        </div>
                        <div className="min-w-0 flex-1 break-words text-sm font-extrabold text-[var(--text-primary)] text-right">
                          {renderCodeName(selectedMsic.code, msicDisplayName(selectedMsic))}
                        </div>
                      </div>
                    )}
                  </div>
                    </div>
                  </div>
            </div>
          )}
        </SectionCard>

        {/* Item Search Section (Optional) */}
        <SectionCard title={t(language, "setupIndustry.itemSearch.title")} required>
          <div className="space-y-3" data-item-search-container>
            <p className="text-xs text-[var(--text-secondary)]">
              {t(language, "setupIndustry.itemSearch.hint")}
            </p>
            <div className="relative">
              <Input
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                   if (!e.target.value.trim()) {
                    setSelectedItemForMsic(null);
                    setItemSearchMessage(null);
                    setItemSstResult(null);
                    }
                      }}
                onFocus={() => {
                  if (itemSearchResults.length > 0) {
                    setItemSearchOpen(true);
                  }
                }}
                placeholder={t(language, "setupIndustry.itemSearch.placeholder")}
              />
              {loadingItemSearch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                </div>
              )}
              {itemSearchOpen && itemSearchResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                  {itemSearchResults.map((item, index) => {
                    const displayName = getItemDisplayName(item, language);
                    const msicLabel = item.msic_code
                      ? item.msic_code
                      : t(language, "setupIndustry.itemSearch.unclassifiedBadge");
                    const tags = Array.isArray(item.tags) ? item.tags : [];
                    const visibleTags = tags.slice(0, 3);
                    const extraCount = tags.length - visibleTags.length;

                    return (
                      <button
                        key={item.id ?? `row-${item.item_key}-${item.msic_code ?? "u"}-${index}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleItemSelectForMsic(item);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold break-words">
                            {displayName} — {msicLabel}
                          </span>
                        </div>
                        {visibleTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {visibleTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
                              >
                                {tag}
                              </span>
                            ))}
                            {extraCount > 0 && (
                              <span className="inline-flex items-center rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Persistent no-match panel: only when search completed for current debounced query (no flicker while typing) */}
            {itemSearchQuery.trim().length >= 3 &&
              !loadingItemSearch &&
              lastSearchedQuery === itemSearchQuery.trim() &&
              itemSearchResults.length === 0 && (
                <div className="rounded-xl border border-[var(--border)]/30 bg-[var(--surface-elevated)] p-3 text-xs">
                  <p className="font-semibold text-[var(--text-secondary)]">
                    {t(language, "setupIndustry.itemSearch.notFound")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/admin/items-new";
                    }}
                    className="mt-2 text-[11px] font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    {t(language, "setupIndustry.itemSearch.addUnclassifiedLink")}
                  </button>
                </div>
              )}
            {itemSearchMessage && (
              <div className={cn(
                "rounded-xl border p-3 text-xs",
                itemSearchMessage.type === "no_msic" && "border-[var(--danger)]/30 bg-[var(--danger)]/5",
                itemSearchMessage.type === "not_found" && "border-[var(--border)]/30 bg-[var(--surface-elevated)]"
              )}>
                <p className={cn(
                  "font-semibold",
                  itemSearchMessage.type === "no_msic" && "text-[var(--danger)]",
                  itemSearchMessage.type === "not_found" && "text-[var(--text-secondary)]"
                )}>
                  {itemSearchMessage.text}
                </p>
                {itemSearchMessage.type === "not_found" && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/admin/items-new";
                    }}
                    className="mt-2 text-[11px] font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    {t(language, "setupIndustry.itemSearch.addUnclassifiedLink")}
                  </button>
                )}
              </div>
            )}

            {/* Inline SST Result */}
{loadingItemSst && (
  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center">
    <div className="flex items-center justify-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      <span className="text-sm text-[var(--text-secondary)]">{t(language, "setupIndustry.invoice.checking")}</span>
    </div>
  </div>
)}

{!loadingItemSst && itemSstResult?.type === "success" && selectedItemForMsic && (
  <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/5">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">
          {t(language, "setupIndustry.itemSst.resultLabel")}
        </div>
        <div className="text-sm font-extrabold text-[var(--text-primary)]">
          {getItemDisplayName(selectedItemForMsic, language)}
        </div>
      </div>
      <div className="text-3xl font-black text-[var(--text-primary)]">
        {itemSstResult.rate}%
      </div>
    </div>
    {itemSstResult.explanation && (
      <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)]/30 pt-2">
        {itemSstResult.explanation}
      </p>
    )}
  </Card>
)}

{!loadingItemSst && itemSstResult?.type === "no_rule" && selectedItemForMsic && (
  <Card className="border-[var(--border)]/30 bg-[var(--surface-elevated)]">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 shrink-0 text-[var(--text-secondary)] mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {t(language, "setupIndustry.result.sstRateNotAvailable")}
        </div>
      </div>
    </div>
  </Card>
)}
          </div>
        </SectionCard>

        {/* Check Invoice Section */}
        <Card className="border-[var(--border)]/50 bg-[var(--surface)]">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "setupIndustry.invoice.type")}</label>
              <div className="inline-flex w-full overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-elevated)] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceType("sales");
                    setSelectedItemKey("");
                    setResult(null);
                  }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 ${
                    invoiceType === "sales"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30`}
                >
                  {t(language, "setupIndustry.invoice.sales")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceType("cost");
                    setSelectedItemKey("");
                    setResult(null);
                  }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200 ${
                    invoiceType === "cost"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30`}
                >
                  {t(language, "setupIndustry.invoice.cost")}
                </button>
              </div>
            </div>

            {invoiceType === "cost" && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">{t(language, "setupIndustry.invoice.item")}</label>
                <p className="mb-2.5 text-xs text-[var(--text-secondary)]/60">
                  {t(language, "setupIndustry.invoice.itemsHint")}
                </p>
                {loadingItems ? (
                  <div className="h-11 w-full rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-elevated)] px-4 flex items-center">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-[var(--surface)] animate-pulse" />
                    </div>
                  </div>
                ) : hasNoItems ? (
                  <div className="h-11 w-full rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-elevated)] px-4 flex items-center">
                    <span className="text-sm text-[var(--text-secondary)]/60">{t(language, "setupIndustry.invoice.noItemsAvailable")}</span>
                  </div>
                ) : (
                  <Combobox
                    options={comboboxOptions}
                    value={selectedItemKey}
                    onChange={(value) => {
                      setSelectedItemKey(value);
                      setResult(null);
                    }}
                    placeholder={t(language, "setupIndustry.invoice.itemPlaceholder")}
                    disabled={loadingItems || !values.msicCode?.trim() || hasNoItems ? true : false}
                    searchable={true}
                  />
                )}
              </div>
            )}

            <Button
              onClick={handleCheck}
              disabled={!canCheck || loadingSst || loading}
              className={cn(
                "w-full transition-all duration-200",
                canCheck && !loadingSst && !loading
                  ? "hover:scale-[1.01] hover:shadow-md"
                  : "cursor-not-allowed"
              )}
            >
              <Receipt className="h-4 w-4" />
              {loadingSst ? t(language, "setupIndustry.invoice.checking") : t(language, "setupIndustry.invoice.checkTaxPercent")}
            </Button>
          </div>
        </Card>

        {/* Single Result Container - shows only ONE state at a time */}
        <div className="min-h-[80px]">
          {result?.type === "success" && (
            <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/5 transition-opacity duration-200 ease-out">
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="text-4xl font-black text-[var(--text-primary)] mb-2">
                  {result.rate}%
                </div>
                {result.explanation && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md">
                    {result.explanation}
                  </p>
                )}
              </div>
            </Card>
          )}

          {result?.type === "no_rule" && (
            <Card className="border-[var(--border)]/30 bg-[var(--surface-elevated)] transition-opacity duration-200 ease-out">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-[var(--text-secondary)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {t(language, "setupIndustry.result.sstRateNotAvailable")}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {hasNoItems && invoiceType === "cost" && !loadingItems && !result && (
            <Card className="border-[var(--border)]/30 bg-[var(--surface-elevated)] transition-opacity duration-200 ease-out">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-[var(--text-secondary)] mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {t(language, "setupIndustry.result.noResultTitle")}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
                    {t(language, "setupIndustry.result.tryMsicLevel")}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <StickyFooterActions canContinue={canContinue} onSave={save} onContinue={continueNext} />
      </div>
    </AppShell>
  );
}





