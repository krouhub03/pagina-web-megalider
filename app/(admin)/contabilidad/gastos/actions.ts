"use server";

import { revalidatePath } from "next/cache";
import {
  crearEgreso,
  CrearEgresoInput,
  corregirEgreso,
  eliminarEgreso,
} from "@/services/contabilidad.service";

export async function crearEgresoAction(datos: CrearEgresoInput) {
  const res = await crearEgreso(datos);
  if (res.success) {
    revalidatePath("/contabilidad/gastos");
    revalidatePath("/contabilidad");
  }
  return res;
}

export async function corregirEgresoAction(params: {
  egresoId: number;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo: string;
  corregidoPor: string;
}) {
  const res = await corregirEgreso(params);
  if (res.success) {
    revalidatePath("/contabilidad/gastos");
    revalidatePath("/contabilidad");
  }
  return res;
}

export async function eliminarEgresoAction(egresoId: number) {
  const res = await eliminarEgreso(egresoId);
  if (res.success) {
    revalidatePath("/contabilidad/gastos");
    revalidatePath("/contabilidad");
  }
  return res;
}
