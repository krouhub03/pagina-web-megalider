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

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export async function registerUserAction(formData: FormData): Promise<RegisterResponse> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const aceptaPoliticas = formData.get("aceptaPoliticas");
  const captchaToken = formData.get("captchaToken") as string;

  // 1. Validar campos requeridos
  if (!nombre || nombre.length < 2) {
    return { success: false, message: "Por favor ingresa tu nombre completo (mínimo 2 caracteres)." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, message: "Por favor ingresa un correo electrónico válido." };
  }

  if (!password || password.length < 8) {
    return { success: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Las contraseñas no coinciden. Por favor verifícalas." };
  }

  if (!aceptaPoliticas || (aceptaPoliticas !== "true" && aceptaPoliticas !== "on")) {
    return {
      success: false,
      message: "Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos para registrarte.",
    };
  }

  // 2. Validar reCAPTCHA
  const { verifyRecaptchaToken } = await import("@/lib/auth/recaptcha");
  const captchaResult = await verifyRecaptchaToken(captchaToken);
  if (!captchaResult.success) {
    return { success: false, message: captchaResult.message || "Error en la verificación de seguridad." };
  }

  try {
    // 3. Verificar si el correo ya existe
    const existingUser = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, email),
    });

    if (existingUser) {
      return {
        success: false,
        message: "Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.",
      };
    }

    // 4. Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Crear usuario con rol CLIENTE por defecto
    const [inserted] = await dbMysql.insert(schema.usuarios).values({
      nombre,
      email,
      passwordHash,
      rol: "CLIENTE",
      activo: true,
    });

    const newUserId = Number(inserted.insertId);

    // 6. Generar JWT firmado
    const token = await signJWT({
      id: newUserId,
      nombre,
      email,
      rol: "CLIENTE",
      avatarUrl: null,
    });

    // 7. Guardar cookie de sesión HttpOnly
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
        id: newUserId,
        nombre,
        email,
        rol: "CLIENTE",
      },
    };
  } catch (error: unknown) {
    console.error("Error en registerUserAction:", error);
    return {
      success: false,
      message: "No se pudo completar el registro. Verifica la conexión a la base de datos MySQL.",
    };
  }
}
