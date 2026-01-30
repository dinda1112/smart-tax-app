import type { PurchaseCategory } from "@/lib/types";

/** Demo/dev only: list of purchase categories for Quick Check UI. */
export const purchaseCategories: readonly PurchaseCategory[] = [
  "Raw Materials",
  "Equipment",
  "Office Supplies",
  "Services",
  "Utilities",
  "Marketing",
  "Transport",
  "Other",
] as const;

/** Demo/dev only: placeholder evaluator for Quick Check UI. No real tax logic. */
export function quickEvaluate(
  _itemName: string,
  _category: PurchaseCategory
): { status: "deductible" | "non_deductible" | "unknown"; reasonShort: string } {
  return {
    status: "unknown",
    reasonShort: "Demo only. Real rules apply per jurisdiction.",
  };
}
