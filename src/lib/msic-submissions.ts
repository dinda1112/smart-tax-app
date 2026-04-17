"use client";

import { createClient } from "@/lib/supabase/browser";

/**
 * Submit a manually entered MSIC code for admin review.
 * Inserts into `msic_submissions` with status = 'pending'.
 */
export async function submitMsicForReview(
  msicCode: string,
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("msic_submissions").insert({
      msic_code: msicCode.trim(),
      description: description.trim(),
      user_id: user.id,
      status: "pending",
    });

    if (error) {
      console.error("Failed to submit MSIC for review:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error submitting MSIC:", err);
    return { success: false, error: "Unexpected error" };
  }
}