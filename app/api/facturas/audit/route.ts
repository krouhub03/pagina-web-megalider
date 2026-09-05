import { NextRequest, NextResponse } from "next/server";
import { dbPostgres, schema } from "@/lib/db/postgres";
import { eq, sql } from "drizzle-orm";

let migrationChecked = false;

export async function GET(req: NextRequest) {
  try {
    if (!migrationChecked) {
      try {
        await dbPostgres.execute(sql`ALTER TABLE facturas_auditoria_archivos ADD COLUMN IF NOT EXISTS datos_base64_censurada TEXT;`);
        migrationChecked = true;
      } catch (migErr) {
        console.warn("[Audit API] Advertencia en auto-migración de columna:", migErr);
      }
    }

    const facturas = await dbPostgres.query.facturasAuditoria.findMany({
      where: eq(schema.facturasAuditoria.estado, "PENDIENTE"),
      with: {
        archivos: true,
      },
      orderBy: (facturasAuditoria, { desc }) => [desc(facturasAuditoria.creadoEn)],
    });

    return NextResponse.json({ success: true, data: facturas });
  } catch (error: any) {
    console.error("[Audit API] Error obteniendo facturas de auditoría:", error);
    return NextResponse.json({ 
      error: error?.message || "Error interno del servidor",
      detail: String(error)
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, datosExtraidos } = body;

    if (!id || !datosExtraidos) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    await dbPostgres.update(schema.facturasAuditoria)
      .set({ datosExtraidos: JSON.stringify(datosExtraidos) })
      .where(eq(schema.facturasAuditoria.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando auditoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de factura no proporcionado" }, { status: 400 });
    }

    await dbPostgres.delete(schema.facturasAuditoria)
      .where(eq(schema.facturasAuditoria.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando auditoría:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
