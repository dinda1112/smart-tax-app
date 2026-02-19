import type { LanguageCode } from "./types";

/**
 * Get item display name from name_i18n based on current UI language.
 * - Malay: name_i18n.ms when present; else fallback to name_i18n.en
 * - English: name_i18n.en; fallback to name_i18n.ms only when English is missing
 */
export function getItemDisplayName(
  item: { item_key: string; name_i18n?: Partial<Record<string, string>> | null },
  currentLang: LanguageCode
): string {
  const i18n = item.name_i18n || {};
  if (currentLang === "ms") {
    const ms = i18n.ms?.trim();
    return ms ? i18n.ms! : (i18n.en || item.item_key);
  }
  const en = i18n.en?.trim();
  return en ? i18n.en! : (i18n.ms || item.item_key);
}

/**
 * Get localized text from an i18n object with fallback to 'en'
 * @param i18nObject - Object with language codes as keys
 * @param currentLang - Current language code
 * @returns Localized text or fallback to 'en'
 */
export function getLocalizedText(
  i18nObject: Partial<Record<LanguageCode, string>> | null | undefined,
  currentLang: LanguageCode
): string {
  if (!i18nObject) {
    return "";
  }

  // Try current language first
  if (i18nObject[currentLang]) {
    return i18nObject[currentLang];
  }

  // Fallback to 'en'
  if (i18nObject.en) {
    return i18nObject.en;
  }

  // If 'en' is also missing, return the first available value
  const values = Object.values(i18nObject);
  return values.length > 0 ? values[0] : "";
}
