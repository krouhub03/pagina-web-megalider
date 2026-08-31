"use server";

import { revalidatePath } from "next/cache";
import {
  crearPucCuenta,
  actualizarPucCuenta,
  eliminarPucCuenta,
} from "@/services/puc.service";
import { z } from "zod";

const pucSchema = z.object({
  codigo: z
    .string()
    .min(1, "El código es requerido")
    .max(10, "El código no debe superar 10 caracteres")
    .regex(/^[0-9]+$/, "El código solo debe contener números"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  nivel: z.number().int().min(1).max(5).optional(),
  naturaleza: z.enum(["Débito", "Crédito"]).optional(),
  descripcion: z.string().optional(),
});

export async function crearPucAction(formData: {
  codigo: string;
  nombre: string;
  nivel?: number;
  naturaleza?: string;
  descripcion?: string;
}) {
  const parse = pucSchema.safeParse(formData);
  if (!parse.success) {
    const errorMsg = parse.error.issues[0]?.message || "Datos inválidos";
    return { success: false, error: errorMsg };
  }

  const res = await crearPucCuenta(parse.data);
  if (res.success) {
    revalidatePath("/contabilidad/puc");
  }
  return res;
}

export async function actualizarPucAction(
  codigo: string,
  formData: {
    nombre?: string;
    nivel?: number;
    naturaleza?: string;
    descripcion?: string;
  }
) {
  if (!codigo || codigo.trim() === "") {
    return { success: false, error: "Código de cuenta no proporcionado" };
  }

  const res = await actualizarPucCuenta(codigo, formData);
  if (res.success) {
    revalidatePath("/contabilidad/puc");
  }
  return res;
}

export async function eliminarPucAction(codigo: string) {
  if (!codigo || codigo.trim() === "") {
    return { success: false, error: "Código de cuenta no proporcionado" };
  }

  const res = await eliminarPucCuenta(codigo);
  if (res.success) {
    revalidatePath("/contabilidad/puc");
  }
  return res;
}
