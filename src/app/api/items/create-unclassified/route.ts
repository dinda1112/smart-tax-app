import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Generate a unique item_key for unclassified items.
 * Format: uncl_{timestamp}_{random} - ensures uniqueness.
 */
function generateItemKey(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `uncl_${ts}_${rand}`;
}

/**
 * Parse tags from array or comma-separated string. Trim, ignore empty.
 */
function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * POST /api/items/create-unclassified
 * Creates a new row in public.items with msic_code = NULL.
 * Accepts: name (required), tags (optional array or comma-separated string), language ("en"|"ms").
 * Auto-generates item_key. Stores name only for current UI language; other language left null.
 * Requires authenticated user.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const tags = parseTags(body.tags ?? body.notes ?? []);
    const lang = body.language === "ms" ? "ms" : "en";

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    const item_key = generateItemKey();

    // Store name only for current UI language; omit other language
    const name_i18n: Record<string, string> =
      lang === "ms"
        ? { ms: name }
        : { en: name };

    const { data, error } = await supabase
      .from("items")
      .insert({
        item_key,
        name_i18n,
        tags,
        msic_code: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("create-unclassified insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to insert item." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      item_key,
      message: "Item created. Run export script or wait for Sunday to generate CSV.",
    });
  } catch (err) {
    console.error("create-unclassified unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
