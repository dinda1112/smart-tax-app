"use client";

import { createClient } from "@/lib/supabase/browser";

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error";
  const err = error as { message?: string; code?: string; details?: string };
  return err.message || err.code || JSON.stringify(err) || "Unknown Supabase error";
}

export type SstRateResult = {
  sst_percent: number;
  explanation_i18n: Record<string, string>;
} | null;

/**
 * Call the Supabase RPC function get_sst_rate
 * Only passes p_item_key and p_invoice_required: null
 * Returns result with sst_percent and explanation_i18n, or null if not found
 */
export async function getSstRateRPC(
  itemKey: string
): Promise<SstRateResult> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_sst_rate", {
      p_item_key: itemKey,
      p_invoice_required: null,
    });

    if (error) {
      console.error("get_sst_rate RPC error:", formatSupabaseError(error));
      return null;
    }

    // Handle case where RPC returns null or empty result
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    // RPC should return array with one object or a single object
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result || result.sst_percent === null || result.sst_percent === undefined) {
      return null;
    }

    return {
      sst_percent: Number(result.sst_percent),
      explanation_i18n: result.explanation_i18n || {},
    };
  } catch (error) {
    console.error("getSstRateRPC exception:", error);
    return null;
  }
}
