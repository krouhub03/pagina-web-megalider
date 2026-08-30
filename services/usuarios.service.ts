"use server";

import { dbMysql, schema } from "@/lib/db/mysql";
import { eq, desc, count, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export type UserRole = "SUPERADMIN" | "ADMIN" | "CLIENTE";

export interface UserItem {
  id: number;
  nombre: string;
  email: string;
  googleId: string | null;
  avatarUrl: string | null;
  rol: UserRole;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  tienePassword: boolean;
}

export interface UsuariosResponse {
  success: boolean;
  message?: string;
  data: UserItem[];
  stats: {
    total: number;
    staff: number;
    clientes: number;
    bloqueados: number;
  };
}

export interface GenericActionResponse {
  success: boolean;
  message: string;
}

// 1. Obtener listado completo de usuarios y estadísticas
export async function getUsuarios(): Promise<UsuariosResponse> {
  const session = await getSession();
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.rol)) {
    return {
      success: false,
      message: "No tienes permisos para consultar la gestión de usuarios.",
      data: [],
      stats: { total: 0, staff: 0, clientes: 0, bloqueados: 0 },
    };
  }

  try {
    const records = await dbMysql.query.usuarios.findMany({
      orderBy: [desc(schema.usuarios.creadoEn)],
    });

    const data: UserItem[] = records.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      googleId: u.googleId,
      avatarUrl: u.avatarUrl,
      rol: u.rol as UserRole,
      activo: Boolean(u.activo),
      creadoEn: u.creadoEn,
      actualizadoEn: u.actualizadoEn,
      tienePassword: Boolean(u.passwordHash),
    }));

    const stats = {
      total: data.length,
      staff: data.filter((u) => u.rol === "SUPERADMIN" || u.rol === "ADMIN").length,
      clientes: data.filter((u) => u.rol === "CLIENTE").length,
      bloqueados: data.filter((u) => !u.activo).length,
    };

    return {
      success: true,
      data,
      stats,
    };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return {
      success: false,
      message: "Error de conexión con la base de datos MySQL.",
      data: [],
      stats: { total: 0, staff: 0, clientes: 0, bloqueados: 0 },
    };
  }
}

// 2. Alternar estado activo / bloqueado
export async function toggleUserStatusAction(
  userId: number,
  nuevoEstado: boolean
): Promise<GenericActionResponse> {
  const session = await getSession();
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.rol)) {
    return {
      success: false,
      message: "No tienes autorización para realizar esta acción.",
    };
  }

  // Prevenir auto-bloqueo
  if (session.id === userId) {
    return {
      success: false,
      message: "No puedes bloquear tu propia cuenta mientras estás en sesión activa.",
    };
  }

  try {
    const targetUser = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.id, userId),
    });

    if (!targetUser) {
      return { success: false, message: "El usuario no fue encontrado." };
    }

    // Si es ADMIN intentando alterar a un SUPERADMIN, rechazar
    if (targetUser.rol === "SUPERADMIN" && session.rol !== "SUPERADMIN") {
      return {
        success: false,
        message: "Solo un Superadministrador puede modificar el estado de otro Superadministrador.",
      };
    }

    // Si se va a bloquear un SUPERADMIN, asegurar que quede al menos uno activo
    if (targetUser.rol === "SUPERADMIN" && !nuevoEstado) {
      const [{ activeSuperadmins }] = await dbMysql
        .select({ activeSuperadmins: count() })
        .from(schema.usuarios)
        .where(
          and(
            eq(schema.usuarios.rol, "SUPERADMIN"),
            eq(schema.usuarios.activo, true)
          )
        );

      if (activeSuperadmins <= 1) {
        return {
          success: false,
          message: "No puedes desactivar al único Superadministrador activo del sistema.",
        };
      }
    }

    await dbMysql
      .update(schema.usuarios)
      .set({ activo: nuevoEstado })
      .where(eq(schema.usuarios.id, userId));

    revalidatePath("/usuarios");
    return {
      success: true,
      message: nuevoEstado
        ? `La cuenta de ${targetUser.nombre} ha sido reactivada con éxito.`
        : `La cuenta de ${targetUser.nombre} ha sido bloqueada. El usuario no podrá acceder al sistema.`,
    };
  } catch (error) {
    console.error("Error en toggleUserStatusAction:", error);
    return {
      success: false,
      message: "Ocurrió un error al actualizar el estado del usuario.",
    };
  }
}

// 3. Modificar Rol de Usuario (SUPERADMIN, ADMIN, CLIENTE)
export async function updateUserRoleAction(
  userId: number,
  nuevoRol: UserRole
): Promise<GenericActionResponse> {
  const session = await getSession();
  if (!session || session.rol !== "SUPERADMIN") {
    return {
      success: false,
      message: "Solo los Superadministradores tienen permisos para cambiar roles de usuario.",
    };
  }

  try {
    const targetUser = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.id, userId),
    });

    if (!targetUser) {
      return { success: false, message: "El usuario no existe." };
    }

    // Si se degrada a un SUPERADMIN, asegurar que quede al menos otro activo
    if (targetUser.rol === "SUPERADMIN" && nuevoRol !== "SUPERADMIN") {
      const [{ countSuperadmins }] = await dbMysql
        .select({ countSuperadmins: count() })
        .from(schema.usuarios)
        .where(eq(schema.usuarios.rol, "SUPERADMIN"));

      if (countSuperadmins <= 1) {
        return {
          success: false,
          message: "No puedes degradar al único Superadministrador del sistema.",
        };
      }
    }

    await dbMysql
      .update(schema.usuarios)
      .set({ rol: nuevoRol })
      .where(eq(schema.usuarios.id, userId));

    revalidatePath("/usuarios");
    return {
      success: true,
      message: `El rol de ${targetUser.nombre} ha sido actualizado a ${nuevoRol}.`,
    };
  } catch (error) {
    console.error("Error en updateUserRoleAction:", error);
    return {
      success: false,
      message: "Ocurrió un error al actualizar el rol del usuario.",
    };
  }
}

// 4. Crear nuevo usuario administrativo interno (ADMIN o SUPERADMIN)
export async function createStaffUserAction(
  formData: FormData
): Promise<GenericActionResponse> {
  const session = await getSession();
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.rol)) {
    return {
      success: false,
      message: "No tienes autorización para registrar usuarios administrativos.",
    };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const rol = (formData.get("rol") as UserRole) || "ADMIN";

  if (!nombre || nombre.length < 2) {
    return { success: false, message: "El nombre debe tener al menos 2 caracteres." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, message: "Por favor ingresa un correo electrónico válido." };
  }

  if (!password || password.length < 8) {
    return { success: false, message: "La contraseña inicial debe tener al menos 8 caracteres." };
  }

  if (rol === "SUPERADMIN" && session.rol !== "SUPERADMIN") {
    return {
      success: false,
      message: "Solo un Superadministrador puede otorgar el rol de SUPERADMIN.",
    };
  }

  try {
    const existing = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, email),
    });

    if (existing) {
      return {
        success: false,
        message: "Ya existe un usuario registrado con este correo electrónico.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await dbMysql.insert(schema.usuarios).values({
      nombre,
      email,
      passwordHash,
      rol,
      activo: true,
    });

    revalidatePath("/usuarios");
    return {
      success: true,
      message: `El usuario administrativo ${nombre} (${rol}) fue creado correctamente.`,
    };
  } catch (error) {
    console.error("Error en createStaffUserAction:", error);
    return {
      success: false,
      message: "Ocurrió un error al registrar el nuevo usuario administrativo.",
    };
  }
}

// 5. Eliminar usuario
export async function deleteUserAction(
  userId: number
): Promise<GenericActionResponse> {
  const session = await getSession();
  if (!session || session.rol !== "SUPERADMIN") {
    return {
      success: false,
      message: "Solo los Superadministradores pueden eliminar usuarios del sistema.",
    };
  }

  if (session.id === userId) {
    return {
      success: false,
      message: "No puedes eliminar tu propia cuenta mientras estás en sesión activa.",
    };
  }

  try {
    const targetUser = await dbMysql.query.usuarios.findFirst({
      where: eq(schema.usuarios.id, userId),
    });

    if (!targetUser) {
      return { success: false, message: "El usuario no fue encontrado." };
    }

    if (targetUser.rol === "SUPERADMIN") {
      const [{ countSuperadmins }] = await dbMysql
        .select({ countSuperadmins: count() })
        .from(schema.usuarios)
        .where(eq(schema.usuarios.rol, "SUPERADMIN"));

      if (countSuperadmins <= 1) {
        return {
          success: false,
          message: "No puedes eliminar al único Superadministrador del sistema.",
        };
      }
    }

    await dbMysql.delete(schema.usuarios).where(eq(schema.usuarios.id, userId));

    revalidatePath("/usuarios");
    return {
      success: true,
      message: `El usuario ${targetUser.nombre} ha sido eliminado permanentemente del sistema.`,
    };
  } catch (error) {
    console.error("Error en deleteUserAction:", error);
    return {
      success: false,
      message: "Ocurrió un error al eliminar el usuario.",
    };
  }
}
