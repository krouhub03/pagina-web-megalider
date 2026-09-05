import { NextRequest, NextResponse } from "next/server";
import { dbMysql, schema } from "@/lib/db/mysql";
import { desc, eq, like, and, or, sql, inArray } from "drizzle-orm";

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
      const matchedProviders = await dbMysql.select({ id: schema.proveedores.id })
        .from(schema.proveedores)
        .where(
          or(
            like(schema.proveedores.razonSocial, `%${search}%`),
            like(schema.proveedores.nit, `%${search}%`)
          )
        );
      
      const providerIds = matchedProviders.map(p => p.id);

      if (providerIds.length > 0) {
        conditions.push(
          or(
            like(schema.facturas.numeroFactura, `%${search}%`),
            inArray(schema.facturas.proveedorId, providerIds)
          )
        );
      } else {
        conditions.push(like(schema.facturas.numeroFactura, `%${search}%`));
      }
    }
    
    if (categoria) {
      // asercion a enum o dejar que TS falle si es invalido
      conditions.push(eq(schema.facturas.categoria, categoria as "INVENTARIO" | "OPEX" | "ACTIVOS"));
    }
    
    if (estado) {
      conditions.push(eq(schema.facturas.estadoPago, estado as "PAGADA" | "PENDIENTE" | "CREDITO_30_DIAS"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [facturasRaw, countResult] = await Promise.all([
      dbMysql.select().from(schema.facturas)
        .where(whereClause)
        .orderBy(desc(schema.facturas.fechaEmision))
        .limit(limit)
        .offset(offset),
      dbMysql.select({ count: sql<number>`count(*)` }).from(schema.facturas).where(whereClause)
    ]);

    const total = Number(countResult[0]?.count) || 0;

    // Fetch related data manually to avoid LATERAL join syntax error in MariaDB
    const proveedorIds = [...new Set(facturasRaw.map(f => f.proveedorId))];
    const facturaIds = facturasRaw.map(f => f.id);

    const proveedores = proveedorIds.length > 0 
      ? await dbMysql.select().from(schema.proveedores).where(inArray(schema.proveedores.id, proveedorIds))
      : [];
      
    const items = facturaIds.length > 0
      ? await dbMysql.select().from(schema.facturaItems).where(inArray(schema.facturaItems.facturaId, facturaIds))
      : [];

    const facturas = facturasRaw.map(f => ({
      ...f,
      proveedor: proveedores.find(p => p.id === f.proveedorId) || null,
      items: items.filter(i => i.facturaId === f.id)
    }));

    return NextResponse.json({
      success: true,
      data: facturas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error obteniendo facturas consolidadas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
