"use client";

import { useMemo, useState } from "react";
import type { PurchaseCategory } from "@/lib/types";
import { purchaseCategories, quickEvaluate } from "@/lib/mock-data";
import { DeductibleBadge } from "./DeductibleBadge";

export function DashboardQuickCheck() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<PurchaseCategory>("Raw Materials");
  const [result, setResult] = useState<{ status: "deductible" | "non_deductible" | "unknown"; reasonShort: string } | null>(null);

  const canCheck = useMemo(() => itemName.trim().length > 0, [itemName]);

  return (
    <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors theme-shadow">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[var(--text-primary)]">Quick tax check</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">Type an item and choose a category. This is mock logic for UI only.</div>
        </div>

        {result ? (
          <div className="flex items-center gap-2">
            <DeductibleBadge status={result.status} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-7">
          <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Item name</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Keyboard, Laptop, Rice, POS printer..."
            className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
            className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/30"
          >
            {purchaseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-transparent">Action</label>
          <button
            disabled={!canCheck}
            onClick={() => setResult(quickEvaluate(itemName, category))}
            className="h-11 w-full rounded-2xl bg-[var(--accent)] px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check
          </button>
        </div>
      </div>

      {result ? (
        <div className="mt-4 rounded-2xl bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Result</div>
          <div className="mt-1 text-sm text-[var(--text-primary)]">{result.reasonShort}</div>

          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Tip: keep the invoice + ensure it's clearly for business use.
          </div>
        </div>
      ) : null}
    </section>
  );
}
