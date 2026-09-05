import { NextRequest, NextResponse } from "next/server";
import { dbPostgres, schema as pgSchema } from "@/lib/db/postgres";
import { dbMysql, schema as mysqlSchema } from "@/lib/db/mysql";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 1. Obtener la factura de PostgreSQL
    const auditInvoice = await dbPostgres.query.facturasAuditoria.findFirst({
      where: eq(pgSchema.facturasAuditoria.id, parseInt(id)),
    });

    if (!auditInvoice || !auditInvoice.datosExtraidos) {
      return NextResponse.json({ error: "Factura no encontrada o sin datos" }, { status: 404 });
    }

    const data = JSON.parse(auditInvoice.datosExtraidos);
    const invoiceData = data.factura_compra;
    
    if (!invoiceData) {
      return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
    }

    // El body puede traer la clasificación de la factura (INVENTARIO, OPEX, ACTIVOS) y estado_pago
    const body = await req.json().catch(() => ({}));
    const categoria = body.categoria || "INVENTARIO";
    const estadoPago = body.estadoPago || "PENDIENTE";

    // 2. Transacción manual en MySQL
    
    // a. Asegurar que el proveedor exista, si no crearlo
    let proveedorId;
    const existingProveedor = await dbMysql.query.proveedores.findFirst({
      where: eq(mysqlSchema.proveedores.nit, invoiceData.proveedor.nit),
    });

    if (existingProveedor) {
      proveedorId = existingProveedor.id;
    } else {
      const insertProvResult = await dbMysql.insert(mysqlSchema.proveedores).values({
        nit: invoiceData.proveedor.nit,
        razonSocial: invoiceData.proveedor.razon_social,
      });
      proveedorId = insertProvResult[0].insertId;
    }

    // b. Insertar factura
    const fechaEmisionParts = invoiceData.fecha_emision.split('/');
    // Suponiendo formato DD/MM/YYYY o YYYY-MM-DD. Simple parsing:
    let fechaEmision = new Date();
    if (fechaEmisionParts.length === 3) {
      if (fechaEmisionParts[0].length === 4) {
        fechaEmision = new Date(invoiceData.fecha_emision);
      } else {
        fechaEmision = new Date(`${fechaEmisionParts[2]}-${fechaEmisionParts[1]}-${fechaEmisionParts[0]}`);
      }
    }

    const insertInvoiceResult = await dbMysql.insert(mysqlSchema.facturas).values({
      numeroFactura: invoiceData.numero_factura,
      proveedorId: proveedorId,
      fechaEmision: fechaEmision,
      totalFactura: invoiceData.totales?.total_factura || "0.00",
      categoria: categoria,
      estadoPago: estadoPago,
    });
    const newInvoiceId = insertInvoiceResult[0].insertId;

    // c. Insertar items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: any) => ({
        facturaId: newInvoiceId,
        descripcion: item.descripcion,
        cantidad: item.cantidad_ingresada,
        precioUnitario: item.costo_unitario_compra,
        subtotal: item.costo_total_linea,
      }));
      await dbMysql.insert(mysqlSchema.facturaItems).values(itemsToInsert);
    }

    // 3. Purga en PostgreSQL
    await dbPostgres.delete(pgSchema.facturasAuditoria).where(eq(pgSchema.facturasAuditoria.id, parseInt(id)));

    return NextResponse.json({ success: true, message: "Factura aprobada y movida a histórico" });
  } catch (error) {
    console.error("Error en aprobación de factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
