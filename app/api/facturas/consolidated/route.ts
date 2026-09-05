import { NextRequest, NextResponse } from "next/server";
import { dbMysql, schema } from "@/lib/db/mysql";
import { desc, eq, like, and, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const categoria = url.searchParams.get("categoria");
    const estado = url.searchParams.get("estado");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(schema.facturas.numeroFactura, `%${search}%`),
          // Buscamos si el nit o razón social del proveedor coincide, pero requiere JOIN
          // Usaremos una subquery o simplemente filtramos en memoria si es complejo, 
          // pero Drizzle permite hacerlo con `with` y filtrado manual o usando joins.
          // Para simplificar, asumimos que buscarán por número de factura o ajustamos
        )
      );
    }
    
    if (categoria) {
      // asercion a enum o dejar que TS falle si es invalido
      conditions.push(eq(schema.facturas.categoria, categoria as "INVENTARIO" | "OPEX" | "ACTIVOS"));
    }
    
    if (estado) {
      conditions.push(eq(schema.facturas.estadoPago, estado as "PAGADA" | "PENDIENTE" | "CREDITO_30_DIAS"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [facturas, countResult] = await Promise.all([
      dbMysql.query.facturas.findMany({
        where: whereClause,
        with: {
          proveedor: true,
          items: true,
        },
        orderBy: [desc(schema.facturas.fechaEmision)],
        limit,
        offset,
      }),
      dbMysql.select({ count: sql<number>`count(*)` }).from(schema.facturas).where(whereClause),
    ]);

    const totalCount = countResult[0].count;

    return NextResponse.json({
      success: true,
      data: facturas,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error obteniendo facturas consolidadas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
