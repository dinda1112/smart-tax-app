import { createClient } from "@/lib/supabase/browser";
import type { LanguageCode } from "@/lib/types";

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error";
  const err = error as { message?: string; code?: string; details?: string };
  return err.message || err.code || JSON.stringify(err) || "Unknown Supabase error";
}

export type Item = {
  id?: string;
  item_key: string;
  name_i18n: Record<LanguageCode, string>;
  tags: string[];
  msic_code?: string | null;
  updated_at?: string | null;
};

/**
 * Fetch distinct tags from public.items.tags
 * Returns an array of unique tag strings, sorted alphabetically
 */
export async function getDistinctTags(): Promise<string[]> {
  try {
    const supabase = createClient();
    
    // Fetch all items with tags
    const { data, error } = await supabase
      .from("items")
      .select("tags");

    if (error) {
      console.error("Error fetching items tags:", formatSupabaseError(error));
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extract all tags and flatten the array
    const allTags: string[] = [];
    data.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        allTags.push(...item.tags);
      }
    });

    // Get distinct tags, filter out empty/null values, and sort
    const distinctTags = Array.from(new Set(allTags))
      .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
      .sort();

    return distinctTags;
  } catch (error) {
    console.error("Error in getDistinctTags:", error);
    return [];
  }
}

/**
 * Search items by tag with localized names
 * Returns items with item_key, name_i18n (localized), and tags
 */
export async function searchItemsByTag(tag: string, lang: LanguageCode = "en"): Promise<Item[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("items")
      .select("item_key, name_i18n, tags")
      .contains("tags", [tag]);

    if (error) {
      console.error("Error fetching items by tag:", formatSupabaseError(error));
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Return items with localized names
    return data.map((item) => ({
      ...item,
      name_i18n: item.name_i18n || {},
    })) as Item[];
  } catch (error) {
    console.error("Error in searchItemsByTag:", error);
    return [];
  }
}

/**
 * Find item by item_key (case-insensitive)
 * Note: MSIC filtering removed as msic_codes column doesn't exist in items table
 * If MSIC filtering is needed, it should be implemented via a join or separate table
 */
export async function findItemByKeyAndMsic(itemKey: string, msicCode: string): Promise<Item | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("items")
      .select("item_key, name_i18n, tags")
      .ilike("item_key", itemKey)
      .limit(1)
      .single();

    if (error) {
      // Item not found
      return null;
    }

    // Note: MSIC filtering removed as msic_codes column doesn't exist in items table
    // If MSIC filtering is needed, it should be implemented via a join or separate table

    return data as Item;
  } catch (error) {
    console.error("Error in findItemByKeyAndMsic:", error);
    return null;
  }
}

/**
 * Fetch items filtered by user's MSIC code
 * Returns items with item_key, name_i18n (localized), filtered by items.msic_code = user's MSIC
 */
export async function getItemsByMsicCode(
  msicCode: string,
  lang: LanguageCode = "en"
): Promise<Item[]> {
  try {
    const supabase = createClient();
    
    if (!msicCode) {
      return [];
    }

    const { data, error } = await supabase
      .from("items")
      .select("item_key, name_i18n, msic_code")
      .eq("msic_code", msicCode)
      .order("item_key");

    if (error) {
      console.error("Error fetching items by MSIC:", formatSupabaseError(error));
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Return items with localized names
    return data.map((item) => ({
      item_key: item.item_key,
      name_i18n: item.name_i18n || {},
      tags: [], // Not needed for this use case
      msic_code: item.msic_code,
    })) as Item[];
  } catch (error) {
    console.error("Error in getItemsByMsicCode:", error);
    return [];
  }
}

/**
 * Search items by query string (item_key or name_i18n)
 * Returns items with item_key, name_i18n, and msic_code
 */
export async function searchItemsByQuery(
  query: string,
  lang: LanguageCode = "en",
  limit = 10
): Promise<Item[]> {
  try {
    const supabase = createClient();
    
    if (!query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim();
    
    // Search by item_key ilike and name_i18n (en/ms) ilike
    // Using OR conditions: item_key ilike OR name_i18n->>'en' ilike OR name_i18n->>'ms' ilike
    const { data, error } = await supabase
      .from("items")
      .select("id, item_key, name_i18n, tags, msic_code, updated_at")
      .or(`item_key.ilike.%${trimmedQuery}%,name_i18n->>en.ilike.%${trimmedQuery}%,name_i18n->>ms.ilike.%${trimmedQuery}%`)
      .limit(limit)
      .order("item_key");

    if (error) {
      console.error("Error searching items:", formatSupabaseError(error));
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      id: (item as any).id,
      item_key: (item as any).item_key,
      name_i18n: (item as any).name_i18n || {},
      tags: Array.isArray((item as any).tags) ? (item as any).tags : [],
      msic_code: (item as any).msic_code,
      updated_at: (item as any).updated_at ?? null,
    })) as Item[];
  } catch (error) {
    console.error("Error in searchItemsByQuery:", error);
    return [];
  }
}