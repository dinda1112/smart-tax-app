import { DeductibleBadge } from "./DeductibleBadge";
import { formatRelativeTime } from "@/lib/format";
import type { TaxCheck } from "@/lib/types";

type Props = {
  item: TaxCheck;
};

export function ItemCard({ item }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors theme-shadow">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.itemName}</div>
          <span className="text-xs text-[var(--text-secondary)]">•</span>
          <div className="text-xs font-medium text-[var(--text-secondary)]">{item.category}</div>
        </div>

        <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.reasonShort}</div>
        <div className="mt-2 text-xs text-[var(--text-secondary)]">{formatRelativeTime(item.checkedAtISO)}</div>
      </div>

      <DeductibleBadge status={item.status} />
    </div>
  );
}
