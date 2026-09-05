import { NextRequest, NextResponse } from "next/server";
import { dbMysql, schema } from "@/lib/db/mysql";
import { desc, eq, like, and, or, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const tipoOperacionId = url.searchParams.get("tipoOperacionId");
    const estadoContable = url.searchParams.get("estadoContable");
    const medioPagoId = url.searchParams.get("medioPagoId");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search.trim()) {
      const q = search.trim();
      const matchedProviders = await dbMysql.select({ id: schema.proveedores.id })
        .from(schema.proveedores)
        .where(
          or(
            like(schema.proveedores.razonSocial, `%${q}%`),
            like(schema.proveedores.nit, `%${q}%`)
          )
        );
      
      const providerIds = matchedProviders.map(p => p.id);

      if (providerIds.length > 0) {
        conditions.push(
          or(
            like(schema.facturas.numeroFactura, `%${q}%`),
            like(schema.facturas.cufe, `%${q}%`),
            inArray(schema.facturas.proveedorId, providerIds)
          )
        );
      } else {
        conditions.push(
          or(
            like(schema.facturas.numeroFactura, `%${q}%`),
            like(schema.facturas.cufe, `%${q}%`)
          )
        );
      }
    }
    
    if (tipoOperacionId && !isNaN(Number(tipoOperacionId))) {
      conditions.push(eq(schema.facturas.tipoOperacionId, Number(tipoOperacionId)));
    }
    
    if (estadoContable && estadoContable !== "todos") {
      if (estadoContable === "CONCILIADA") {
        conditions.push(
          or(
            eq(schema.facturas.estadoContable, "CONCILIADA"),
            eq(schema.facturas.estadoContable, "PAGADA")
          )
        );
      } else if (estadoContable === "PENDIENTE_CONCILIACION") {
        conditions.push(eq(schema.facturas.estadoContable, "PENDIENTE_CONCILIACION"));
      } else {
        conditions.push(eq(schema.facturas.estadoContable, estadoContable as any));
      }
    }

    if (medioPagoId && !isNaN(Number(medioPagoId))) {
      conditions.push(eq(schema.facturas.medioPagoId, Number(medioPagoId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [facturasRaw, countResult] = await Promise.all([
      dbMysql.select().from(schema.facturas)
        .where(whereClause)
        .orderBy(desc(schema.facturas.fechaEmision), desc(schema.facturas.id))
        .limit(limit)
        .offset(offset),
      dbMysql.select({ count: sql<number>`count(*)` }).from(schema.facturas).where(whereClause)
    ]);

    const total = Number(countResult[0]?.count) || 0;

    // Fetch related master data in batch without LATERAL join
    const proveedorIds = [...new Set(facturasRaw.map(f => f.proveedorId).filter(Boolean))];
    const tipoOpIds = [...new Set(facturasRaw.map(f => f.tipoOperacionId).filter((id): id is number => id !== null))];
    const medioPagoIds = [...new Set(facturasRaw.map(f => f.medioPagoId).filter((id): id is number => id !== null))];
    const cuentaTesoreriaIds = [...new Set(facturasRaw.map(f => f.cuentaTesoreriaId).filter((id): id is number => id !== null))];
    const facturaIds = facturasRaw.map(f => f.id);

    const [proveedores, tiposOp, medios, cuentasTes, items, archivos] = await Promise.all([
      proveedorIds.length > 0
        ? dbMysql.select().from(schema.proveedores).where(inArray(schema.proveedores.id, proveedorIds))
        : [],
      tipoOpIds.length > 0
        ? dbMysql.select().from(schema.tiposOperacion).where(inArray(schema.tiposOperacion.id, tipoOpIds))
        : [],
      medioPagoIds.length > 0
        ? dbMysql.select().from(schema.mediosPago).where(inArray(schema.mediosPago.id, medioPagoIds))
        : [],
      cuentaTesoreriaIds.length > 0
        ? dbMysql.select().from(schema.cuentasTesoreria).where(inArray(schema.cuentasTesoreria.id, cuentaTesoreriaIds))
        : [],
      facturaIds.length > 0
        ? dbMysql.select().from(schema.facturaItems).where(inArray(schema.facturaItems.facturaId, facturaIds))
        : [],
      facturaIds.length > 0
        ? dbMysql.select().from(schema.facturaArchivos).where(inArray(schema.facturaArchivos.facturaId, facturaIds))
        : [],
    ]);

    const provMap = new Map(proveedores.map(p => [p.id, p]));
    const tipoOpMap = new Map(tiposOp.map(t => [t.id, t]));
    const medioMap = new Map(medios.map(m => [m.id, m]));
    const tesoreriaMap = new Map(cuentasTes.map(c => [c.id, c]));

    const facturas = facturasRaw.map(f => ({
      ...f,
      proveedor: f.proveedorId ? provMap.get(f.proveedorId) || null : null,
      tipoOperacion: f.tipoOperacionId ? tipoOpMap.get(f.tipoOperacionId) || null : null,
      medioPagoRel: f.medioPagoId ? medioMap.get(f.medioPagoId) || null : null,
      cuentaTesoreria: f.cuentaTesoreriaId ? tesoreriaMap.get(f.cuentaTesoreriaId) || null : null,
      items: items.filter(i => i.facturaId === f.id),
      archivos: archivos.filter(a => a.facturaId === f.id),
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
