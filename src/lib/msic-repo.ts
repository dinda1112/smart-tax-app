"use client";

import type { LanguageCode, MsicClass } from "./types";
import { createClient } from "@/lib/supabase/browser";

type MsicCodeRow = {
  msic_code: string | null;
  msic_name: string | null;
  msic_name_i18n: Partial<Record<LanguageCode, string>> | null;

  section_code: string | null;
  section_name: string | null;

  division_code: string | null;
  division_name: string | null;

  group_code: string | null;
  group_name: string | null;

  class_code: string | null;
  class_name: string | null;
};

const MSIC_CODES_SELECT = [
  "msic_code",
  "msic_name",
  "msic_name_i18n",
  "section_code",
  "section_name",
  "division_code",
  "division_name",
  "group_code",
  "group_name",
  "class_code",
  "class_name",
].join(",");

/**
 * Search MSIC codes by query string.
 * - If query is empty → return []
 * - If query contains digits only → search by msic_code startsWith (like query%) and order by msic_code
 * - Else → search by msic_name ilike %query%
 */
export async function searchMsic(query: string, limit = 12): Promise<MsicClass[]> {
  if (!query.trim()) {
    return [];
  }

  const supabase = createClient();
  const trimmedQuery = query.trim();

  // Check if query contains only digits
  const isDigitsOnly = /^\d+$/.test(trimmedQuery);

  let queryBuilder;

  if (isDigitsOnly) {
    // Search by code startsWith and order by msic_code
    queryBuilder = supabase
      .from("msic_codes")
      .select(MSIC_CODES_SELECT)
      .like("msic_code", `${trimmedQuery}%`)
      .order("msic_code", { ascending: true })
      .limit(limit);
  } else {
    // Search by name ilike
    queryBuilder = supabase
      .from("msic_codes")
      .select(MSIC_CODES_SELECT)
      .ilike("msic_name", `%${trimmedQuery}%`)
      .limit(limit);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching MSIC codes:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map database rows to MsicClass type
  return (data as MsicCodeRow[]).map(mapDbRowToMsicClass);
}

/**
 * Get a single MSIC code by code.
 */
export async function getMsicByCode(code: string): Promise<MsicClass | null> {
  if (!code.trim()) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("msic_codes")
    .select(MSIC_CODES_SELECT)
    .eq("msic_code", code.trim())
    .single();

  if (error) {
    console.error("Error fetching MSIC code:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapDbRowToMsicClass(data as MsicCodeRow);
}

/**
 * Map database row to MsicClass type.
 * Assumes database columns in msic_codes:
 * - msic_code, msic_name, msic_name_i18n
 * - section_code, section_name
 * - division_code, division_name
 * - group_code, group_name
 * - class_code, class_name
 */
function mapDbRowToMsicClass(row: MsicCodeRow): MsicClass {
  const code = (row.msic_code ?? "").toString();
  const msicName = (row.msic_name ?? "").toString();
  const canonicalName = (msicName || code).trim();

  return {
    code: code.trim(),
    msic_name: canonicalName,
    msic_name_i18n: row.msic_name_i18n || null,
    // Keep `title` canonical (never localized) for backward compatibility
    title: canonicalName,
    section: {
      code: row.section_code || "",
      title: row.section_name || "",
    },
    division: {
      code: row.division_code || "",
      title: row.division_name || "",
    },
    group: {
      code: row.group_code || "",
      title: row.group_name || "",
    },
    class: {
      code: row.class_code || row.msic_code || "",
      title: row.class_name || row.msic_name || "",
    },
    keywords: [], // Database might not have keywords, empty for now
  };
}





