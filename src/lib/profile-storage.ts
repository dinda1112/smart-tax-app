import type { CompanySize, LanguageCode, ProfileFormData, SstStatus } from "./types";
import { getProfile as getProfileFromRepo, saveProfile as saveProfileToRepo } from "./profile-repo";

const VALID_COMPANY_SIZES: readonly CompanySize[] = ["micro", "small", "medium"];
const VALID_LANGUAGE_CODES: readonly LanguageCode[] = ["en", "ms", "iban", "zh"];
const VALID_SST_STATUSES: readonly SstStatus[] = ["yes", "no", "not_sure"];

const KEY_DATA = "taxapp_profile_data_v1";
const KEY_SAVED_AT = "taxapp_profile_saved_at_v1";
const KEY_MSIC_RECENT = "taxapp_msic_recent_v1";

function tryLoadCache(): { data: ProfileFormData | null; savedAt: string | null } {
  try {
    const cached = localStorage.getItem(KEY_DATA);
    const cachedSavedAt = localStorage.getItem(KEY_SAVED_AT);
    if (cached) return { data: JSON.parse(cached) as ProfileFormData, savedAt: cachedSavedAt };
  } catch {}
  return { data: null, savedAt: null };
}

function trySaveCache(data: ProfileFormData, savedAt: string | null) {
  try {
    localStorage.setItem(KEY_DATA, JSON.stringify(data));
    if (savedAt) localStorage.setItem(KEY_SAVED_AT, savedAt);
  } catch {}
}

/**
 * Load profile from Supabase (source of truth).
 * If not logged in or error, fallback to cached localStorage.
 */
export async function loadProfile(): Promise<{ data: ProfileFormData | null; savedAt: string | null }> {
  const cached = tryLoadCache();

  const row = await getProfileFromRepo();
  if (!row) {
    // Not logged in or no row → fallback to cache
    return cached;
  }

  const profile: ProfileFormData = {
    fullName: row.full_name || "",
    companyName: row.company_name || "",
    startYear: row.start_year ?? "",
    companySize: (VALID_COMPANY_SIZES.includes(row.company_size as CompanySize) ? row.company_size : "") as CompanySize | "",
    language: (VALID_LANGUAGE_CODES.includes(row.language as LanguageCode) ? row.language : "en") as LanguageCode,
    sstStatus: (VALID_SST_STATUSES.includes(row.sst_status as SstStatus) ? row.sst_status : "not_sure") as SstStatus,
    sstNumber: row.sst_number || "",
    sstEffectiveDate: row.sst_effective_date || "",
    msicCode: row.msic_code || "",
    msicTitle: row.msic_title || "",
    
    msicSection: "",
    msicDivision: "",
    msicGroup: "",
    msicClass: "",
  };

  const savedAt = row.updated_at || null;
  trySaveCache(profile, savedAt);

  return { data: profile, savedAt };
}

/**
 * Save profile to Supabase. Update cache only after successful save.
 */
export async function saveProfile(data: ProfileFormData): Promise<string> {
  const savedAt = await saveProfileToRepo(data);
  trySaveCache(data, savedAt);
  return savedAt;
}

export function loadRecentMsic(): string[] {
  try {
    const raw = localStorage.getItem(KEY_MSIC_RECENT);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentMsic(code: string) {
  const prev = loadRecentMsic();
  const next = [code, ...prev.filter((x) => x !== code)].slice(0, 5);
  localStorage.setItem(KEY_MSIC_RECENT, JSON.stringify(next));
  return next;
}
