import { NextRequest, NextResponse } from "next/server";
import { dbPostgres, schema as pgSchema } from "@/lib/db/postgres";
import { dbMysql, schema as mysqlSchema } from "@/lib/db/mysql";
import { eq, and } from "drizzle-orm";

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
    const invoiceData = data.factura_compra || data;
    
    if (!invoiceData || !invoiceData.proveedor) {
      return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
    }

    // El body puede traer observaciones adicionales
    const body = await req.json().catch(() => ({}));
    const observaciones = body.observaciones || invoiceData.observaciones || null;

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

    const existingFactura = await dbMysql.query.facturas.findFirst({
      where: and(
        eq(mysqlSchema.facturas.proveedorId, proveedorId),
        eq(mysqlSchema.facturas.numeroFactura, invoiceData.numero_factura)
      )
    });

    if (existingFactura) {
      return NextResponse.json({
        success: false,
        error: `La factura N° ${invoiceData.numero_factura} ya existe para este proveedor en el Historial.`
      }, { status: 400 });
    }

    // b. Insertar factura
    const parseDate = (dString: string) => {
      if (!dString) return null;
      if (dString.includes('-')) return new Date(dString);
      const parts = dString.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(dString.replace(/\//g, '-'));
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dString); // fallback
    };
    
    const parseDateToString = (dateStr: any) => {
      const d = parseDate(dateStr);
      if (!d) return null;
      return d.toISOString().split('T')[0];
    };

    const fechaEmision = parseDateToString(invoiceData.fecha_emision) || new Date().toISOString().split('T')[0];
    const fechaVencimiento = parseDateToString(invoiceData.fecha_vencimiento);

    const insertInvoiceResult = await dbMysql.insert(mysqlSchema.facturas).values({
      numeroFactura: invoiceData.numero_factura,
      cufe: invoiceData.cufe || null,
      proveedorId: proveedorId,
      fechaEmision: fechaEmision,
      fechaVencimiento: fechaVencimiento,
      clienteDocumento: invoiceData.cliente_receptor?.documento || null,
      clienteNombre: invoiceData.cliente_receptor?.nombre || null,
      tipoDocumento: invoiceData.tipo_documento || null,
      medioPago: invoiceData.condiciones_comerciales?.medio_pago || null,
      condicionPago: (invoiceData.condiciones_comerciales?.plazo_dias || invoiceData.condiciones_comerciales?.forma_pago || null)?.toString(),
      subtotal: invoiceData.totales?.subtotal || "0.00",
      descuentoTotalFactura: invoiceData.totales?.descuento_total_factura || "0.00",
      iva: String((Number(invoiceData.totales?.iva_19 || 0) + Number(invoiceData.totales?.iva_5 || 0))),
      impoconsumo: invoiceData.totales?.impoconsumo_total || "0.00",
      ibuaIpcu: invoiceData.totales?.ibua_ipcu || "0.00",
      otrosImpuestosTotal: invoiceData.totales?.otros_impuestos_total || "0.00",
      totalFactura: invoiceData.totales?.total_factura || "0.00",
      archivoUrl: null,
      observaciones: observaciones,
    });
    const newInvoiceId = insertInvoiceResult[0].insertId;

    // c. Insertar items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: any) => ({
        facturaId: newInvoiceId,
        codigoBarras: item.codigo_barras || null,
        codigoProveedor: item.codigo_proveedor || null,
        nombreProducto: item.nombre_producto || item.nombre || item.descripcion || "",
        cantidadIngresada: item.cantidad_ingresada,
        unidadMedida: item.unidad_medida || 'UND',
        costoUnitarioCompra: item.costo_unitario_compra,
        descuentoPorProducto: item.descuento_por_producto || "0.00",
        ivaTotal: item.iva_total || "0.00",
        impuestoConsumo: item.impoconsumo || "0.00",
        otrosImpuestos: item.otros_impuestos || "0.00",
        costoTotalLinea: item.costo_total_linea,
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
