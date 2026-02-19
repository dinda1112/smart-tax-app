import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Always public - never require session. pathname.startsWith("/auth/") covers login, signup, callback, reset-password.
const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/callback", "/auth/reset-password", "/reset-password", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check on public auth routes (no getUser) to avoid AuthSessionMissingError before session exists
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) || pathname.startsWith("/auth/");
  if (isPublicAuthRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token (safe: session may be missing during initial load/hydration/navigation)
  // Never crash middleware on missing session; treat as unauthenticated.
  let user: any = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Keep it non-fatal; missing session should not surface as a red overlay.
      console.warn("middleware: supabase.auth.getUser() error:", error.message);
    }
    user = data?.user ?? null;
  } catch (err: any) {
    console.warn("middleware: supabase.auth.getUser() threw:", err?.message ?? err);
    user = null;
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/setup/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname.startsWith("/admin/");

  // If accessing a protected route without a user, redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

