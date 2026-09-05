import { NextResponse } from "next/server";
import { dbMysql } from "@/lib/db/mysql";
import { mediosPago } from "@/lib/db/mysql/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const methods = await dbMysql.select({
      id: mediosPago.id,
      nombre: mediosPago.nombre,
    })
    .from(mediosPago)
    .where(eq(mediosPago.activo, true));

    // Si no hay medios de pago, podríamos devolver unos por defecto, pero lo mejor es crearlos.
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching medios_pago:", error);
    return NextResponse.json({ error: "Error fetching medios_pago" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nombre } = await req.json();
    if (!nombre) return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });

    const insertResult = await dbMysql.insert(mediosPago).values({
      nombre: nombre.toUpperCase(),
    });

    return NextResponse.json({ success: true, id: insertResult[0].insertId });
  } catch (error) {
    console.error("Error creating medio_pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
