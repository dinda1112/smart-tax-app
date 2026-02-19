"use client";

import type { ProfileFormData } from "./types";
import { createClient } from "@/lib/supabase/browser";

export type ProfileRow = {
  id: string;

  email?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  start_year?: number | null;
  company_size?: string | null;
  language?: string | null;

  sst_status?: string | null;
  sst_number?: string | null;
  sst_effective_date?: string | null;

  msic_code?: string | null;

  updated_at?: string | null;
};

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;

  if (userErr || !userId) {
    console.error("getProfile: no authenticated user", userErr);
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    });
    return null;
  }

  return (data as ProfileRow) ?? null;
}

/**
 * Key fix:
 * - DO NOT send null/"" for fields that the current page didn't edit
 * - Otherwise, later steps overwrite earlier saved values with null
 */
export async function saveProfile(form: ProfileFormData): Promise<string> {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userRes?.user;

  if (userErr || !user) {
    throw new Error("Not authenticated");
  }

  // Build payload as PARTIAL update (only include fields that are actually filled)
  const payload: ProfileRow = {
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  };

  // Only set if non-empty, otherwise DON'T include the column at all
  if (form.fullName?.trim()) payload.full_name = form.fullName.trim();
  payload.company_name = form.companyName?.trim() || null;
  if (form.companySize?.trim()) payload.company_size = form.companySize.trim();

  // start_year: only include if provided
  if (form.startYear !== "" && form.startYear !== null && form.startYear !== undefined) {
    const n = Number(form.startYear);
    if (!Number.isNaN(n)) payload.start_year = n;
  }

  // language: only include if provided (don't force "en" and accidentally override)
  if (form.language?.trim()) payload.language = form.language.trim();

  // SST: only include if provided
  if (form.sstStatus?.trim()) payload.sst_status = form.sstStatus.trim();
  if (form.sstNumber?.trim()) payload.sst_number = form.sstNumber.trim();
  if (form.sstEffectiveDate?.trim()) payload.sst_effective_date = form.sstEffectiveDate.trim();

  // MSIC: only include if provided
  if (form.msicCode?.trim()) payload.msic_code = form.msicCode.trim();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("updated_at")
    .single();

  if (error) {
    console.error("saveProfile error:", {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
      payload, // IMPORTANT: so you see exactly what got sent
    });
    throw new Error(error.message);
  }

  return data?.updated_at ?? new Date().toISOString();
}
