import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dbMysql, schema } from "@/lib/db/mysql";
import { eq, or } from "drizzle-orm";
import { signJWT } from "@/lib/auth/jwt";

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const redirectToLogin = (errorCode: string) => {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("error", errorCode);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_redirect_to");
    return response;
  };

  // 1. Validar si Google retornó un error o el usuario canceló
  if (errorParam) {
    console.warn("Google OAuth retornó error:", errorParam);
    return redirectToLogin(errorParam === "access_denied" ? "google_access_denied" : "google_auth_failed");
  }

  // 2. Validar parámetros requeridos
  if (!code || !state) {
    return redirectToLogin("google_missing_code");
  }

  // 3. Validar state anti-CSRF
  const savedState = request.cookies.get("oauth_state")?.value;
  if (!savedState || savedState !== state) {
    console.error("State de OAuth inválido o ausente.");
    return redirectToLogin("google_invalid_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados.");
    return redirectToLogin("google_config_missing");
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // 4. Canjear el código de autorización por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Error al canjear token con Google:", errorData);
      return redirectToLogin("google_token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 5. Obtener los datos del perfil del usuario en Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("Error al obtener información de usuario desde Google.");
      return redirectToLogin("google_userinfo_failed");
    }

    const googleUser: GoogleUserInfo = await userinfoResponse.json();

    if (!googleUser.email) {
      return redirectToLogin("google_no_email");
    }

    const normalizedEmail = googleUser.email.trim().toLowerCase();

    // 6. Consultar / Sincronizar en MySQL
    const existingUser = await dbMysql.query.usuarios.findFirst({
      where: or(
        eq(schema.usuarios.googleId, googleUser.sub),
        eq(schema.usuarios.email, normalizedEmail)
      ),
    });

    let userId: number;
    let userNombre: string;
    let userEmail: string;
    let userRol: "SUPERADMIN" | "ADMIN" | "CAJERO" | "CLIENTE";
    let userAvatarUrl: string | null = googleUser.picture || null;

    if (existingUser) {
      if (!existingUser.activo) {
        return redirectToLogin("account_inactive");
      }

      userId = existingUser.id;
      userNombre = existingUser.nombre;
      userEmail = existingUser.email;
      userRol = existingUser.rol;
      userAvatarUrl = existingUser.avatarUrl || googleUser.picture || null;

      // Actualizar googleId o avatar si faltaban
      await dbMysql
        .update(schema.usuarios)
        .set({
          googleId: googleUser.sub,
          avatarUrl: userAvatarUrl,
        })
        .where(eq(schema.usuarios.id, existingUser.id));
    } else {
      // Registrar nuevo usuario con rol CLIENTE por defecto
      userNombre = googleUser.name || normalizedEmail.split("@")[0];
      userEmail = normalizedEmail;
      userRol = "CLIENTE";

      const [inserted] = await dbMysql.insert(schema.usuarios).values({
        nombre: userNombre,
        email: userEmail,
        googleId: googleUser.sub,
        avatarUrl: userAvatarUrl,
        rol: userRol,
        activo: true,
      });

      userId = Number(inserted.insertId);
    }

    // 7. Generar JWT firmado con jose
    const token = await signJWT({
      id: userId,
      nombre: userNombre,
      email: userEmail,
      rol: userRol,
      avatarUrl: userAvatarUrl,
    });

    // 8. Determinar ruta de destino según RBAC
    // Si es CLIENTE -> redirigir a inicio (/)
    // Si es STAFF (SUPERADMIN, ADMIN, CAJERO) -> redirigir a /dashboard o ruta solicitada
    let targetPath = "/";
    if (userRol !== "CLIENTE") {
      const rawRedirect = request.cookies.get("oauth_redirect_to")?.value;
      targetPath = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/dashboard";
    }
    const finalUrl = new URL(targetPath, baseUrl);

    const response = NextResponse.redirect(finalUrl);

    // 9. Establecer cookie HttpOnly con la sesión
    const isSecure = process.env.NODE_ENV === "production";
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    // Limpiar cookies de estado temporal
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_redirect_to");

    return response;
  } catch (error) {
    console.error("Excepción inesperada en Google Callback:", error);
    return redirectToLogin("google_server_error");
  }
}
