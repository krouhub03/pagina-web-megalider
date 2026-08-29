"use server";

import { dbMysql, schema } from "@/lib/db/mysql";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export async function loginWithCredentials(formData: FormData): Promise<LoginResponse> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Por favor ingresa tu correo y contraseña." };
  }

  try {
    // 1. Buscar usuario en MySQL
    const user = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, email),
    });

    if (!user) {
      return { success: false, message: "Credenciales inválidas o usuario no registrado." };
    }

    if (!user.activo) {
      return { success: false, message: "Esta cuenta se encuentra inactiva. Contacta al administrador." };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        message: "Esta cuenta está registrada con Google. Por favor inicia sesión con Google.",
      };
    }

    // 2. Validar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValida) {
      return { success: false, message: "Credenciales inválidas. Verifica tu contraseña." };
    }

    // 3. Generar JWT firmado
    const token = await signJWT({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      avatarUrl: user.avatarUrl,
    });

    // 4. Guardar token en Cookie HttpOnly
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return {
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    };
  } catch (error: unknown) {
    console.error("Error en loginWithCredentials:", error);
    return {
      success: false,
      message: "Error de conexión con el servidor. Verifica que la base de datos MySQL esté disponible.",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}
