import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "megalider_super_secret_jwt_key_2026_x7a9q";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  let isAuthenticated = false;
  if (authToken) {
    try {
      await jwtVerify(authToken, secretKey);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isProtectedAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/contabilidad") ||
    pathname.startsWith("/hermes-logs") ||
    pathname.startsWith("/catalogo") ||
    pathname.startsWith("/usuarios");

  // 1. Redirigir a login si intenta ingresar a una ruta protegida sin sesión
  if (isProtectedAdminRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya está autenticado e intenta ir a /login, redirigir a /dashboard
  if (pathname === "/login" && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/contabilidad/:path*",
    "/hermes-logs/:path*",
    "/catalogo/:path*",
    "/usuarios/:path*",
    "/login",
  ],
};
