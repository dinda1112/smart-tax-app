"use client";

import { useEffect, useState } from "react";
import type { MsicClass } from "@/lib/types";
import { getMsicByCode, searchMsic } from "@/lib/msic-repo";
import { useDebounce } from "@/lib/use-debounce";
import { loadRecentMsic, pushRecentMsic } from "@/lib/profile-storage";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";

type Props = {
  valueCode: string;
  onSelect: (msic: MsicClass) => void;
  onClear: () => void;
  error?: string;
};

export function MsicPicker({ valueCode, onSelect, onClear, error }: Props) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(loadRecentMsic());
  }, []);

  const [selected, setSelected] = useState<MsicClass | undefined>(undefined);
  const [results, setResults] = useState<MsicClass[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load selected MSIC by code
  useEffect(() => {
    if (valueCode) {
      getMsicByCode(valueCode).then((msic) => {
        setSelected(msic || undefined);
        if (msic) setShowSearch(false);
      });
    } else {
      setSelected(undefined);
    }
  }, [valueCode]);

  // Search with debounced query
  useEffect(() => {
    if (!showSearch) {
      setResults([]);
      return;
    }

    if (debouncedQuery.trim().length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchMsic(debouncedQuery, 12)
      .then((data) => {
        setResults(data);
        setIsSearching(false);
      })
      .catch((error) => {
        console.error("Error searching MSIC:", error);
        setResults([]);
        setIsSearching(false);
      });
  }, [debouncedQuery, showSearch]);

  const popularChips = [
    { label: "F&B", q: "restaurant" },
    { label: "Retail", q: "retail" },
    { label: "Construction", q: "construction" },
    // Keep this broad to catch services like accounting, software, etc.
    { label: "Services", q: "services" },
  ];

  function pick(msic: MsicClass) {
    onSelect(msic);
    setShowSearch(false);
    setQuery("");
    setRecent(pushRecentMsic(msic.code));
  }

  if (selected && !showSearch) {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
        <div className="text-xs font-semibold text-zinc-700">Selected industry</div>
        <div className="mt-1 text-sm font-extrabold text-zinc-900">
          {selected.code} — {selected.title}
        </div>

        <div className="mt-1 text-xs text-zinc-600">
          Section {selected.section.code} — {selected.section.title}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => {
              onClear();
              setShowSearch(true);
            }}
            className="rounded-2xl border border-transparent bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>

        {error ? <div className="mt-2 text-sm font-semibold text-rose-600">{error}</div> : null}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-700">{t(language, "msicPicker.selectMsicCode")}</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t(language, "msicPicker.searchPlaceholder")}
        className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-zinc-900/30 ${
          error ? "border-rose-300" : "border-zinc-200"
        }`}
      />

      <div className="mt-2 text-xs text-zinc-600">
        Try: <span className="font-medium text-zinc-800">47110</span>,{" "}
        <span className="font-medium text-zinc-800">construction</span>,{" "}
        <span className="font-medium text-zinc-800">restaurant</span>.
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recent.length > 0 ? (
          <>
            <span className="text-xs font-semibold text-zinc-600">{t(language, "msicPicker.recent")}</span>
            {recent.map((code) => (
              <button
                key={code}
                type="button"
                onClick={async () => {
                  const m = await getMsicByCode(code);
                  if (m) pick(m);
                }}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-200"
              >
                {code}
              </button>
            ))}
          </>
        ) : null}

        <span className="ml-0 text-xs font-semibold text-zinc-600 sm:ml-2">{t(language, "msicPicker.examples")}</span>
        {popularChips.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setQuery(c.q)}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.trim().length > 0 ? (
        <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-2">
          {isSearching ? (
            <div className="px-3 py-4 text-sm text-zinc-600">
              {t(language, "msicPicker.searching")}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-sm text-zinc-600">
              {t(language, "msicPicker.noResultsLong")}
            </div>
          ) : (
            <div className="max-h-[360px] overflow-auto">
              {results.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full rounded-2xl px-3 py-3 text-left hover:bg-zinc-50"
                >
                  <div className="text-sm font-extrabold text-zinc-900">
                    {r.code} — {r.title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Section {r.section.code} — {r.division.title}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-3">
        {/* Browse-by-section removed (use search + recent chips only). */}
      </div>

      {error ? <div className="mt-2 text-sm font-semibold text-rose-600">{error}</div> : null}

    </div>
  );
}
