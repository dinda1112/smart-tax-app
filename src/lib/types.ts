export type LanguageCode = "en" | "ms" | "iban" | "zh";

export type CompanySize = "micro" | "small" | "small_500" | "medium";

export type SstStatus = "yes" | "no" | "not_sure";

export type DeductibleStatus = "deductible" | "non_deductible" | "unknown";

export type PurchaseCategory =
  | "Raw Materials"
  | "Equipment"
  | "Office Supplies"
  | "Services"
  | "Utilities"
  | "Marketing"
  | "Transport"
  | "Other";

export type TaxCheck = {
  id: string;
  itemName: string;
  category: PurchaseCategory;
  status: DeductibleStatus;
  reasonShort: string;
  checkedAtISO: string;
};

export type BusinessProfile = {
  businessName: string;
  industry: string;
  sstRegistered: boolean;
  preferredLanguage: LanguageCode;
};

export type MsicClass = {
  code: string; // class code e.g. "41002"
  /** Canonical (English) MSIC name from `msic_codes.msic_name` */
  msic_name: string;
  /** Localized MSIC name object from `msic_codes.msic_name_i18n` (jsonb) */
  msic_name_i18n: Partial<Record<LanguageCode, string>> | null;
  /**
   * @deprecated Use `msic_name` (canonical English name). Kept for backward compatibility.
   * Never store localized strings here.
   */
  title: string;

  section: { code: string; title: string }; // e.g. F — Construction
  division: { code: string; title: string }; // e.g. 41 — Construction of Buildings
  group: { code: string; title: string }; // e.g. 410 — Construction of Buildings
  class: { code: string; title: string }; // same as code/title (explicit)
  keywords: string[];
};

export type ProfileFormData = {
  fullName: string;
  companyName: string;
  startYear: number | "";
  companySize: CompanySize | "";

  msicCode: string;
  msicTitle: string;

  // auto-derived (read-only in UI)
  msicSection: string;
  msicDivision: string;
  msicGroup: string;
  msicClass: string;

  sstStatus: SstStatus;
  sstNumber: string;
  sstEffectiveDate: string;

  language: LanguageCode;
};
