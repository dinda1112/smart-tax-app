import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/items/create-unclassified
 * Creates a new row in public.items with msic_code = NULL.
 * Requires authenticated user (TODO: add admin role check if profiles.is_admin exists).
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

    // TODO: If profiles table has is_admin/role, check it here for admin-only access.

    const body = await request.json();
    const item_key = typeof body.item_key === "string" ? body.item_key.trim() : "";
    const name_en = typeof body.name_en === "string" ? body.name_en.trim() : "";
    const name_ms = typeof body.name_ms === "string" ? body.name_ms.trim() : null;
    const tagsRaw = body.tags;

    if (!item_key) {
      return NextResponse.json(
        { error: "item_key is required and must be non-empty." },
        { status: 400 }
      );
    }
    if (!name_en) {
      return NextResponse.json(
        { error: "name_en is required and must be non-empty." },
        { status: 400 }
      );
    }

    // Parse tags: comma-separated string or array of strings
    let tags: string[] = [];
    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    } else if (typeof tagsRaw === "string") {
      tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const name_i18n: Record<string, string> = {
      en: name_en,
      ms: name_ms || name_en,
    };

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
