import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "megalider_super_secret_jwt_key_2026_x7a9q";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth_token")?.value;

  let userRole: string | null = null;
  let isAuthenticated = false;

  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, secretKey);
      isAuthenticated = true;
      userRole = (payload.rol as string) || null;
    } catch {
      isAuthenticated = false;
      userRole = null;
    }
  }

  const isProtectedAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/contabilidad") ||
    pathname.startsWith("/hermes-logs") ||
    pathname.startsWith("/catalogo") ||
    pathname.startsWith("/usuarios");

  // 1. Redirigir a login si intenta ingresar a una ruta administrativa sin sesión
  if (isProtectedAdminRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si es un CLIENTE e intenta ingresar a rutas administrativas protegidas, redirigir a inicio
  if (isProtectedAdminRoute && isAuthenticated && userRole === "CLIENTE") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Si ya está autenticado e intenta ir a /login o /register:
  // - Si es CLIENTE -> redirigir a inicio (/)
  // - Si es STAFF (SUPERADMIN, ADMIN, CAJERO) -> redirigir a /dashboard
  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    const destination = userRole === "CLIENTE" ? "/" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
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
    "/register",
  ],
};
