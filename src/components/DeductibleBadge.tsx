import type { DeductibleStatus } from "@/lib/types";

type Props = {
  status: DeductibleStatus;
};

export function DeductibleBadge({ status }: Props) {
  const map: Record<DeductibleStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
    deductible: {
      label: "Deductible",
      bgColor: "light:bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "light:text-emerald-700 dark:text-emerald-400",
      borderColor: "light:ring-emerald-200 dark:ring-emerald-800",
    },
    non_deductible: {
      label: "Not deductible",
      bgColor: "light:bg-rose-50 dark:bg-rose-950/30",
      textColor: "light:text-rose-700 dark:text-rose-400",
      borderColor: "light:ring-rose-200 dark:ring-rose-800",
    },
    unknown: {
      label: "Needs details",
      bgColor: "light:bg-amber-50 dark:bg-amber-950/30",
      textColor: "light:text-amber-700 dark:text-amber-400",
      borderColor: "light:ring-amber-200 dark:ring-amber-800",
    },
  };

  const { label, bgColor, textColor, borderColor } = map[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${bgColor} ${textColor} ${borderColor}`}>
      {label}
    </span>
  );
}
