import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "megalider_super_secret_jwt_key_2026_x7a9q";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface UserSessionPayload {
  id: number;
  nombre: string;
  email: string;
  rol: "SUPERADMIN" | "ADMIN" | "CAJERO" | "CLIENTE";
  avatarUrl?: string | null;
}

// 1. Firmar Token JWT
export async function signJWT(payload: UserSessionPayload, expiresIn = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

// 2. Verificar Token JWT
export async function verifyJWT(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

// 3. Obtener sesión activa desde las Cookies (Server Side)
export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyJWT(token);
}
