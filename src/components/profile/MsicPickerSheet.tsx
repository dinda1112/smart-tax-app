"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MsicClass } from "@/lib/types";
import { getMsicByCode, searchMsic } from "@/lib/msic-repo";
import { useDebounce } from "@/lib/use-debounce";
import { loadRecentMsic, pushRecentMsic } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { getLocalizedText } from "@/lib/i18n";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X, Check } from "lucide-react";

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
    // IMPORTANT: only use i18n if the current language key exists.
    // This prevents `getLocalizedText` from falling back to "first available" (e.g. Malay) when switching back to English.
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
    // Only search after user explicitly enters "search mode" (prevents iOS keyboard popping on open).
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
    setRecent(pushRecentMsic(msic.code));
  }

  function handleClear() {
    onClear();
    setOpen(false);
    setQuery("");
    setSearchMode(false);
  }

  function startSearch() {
    setSearchMode(true);
    // Focus ONLY after user action.
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
            // Reset so re-opening never triggers keyboard.
            setSearchMode(false);
            setQuery("");
            setResults([]);
            setIsSearching(false);
          }
        }}
        title={t(language, "msicPicker.title")}
        description={t(language, "msicPicker.subtitle")}
      >
        <div className="flex min-h-0 flex-col gap-3 overflow-x-hidden">
          {/* Header (search + chips) */}
          <div className="shrink-0 space-y-2">
            {/* Search (explicit) */}
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

            {/* Quick chips */}
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

          {/* Results (scrolls within sheet content) */}
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
                  <Card className="p-3 text-center sm:p-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t(language, "msicPicker.noResults")}
                    </p>
                  </Card>
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

          {error && (
            <Card className="border-[var(--danger)] bg-[var(--danger)]/10 p-3">
              <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
            </Card>
          )}
        </div>
      </BottomSheet>
    </>
  );
}




