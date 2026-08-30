"use server";

import { revalidatePath } from "next/cache";
import {
  eliminarFactura,
  actualizarFactura,
  ActualizarFacturaInput,
  actualizarFacturaItem,
  crearFacturaItem,
  eliminarFacturaItem,
  FacturaItemInput,
} from "@/services/contabilidad.service";

export async function eliminarFacturaAction(facturaId: number) {
  const res = await eliminarFactura(facturaId);
  if (res.success) {
    revalidatePath("/contabilidad/facturas");
  }
  return res;
}

export async function actualizarFacturaAction(facturaId: number, datos: ActualizarFacturaInput) {
  const res = await actualizarFactura(facturaId, datos);
  if (res.success) {
    revalidatePath("/contabilidad/facturas");
    revalidatePath(`/contabilidad/facturas/${facturaId}`);
  }
  return res;
}

export async function actualizarFacturaItemAction(
  itemId: number,
  facturaId: number,
  datos: Partial<FacturaItemInput>
) {
  const res = await actualizarFacturaItem(itemId, datos, facturaId);
  if (res.success) {
    revalidatePath("/contabilidad/facturas");
    revalidatePath(`/contabilidad/facturas/${facturaId}`);
  }
  return res;
}

export async function crearFacturaItemAction(
  facturaId: number,
  datos: FacturaItemInput
) {
  const res = await crearFacturaItem(facturaId, datos);
  if (res.success) {
    revalidatePath("/contabilidad/facturas");
    revalidatePath(`/contabilidad/facturas/${facturaId}`);
  }
  return res;
}

export async function eliminarFacturaItemAction(
  itemId: number,
  facturaId: number
) {
  const res = await eliminarFacturaItem(itemId, facturaId);
  if (res.success) {
    revalidatePath("/contabilidad/facturas");
    revalidatePath(`/contabilidad/facturas/${facturaId}`);
  }
  return res;
}
