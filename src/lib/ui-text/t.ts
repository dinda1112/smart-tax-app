import { en } from "./en";
import { ms } from "./ms";

type Language = "en" | "ms";

const dictionaries: Record<Language, typeof en> = {
  en,
  ms,
};

const warnedMissing = new Set<string>();

/**
 * Translation helper function
 * @param language - The language code ("en" | "ms")
 * @param key - The translation key (e.g., "account.title" or "account.settings.language")
 * @param params - Optional parameters to replace placeholders like {email}
 * @returns The translated string, or English fallback if key is missing
 */
export function t(language: Language, key: string, params?: Record<string, string>): string {
  const dict = dictionaries[language] || dictionaries.en;
  
  // Navigate through nested object using the dot-notation key
  const keys = key.split(".");
  let value: any = dict;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      if (process.env.NODE_ENV !== "production" && language !== "en") {
        const warnKey = `${language}:${key}`;
        if (!warnedMissing.has(warnKey)) {
          warnedMissing.add(warnKey);
          // eslint-disable-next-line no-console
          console.warn(`Missing translation (${language}): ${key}`);
        }
      }
      // Fallback to English if key is missing
      value = dictionaries.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === "object" && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return the key itself if even English doesn't have it
        }
      }
      break;
    }
  }
  
  let result = typeof value === "string" ? value : key;
  
  // Replace placeholders if params provided
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), paramValue);
    }
  }
  
  return result;
}
