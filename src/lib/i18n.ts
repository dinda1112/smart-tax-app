import type { LanguageCode } from "./types";

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
