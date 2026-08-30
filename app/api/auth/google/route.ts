import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateRedirectUri } from "@/lib/api/security";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID no está configurado en las variables de entorno.");
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("error", "google_config_missing");
    return NextResponse.redirect(loginUrl);
  }

  // Generar un state seguro para mitigar ataques CSRF
  const state = crypto.randomUUID();
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Capturar y sanitizar ruta de retorno opcional
  const rawFrom = request.nextUrl.searchParams.get("from") || "/dashboard";
  const { safePath } = validateRedirectUri(rawFrom);

  // Construir la URL de autorización de Google OAuth 2.0
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleAuthUrl);

  const isSecure = process.env.NODE_ENV === "production";

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutos
  });

  response.cookies.set("oauth_redirect_to", safePath, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
