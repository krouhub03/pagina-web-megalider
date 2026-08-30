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

  let response: NextResponse;

  // 1. Redirigir a login si intenta ingresar a una ruta administrativa sin sesión
  if (isProtectedAdminRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    response = NextResponse.redirect(loginUrl);
  }
  // 2. Si es un CLIENTE e intenta ingresar a rutas administrativas protegidas, redirigir a inicio
  else if (isProtectedAdminRoute && isAuthenticated && userRole === "CLIENTE") {
    response = NextResponse.redirect(new URL("/", request.url));
  }
  // 3. Si ya está autenticado e intenta ir a /login o /register:
  else if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    const destination = userRole === "CLIENTE" ? "/" : "/dashboard";
    response = NextResponse.redirect(new URL(destination, request.url));
  }
  // 4. Continuar normalmente
  else {
    response = NextResponse.next();
  }

  // 🛡️ SECURITY HEADERS (OWASP Best Practices)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
