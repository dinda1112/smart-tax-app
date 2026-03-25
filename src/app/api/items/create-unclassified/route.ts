import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Normalize item name to a slug-like key (e.g. "Glue Stick" -> "glue-stick").
 */
function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
 * Merge tags, deduped, preserving order of first occurrence.
 */
function mergeTags(existing: string[] | null | undefined, incoming: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of existing ?? []) {
    const k = t.toLowerCase().trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(t.trim());
    }
  }
  for (const t of incoming) {
    const k = t.toLowerCase().trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(t.trim());
    }
  }
  return out;
}

/**
 * POST /api/items/create-unclassified
 * Upserts a row in public.items with msic_code = NULL.
 * item_key = normalizeKey(name). If an unclassified row exists for that key,
 * merges name_i18n and tags instead of inserting a duplicate.
 * Accepts: name (required), tags (optional), language ("en"|"ms").
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

    const item_key = normalizeKey(name);
    if (!item_key) {
      return NextResponse.json(
        { error: "Item name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    const name_i18n: Record<string, string> =
      lang === "ms" ? { ms: name } : { en: name };

    // Select existing unclassified row by normalized key (unique on item_key_norm where msic_code is null)
    const { data: existing } = await supabase
      .from("items")
      .select("id, name_i18n, tags")
      .eq("item_key_norm", item_key)
      .is("msic_code", null)
      .maybeSingle();

    if (existing) {
      const merged_name_i18n = {
        ...(typeof existing.name_i18n === "object" && existing.name_i18n !== null
          ? (existing.name_i18n as Record<string, string>)
          : {}),
        ...name_i18n,
      };
      const merged_tags = mergeTags(
        Array.isArray(existing.tags) ? existing.tags : [],
        tags
      );

      const { data: updated, error } = await supabase
        .from("items")
        .update({
          name_i18n: merged_name_i18n,
          tags: merged_tags,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) {
        console.error("create-unclassified update error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to update item." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        id: updated?.id,
        item_key,
        message: "Item updated. Run export script or wait for Sunday to generate CSV.",
      });
    }

    const { data: inserted, error } = await supabase
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
      // Handle unique constraint violation (e.g. concurrent insert or item_key_norm conflict)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An unclassified item with this name already exists." },
          { status: 409 }
        );
      }
      console.error("create-unclassified insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to insert item." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: inserted?.id,
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
