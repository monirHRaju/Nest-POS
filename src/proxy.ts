import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/forgot-password"];
const alwaysPublic = ["/api/auth", "/api/webhooks"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (alwaysPublic.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // NextAuth v5 cookie name. HTTPS prefixes with "__Secure-" automatically via secureCookie option.
  const isSecure = request.nextUrl.protocol === "https:";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName,
    secureCookie: isSecure,
    salt: cookieName,
  });

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isSuperAdminRoute = pathname.startsWith("/super-admin");

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicRoute) {
    const dest = token.isSuperAdmin ? "/super-admin" : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isSuperAdminRoute && token && !token.isSuperAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isSuperAdminRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
