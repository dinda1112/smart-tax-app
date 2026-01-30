import type { DeductibleStatus } from "@/lib/types";

type Props = {
  status: DeductibleStatus;
};

export function DeductibleBadge({ status }: Props) {
  const map: Record<DeductibleStatus, { label: string; cls: string }> = {
    deductible: {
      label: "Deductible",
      cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    non_deductible: {
      label: "Not deductible",
      cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    },
    unknown: {
      label: "Needs details",
      cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
  };

  const { label, cls } = map[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
